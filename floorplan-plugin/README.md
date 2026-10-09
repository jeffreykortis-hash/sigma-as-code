# Allocation floor-plan plugin

Sigma custom plugin that renders the Waterville, ME facility floor plan and colours each room by allocated units
from the Theory MA Allocation run. Click a room to see its lines, set a workbook control variable and fire an action.

## Run
    npm install
    npm run dev        # register http://localhost:5173 in Sigma: Administration > Plugins
    npm test           # product-line / vendor routing logic
    python3 -I scripts/extract_allocation.py <Theory_MA_Allocation.xlsx> data   # refresh sample data

With no source configured the plugin shows the bundled sample run (`data/allocation.json`).

## Wiring in Sigma
Load `data/allocation_facts.csv` (or the warehouse equivalent) as a table, add the plugin, then map:
source room, units, section, destination, category, product, vendor. Room text is matched to zones by alias
(`src/zones.js`); override with the "Room → zone overrides" JSON, e.g. `{"(b) vault - finished goods": "vault"}`.

## Matching rules (`src/classify.js`)
- Product line = the repurposed `ALLERGENS` field, `Form | Size | Brand` (join sales to catalog on PRODUCTID).
- Line routes to the smallest goal-row list containing its product line; blank/unlisted falls back to MED vs REC in category; MED and REC never mix.
- Ties: cannabinoid in the internal name (THC resolves last), then brand tokens; still tied => flagged as a goal-sheet error.
- Vendor blank or containing "Theory Wellness" => Theory produced (wholesale-eligible); otherwise third party (never wholesale).
