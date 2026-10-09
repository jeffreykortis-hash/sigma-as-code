"""Flatten the Theory MA Allocation workbook into one fact table (CSV + JSON) for the floor-plan plugin.

usage: python3 -I extract_allocation.py <allocation.xlsx> <out_dir>
"""
import sys, json, re
import pandas as pd

src, out = sys.argv[1], sys.argv[2]
x = pd.read_excel(src, sheet_name=None, header=None)

def tables(name, first):
    d, res, i = x[name], [], 0
    while i < len(d):
        if str(d.iat[i, 0]) == first:
            hdr = [str(v) for v in d.iloc[i].tolist()]
            j, rows = i + 1, []
            while j < len(d) and not d.iloc[j].isna().all():
                rows.append(d.iloc[j].tolist()); j += 1
            res.append(pd.DataFrame(rows, columns=hdr)); i = j
        else:
            i += 1
    return res

ZONE = [  # source-room text -> floor-plan zone id
    (r'MIP', 'mip'), (r'Hold for Theory', 'vault'), (r'Vault', 'vault'),
    (r'Sales Floor|Retail', 'retail'), (r'Extraction', 'extraction'),
]
def zone(room):
    for pat, z in ZONE:
        if re.search(pat, str(room), re.I): return z
    return 'warehouse'

facts = []
def add(section, dest, t):
    for _, r in t.iterrows():
        if pd.isna(r.get('Product')) or pd.isna(r.get('Total Units')): continue
        room = str(r['Source Room'])
        if re.fullmatch(r'(ABOVE MAX|IN BAND|BELOW FLOOR|OUT OF STOCK|NO STOCK, NO SALES)', room):
            continue  # store health rows, not pick lines
        prod = str(r['Product'])
        facts.append(dict(
            section=section, destination=dest, source_room=re.sub(r'\s*\(\d+\)', '', room), zone=zone(room),
            category=r['Category'], sub_line=r['Sub-line'], product=prod, batch=r['Batch'],
            units=float(r['Total Units']), cases=None if pd.isna(r.get('Cases')) else float(r['Cases']),
            flag=None if pd.isna(r.get('Flag')) else r['Flag'],
            expiration=None if pd.isna(r.get('Expiration')) else str(r['Expiration'])[:10],
            med_rec='MED' if re.match(r'\s*MED\b', prod) else 'REC',
            vendor_class='Theory'))  # pick/wholesale/unallocated are Theory-produced only (vendor logic rule 1)

for s in ['BW', 'Chicopee', 'GB', 'Medford']:
    for t in tables(f'Pick - {s}', 'Store/Location'): add('Pick', s, t)
for t in tables('Wholesale', 'Store/Location'): add('Wholesale', 'Wholesale', t)
for t in tables('Unallocated', 'Store/Location'): add('Unallocated', 'Vault (unplaced)', t)

# critical items (Summary)
d = x['Summary']; crit = []
i = d.index[d.iloc[:, 0].astype(str) == 'Item'][0] + 1
while i < len(d) and not d.iloc[i].isna().all():
    r = d.iloc[i].tolist()
    crit.append(dict(item=r[0], store=r[1], on_hand=r[2], doh=r[3], min_doh=r[4], status=r[5], gap=r[6], fix=r[7])); i += 1

# action items
act = [dict(text=str(d.iat[k, 0]), link=None if pd.isna(d.iat[k, 1]) else str(d.iat[k, 1]))
       for k in range(len(d)) if str(d.iat[k, 0]).startswith(('Critical items', 'Directed', 'Pending', 'Third-party', 'Wholesale pull', 'Store rebalance', 'Marketing', 'Aging', 'FIFO', 'Zero-sales', 'Suspect', 'SKU low', 'MED presence', 'Unallocated', 'New-product'))]

df = pd.DataFrame(facts)
df.to_csv(f'{out}/allocation_facts.csv', index=False)
json.dump(dict(asOf='2026-10-06', runDate='2026-10-07', engine='v6.11', facts=facts, critical=crit, actions=act),
          open(f'{out}/allocation.json', 'w'), default=str)
print(len(df), 'fact rows;', len(crit), 'critical;', len(act), 'actions')
print(df.groupby(['section', 'zone']).units.sum())
