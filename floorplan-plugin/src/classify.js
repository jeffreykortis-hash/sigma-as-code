// Product-line (“allergens” field) matching and vendor logic for Theory MA allocation.
// Pure functions, no Sigma/DOM dependencies, so they are unit-testable (see test/classify.test.js).

const norm = (s) => String(s ?? '').trim().toLowerCase();

/** "Distillate Cart | 1.0g | Theory Wellness" -> { form, size, brand, raw } (blank-safe). */
export function parseProductLine(raw) {
  const [form = '', size = '', brand = ''] = String(raw ?? '').split('|').map((s) => s.trim());
  return { form, size, brand, raw: [form, size, brand].filter(Boolean).join(' | ') };
}

/** Vendor logic: blank or contains "Theory Wellness" => Theory produced; otherwise third party. */
export function vendorClass(vendor) {
  const v = norm(vendor);
  return v === '' || v.includes('theory wellness') ? 'Theory' : 'ThirdParty';
}
/** Only Theory-produced product is eligible for wholesale; third party is never allocated into it. */
export const wholesaleEligible = (vendor) => vendorClass(vendor) === 'Theory';

export const medOrRec = (name) => (/^\s*med\b/i.test(String(name ?? '')) ? 'MED' : 'REC');

// THC resolves last, so "THC 1mg / CBN 1mg" lands on the CBN row.
const CANNABINOIDS = ['cbn', 'cbd', 'cbg', 'cbc', 'thcv', 'thc'];
export function cannabinoidsIn(name) {
  const n = norm(name);
  return CANNABINOIDS.filter((c) => new RegExp(`\\b${c}\\b`).test(n));
}
export function resolvingCannabinoid(name) {
  const found = cannabinoidsIn(name);
  return found.find((c) => c !== 'thc') ?? found[0] ?? null;
}

/**
 * Route one inventory/sales line to exactly one Menu Health goal row.
 * line: { category, name, productLine, medRec? }
 * rows: [{ id, category, medRec: 'MED'|'REC', productLines: string[], cannabinoid?, brandTokens?: string[] }]
 * Returns { row, via, tie?: row[] }.  tie is set when the goal sheet is ambiguous (flag, never resolve).
 */
export function routeLine(line, rows) {
  const medRec = line.medRec ?? medOrRec(line.name);
  const pl = norm(parseProductLine(line.productLine).raw);
  const inCat = rows.filter((r) => norm(r.category) === norm(line.category) && r.medRec === medRec); // MED and REC never mix

  let cands = pl ? inCat.filter((r) => (r.productLines ?? []).some((p) => norm(parseProductLine(p).raw) === pl)) : [];
  if (!cands.length) {
    // blank / unlisted product line -> MED vs REC fallback within the category
    const fb = inCat.filter((r) => !(r.productLines ?? []).length);
    return fb.length === 1 ? { row: fb[0], via: 'fallback' } : fb.length > 1 ? { row: null, via: 'fallback', tie: fb } : { row: null, via: 'none' };
  }

  const smallest = Math.min(...cands.map((r) => r.productLines.length));
  cands = cands.filter((r) => r.productLines.length === smallest);
  if (cands.length === 1) return { row: cands[0], via: 'product-line' };

  const cb = resolvingCannabinoid(line.name);
  if (cb) {
    const byCb = cands.filter((r) => norm(r.cannabinoid) === cb);
    if (byCb.length) cands = byCb;
  }
  if (cands.length > 1) {
    const hay = norm(`${line.name} ${line.productLine}`);
    const byBrand = cands.filter((r) => (r.brandTokens ?? []).length && r.brandTokens.every((t) => hay.includes(norm(t))));
    if (byBrand.length) cands = byBrand;
  }
  return cands.length === 1 ? { row: cands[0], via: 'tie-break' } : { row: null, via: 'tie', tie: cands };
}

/** Third-party edible name -> { form, doseMg, flavor }, e.g. "Wyld Gummies - Strawberry 20:1 CBD:THC - 20pk". */
export function parseEdible(name) {
  const n = String(name ?? '');
  const dose = n.match(/(\d+(?:\.\d+)?)\s*mg/i);
  const form = (n.match(/gumm|chocolate|chew|mint|beverage|seltzer/i) || [''])[0].toLowerCase();
  const parts = n.split(' - ').map((s) => s.trim());
  const flavor = parts.find((p, i) => i > 0 && !/\d+\s*(mg|pk|g)\b|thc|cbd|cbn/i.test(p)) ?? '';
  return { form, doseMg: dose ? Number(dose[1]) : null, flavor };
}
