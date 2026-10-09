# theory-floorplan

Sigma plugin (single file, `@sigmacomputing/plugin` SDK) that draws the Waterville, ME floor plan and colours each
room by allocated units from the Theory MA allocation run. Follows the millersigma plugin conventions
(unpkg SDK, `synth()` fallback when unbound, no animation loops, `ResizeObserver` on the stage).

`index.html` is generated: `node build.mjs` combines `template.html` with the zone geometry in
`../../floorplan-plugin/src/zones.js`. Edit those, never `index.html`.

## Editor panel
| name | type | notes |
|---|---|---|
| `source` | element | allocation lines table |
| `room` | column | source room text, e.g. `(B) Vault - Finished Goods`, matched to zones by alias |
| `units` | column (number) | |
| `section` | column | optional: Pick / Wholesale / Unallocated, drives the section toggle |
| `category` | column | optional: breakdown shown when a room is clicked |
| `selectedZone` | variable | optional: set to the clicked room name |
| `onZoneSelect` | action-trigger | optional: fired after `selectedZone` is set |
| `zoneMap` | text (JSON) | room-text -> zone id overrides, e.g. `{"(b) vault - finished goods":"vault"}` |

## Register and host (per the millersigma flow)
1. Host the file at a real `text/html` URL. millersigma's own convention is GitHub Pages on that repo:
   `https://cmiller-coder.github.io/millersigma/plugins/theory-floorplan/index.html` (copy this folder to its `plugins/`
   and push). jsDelivr serves `.html` as `text/plain` and breaks rendering and PNG export.
2. `python3 scripts/register_plugin.py <BASE_URL> <TOKEN> "Allocation Floor Plan" "<hosted-url>"` -> `pluginId`
   (no update endpoint: a URL change means a new `pluginId`).
3. Embed `{kind:"plugin", pluginId, config:{source:{kind:"element", elementId}, room:"<colId>", units:"<colId>", ...}}`
   bound to a dedicated data element (bare column-id strings, keys as in the table above).
