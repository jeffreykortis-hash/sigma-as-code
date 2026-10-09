// Waterville, ME floor plan, in the source drawing's pixel space (viewBox below).
// type drives the area colour exactly like the drawing legend: cultivation / manufacturing / medical / retail / other.
export const VIEWBOX = '290 150 1140 1190';

export const AREA = {
  cultivation: { label: 'Cultivation Area', fill: '#d9ffd5' },
  manufacturing: { label: 'Manufacturing Area', fill: '#d5d5ff' },
  medical: { label: 'Medical/AU Manufacturing', fill: '#f4d5f4' },
  retail: { label: 'Retail Area', fill: '#fbdcc8' },
};

// rect: [x, y, w, h]; poly: flat [x,y,...]. aliases: lower-case substrings matched against Sigma "room" text.
export const ZONES = [
  { id: 'warehouse', name: 'Warehouse', type: 'cultivation', poly: [1112,236,1295,236,1295,390,1355,390,1355,1122,1175,1122,1175,1052,690,1052,690,666,1112,666], label: [1235, 545], aliases: ['warehouse'] },
  { id: 'cult1', name: 'Cultivation Storage #1', type: 'cultivation', rect: [340,261,66,270], aliases: ['cultivation storage'] },
  { id: 'dry1', name: 'Dry Room 1 #2', type: 'cultivation', rect: [420,261,63,270], aliases: ['dry room 1'] },
  { id: 'dry2', name: 'Dry Room 2 #3', type: 'cultivation', rect: [493,261,60,270], aliases: ['dry room 2'] },
  { id: 'cult4', name: 'Cultivation Pod #4', type: 'cultivation', rect: [563,261,63,270], aliases: ['pod #4', 'pod 4'] },
  { id: 'trim', name: 'Trim Room', type: 'cultivation', rect: [336,582,244,110], aliases: ['trim'] },
  { id: 'cult5', name: 'Cultivation Pod #5', type: 'cultivation', rect: [352,752,64,273], aliases: ['pod #5', 'pod 5'] },
  { id: 'cult6', name: 'Cultivation Pods #6', type: 'cultivation', rect: [416,752,65,273], aliases: ['pod #6', 'pod 6'] },
  { id: 'cult7', name: 'Cultivation Pod #7', type: 'cultivation', rect: [482,752,65,273], aliases: ['pod #7', 'pod 7'] },
  { id: 'cult8', name: 'Cultivation Pod #8', type: 'cultivation', rect: [548,752,63,273], aliases: ['pod #8', 'pod 8'] },
  { id: 'boiler', name: 'Boiler Room', type: 'manufacturing', rect: [661,236,339,196], aliases: ['boiler'] },
  { id: 'etoh', name: 'ETOH Extraction', type: 'manufacturing', rect: [661,432,296,88], aliases: ['etoh'] },
  { id: 'seltzer', name: 'Seltzer/Beverage Lab', type: 'manufacturing', rect: [661,520,264,145], aliases: ['seltzer', 'beverage lab'] },
  { id: 'extraction', name: 'Extraction', type: 'medical', rect: [925,490,185,175], aliases: ['extraction'] },
  { id: 'mip', name: 'MIP Lab', type: 'medical', rect: [961,357,149,163], aliases: ['mip'] },
  { id: 'cage', name: 'Cage', type: 'manufacturing', rect: [1019,674,85,95], aliases: ['cage'] },
  { id: 'pod13', name: 'Cultivation Pod #13', type: 'cultivation', rect: [693,734,313,53], aliases: ['pod #13'] },
  { id: 'pod12', name: 'Cultivation Pods #12', type: 'cultivation', rect: [693,789,313,53], aliases: ['pod #12'] },
  { id: 'msp11', name: 'Manufacturing Storage Pod #11', type: 'manufacturing', rect: [693,855,313,53], aliases: ['storage pod #11'] },
  { id: 'msp10', name: 'Manufacturing Storage Pod #10', type: 'manufacturing', rect: [693,910,313,53], aliases: ['storage pod #10'] },
  { id: 'msp9', name: 'Manufacturing Storage Pod #9', type: 'manufacturing', rect: [693,966,313,53], aliases: ['storage pod #9'] },
  { id: 'vault', name: 'Vault', type: 'manufacturing', rect: [334,1056,156,79], aliases: ['vault'] },
  { id: 'security', name: 'Security/NVR', type: 'cultivation', rect: [498,1056,58,56], aliases: ['security', 'nvr'] },
  { id: 'office', name: 'Office Space', type: 'cultivation', rect: [334,1140,346,110], aliases: ['office'] },
  { id: 'retail', name: 'Retail', type: 'retail', rect: [700,1108,472,147], aliases: ['retail', 'sales floor'] },
  { id: 'bath', name: 'Bathroom', type: 'cultivation', rect: [888,1056,140,52], aliases: ['bathroom'] },
  { id: 'uniform', name: 'Uniform Room', type: 'cultivation', rect: [1178,1055,172,100], aliases: ['uniform'] },
  { id: 'noncann', name: 'Non-cannabis Storage', type: 'cultivation', rect: [1178,1160,227,92], aliases: ['non-cannabis'] },
];

export const EXITS = [
  { name: 'Grow Facility Entrance', x: 1098, y: 210 },
  { name: 'Exit', x: 680, y: 1285 },
  { name: 'Retail Entrance/Exit', x: 1135, y: 1290 },
];

// Fire escape paths from the drawing: [x1,y1,x2,y2]
export const ESCAPE = [
  [382,557,592,557], [386,721,590,721], [640,283,640,1005], [794,343,996,343], [1092,276,1092,640],
  [750,645,1082,645], [680,1040,680,1240], [1306,1038,1156,1038], [880,1212,1034,1212], [1103,1178,1103,1244],
];

export function zoneOfRoom(room, zoneMap = {}) {
  const r = String(room ?? '').toLowerCase();
  if (zoneMap[r]) return zoneMap[r];
  // longest alias wins so "storage pod #11" beats "pod"
  let best = null, len = 0;
  for (const z of ZONES) for (const a of z.aliases ?? []) if (r.includes(a) && a.length > len) { best = z.id; len = a.length; }
  return best;
}
