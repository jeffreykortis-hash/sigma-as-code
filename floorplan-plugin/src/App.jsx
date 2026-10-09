import { useMemo, useState } from 'react';
import { client, useConfig, useElementData, useElementColumns, useVariable } from '@sigmacomputing/plugin';
import FloorPlan from './FloorPlan.jsx';
import { ZONES, zoneOfRoom } from './zones.js';
import { vendorClass, medOrRec } from './classify.js';
import demo from '../data/allocation.json';

client.config.configureEditorPanel([
  { name: 'source', type: 'element', label: 'Allocation lines' },
  { name: 'room', type: 'column', source: 'source', allowMultiple: false, label: 'Source room / zone' },
  { name: 'units', type: 'column', source: 'source', allowMultiple: false, allowedTypes: ['number', 'integer'], label: 'Units' },
  { name: 'section', type: 'column', source: 'source', allowMultiple: false, label: 'Section (Pick / Wholesale / Unallocated)' },
  { name: 'destination', type: 'column', source: 'source', allowMultiple: false, label: 'Destination store' },
  { name: 'category', type: 'column', source: 'source', allowMultiple: false, label: 'Category' },
  { name: 'product', type: 'column', source: 'source', allowMultiple: false, label: 'Product (internal name)' },
  { name: 'vendor', type: 'column', source: 'source', allowMultiple: false, label: 'Vendor (blank = Theory)' },
  { name: 'selectedZone', type: 'variable', label: 'Selected zone (text control)' },
  { name: 'onZoneSelect', type: 'action-trigger', label: 'On zone select' },
  { name: 'zoneMap', type: 'text', label: 'Room → zone overrides (JSON)', defaultValue: '{}', multiline: true },
]);

const fmt = (n) => Math.round(n).toLocaleString();
const SECTION_COLOR = { Pick: '#2f6fe4', Wholesale: '#1f9d6b', Unallocated: '#c98a14' };

function useRows(config) {
  const data = useElementData(config.source || '');
  const cols = useElementColumns(config.source || '');
  return useMemo(() => {
    if (!config.source || !config.room || !config.units || !data[config.units]) {
      return { demo: true, rows: demo.facts.map((f) => ({ ...f, room: f.source_room, vendorClass: f.vendor_class })) };
    }
    const n = data[config.units].length;
    const get = (k, i) => (config[k] && data[config[k]] ? data[config[k]][i] : null);
    const rows = Array.from({ length: n }, (_, i) => ({
      room: get('room', i), units: Number(get('units', i)) || 0, section: get('section', i) ?? 'Pick',
      destination: get('destination', i), category: get('category', i), product: get('product', i),
      vendorClass: vendorClass(get('vendor', i)), med_rec: medOrRec(get('product', i)),
    }));
    return { demo: false, rows, cols };
  }, [config, data, cols]);
}

export default function App() {
  const config = useConfig();
  const { demo: isDemo, rows } = useRows(config);
  const [section, setSection] = useState('All');
  const [mode, setMode] = useState('heat');
  const [local, setLocal] = useState(null);
  const [, setVar] = useVariable(config.selectedZone || '');
  let zoneMap = {};
  try { zoneMap = JSON.parse(config.zoneMap || '{}'); } catch { /* ignore bad JSON */ }

  const selected = local;
  const select = async (id) => {
    setLocal(id);
    if (config.selectedZone) await setVar(id ? ZONES.find((z) => z.id === id).name : '');
    if (config.onZoneSelect) await client.triggerAction(config.onZoneSelect);
  };

  const scoped = useMemo(() => rows.filter((r) => section === 'All' || r.section === section)
    .map((r) => ({ ...r, zone: isDemo ? r.zone : zoneOfRoom(r.room, zoneMap) })), [rows, section, isDemo, config.zoneMap]);
  const totals = useMemo(() => scoped.reduce((a, r) => (r.zone ? { ...a, [r.zone]: (a[r.zone] || 0) + r.units } : a), {}), [scoped]);
  const unmapped = scoped.filter((r) => !r.zone).reduce((s, r) => s + r.units, 0);

  const kpis = useMemo(() => {
    const by = (s) => rows.filter((r) => r.section === s).reduce((a, r) => a + r.units, 0);
    return [['Placed to stores', by('Pick')], ['Wholesale', by('Wholesale')], ['Left in vault', by('Unallocated')]];
  }, [rows]);

  const zoneRows = useMemo(() => (selected ? scoped.filter((r) => r.zone === selected) : []), [scoped, selected]);
  const byCat = useMemo(() => Object.entries(zoneRows.reduce((a, r) => ({ ...a, [r.category || '—']: (a[r.category || '—'] || 0) + r.units }), {}))
    .sort((a, b) => b[1] - a[1]), [zoneRows]);
  const sel = ZONES.find((z) => z.id === selected);
  const critical = isDemo ? demo.critical.filter((c) => c.status !== 'OK') : [];

  return (
    <main className="app">
      <header className="bar">
        <div>
          <h1>Allocation floor plan</h1>
          <p className="sub">{isDemo ? `Sample data — Theory MA allocation, as-of ${demo.asOf}, run ${demo.runDate} (engine ${demo.engine}). Connect a source in the editor panel.` : 'Live from workbook element'}</p>
        </div>
        <div className="ctl">
          <div className="seg" role="group" aria-label="Section">
            {['All', 'Pick', 'Wholesale', 'Unallocated'].map((s) => (
              <button key={s} className={section === s ? 'on' : ''} onClick={() => setSection(s)}>{s}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Colour">
            {[['heat', 'Heat'], ['area', 'Areas']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}
          </div>
        </div>
      </header>

      <section className="kpis">
        {kpis.map(([l, v]) => <div key={l} className="kpi"><span>{l}</span><b>{fmt(v)}</b><i style={{ background: SECTION_COLOR[{ 'Placed to stores': 'Pick', Wholesale: 'Wholesale', 'Left in vault': 'Unallocated' }[l]] }} /></div>)}
        <div className="kpi"><span>Critical items needing action</span><b>{isDemo ? critical.length : '—'}</b><i style={{ background: '#d33' }} /></div>
      </section>

      <div className="grid">
        <div className="planwrap"><FloorPlan totals={totals} selected={selected} onSelect={select} mode={mode} fmt={fmt} /></div>
        <aside className="side">
          {sel ? (
            <>
              <h2>{sel.name}</h2>
              <p className="sub">{fmt(totals[sel.id] || 0)} units · {zoneRows.length} lines</p>
              {byCat.map(([c, u]) => (
                <div key={c} className="bar-row"><span>{c}</span><div><em style={{ width: `${(u / byCat[0][1]) * 100}%` }} /></div><b>{fmt(u)}</b></div>
              ))}
              <table><thead><tr><th>Product</th><th>To</th><th>Units</th></tr></thead>
                <tbody>{[...zoneRows].sort((a, b) => b.units - a.units).slice(0, 12).map((r, i) => (
                  <tr key={i}><td title={r.product}>{r.med_rec === 'MED' && <span className="tag">MED</span>}{r.product}</td><td>{r.destination}</td><td>{fmt(r.units)}</td></tr>
                ))}</tbody></table>
            </>
          ) : (
            <>
              <h2>Needs attention</h2>
              <p className="sub">Click a room for its allocation lines.{unmapped ? ` ${fmt(unmapped)} units sit in rooms not on the plan.` : ''}</p>
              {critical.map((c) => (
                <div key={c.item} className={`crit ${c.status.startsWith('BELOW') ? 'red' : 'amber'}`}>
                  <b>{c.item}</b><span>{c.status} · {c.doh}d vs {c.min_doh}d min · gap {fmt(c.gap)}u</span>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
