// Assembles index.html (single file, the millersigma plugin convention) from template.html + the shared zone geometry.
import { readFileSync, writeFileSync } from 'node:fs';
import { VIEWBOX, AREA, ZONES, EXITS, ESCAPE } from '../../floorplan-plugin/src/zones.js';
const area = Object.fromEntries(Object.entries(AREA).map(([k, v]) => [k, v.fill]));
const zones = ZONES.map(({ id, name, type, rect, poly, label, aliases }) => ({ id, name, type, rect, poly, label, aliases }));
const html = readFileSync(new URL('./template.html', import.meta.url), 'utf8')
  .replace('__VIEWBOX__', VIEWBOX).replace('__ZONES__', JSON.stringify(zones)).replace('__AREA__', JSON.stringify(area))
  .replace('__EXITS__', JSON.stringify(EXITS)).replace('__ESCAPE__', JSON.stringify(ESCAPE));
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html', html.length, 'bytes');
