import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProductLine, vendorClass, wholesaleEligible, routeLine, medOrRec } from '../src/classify.js';

const PL = 'Gummy | 10pk | Theory Wellness';
const rows = [
  { id: 'thc', category: 'Gummies', medRec: 'REC', productLines: [PL, 'Gummy | 20pk | Theory Wellness'], cannabinoid: 'thc' },
  { id: 'cbn', category: 'Gummies', medRec: 'REC', productLines: [PL, 'Gummy | 20pk | Theory Wellness'], cannabinoid: 'cbn' },
  { id: 'wide', category: 'Gummies', medRec: 'REC', productLines: [PL, 'Gummy | 20pk | Theory Wellness', 'Gummy | 5pk | Theory Wellness'], cannabinoid: 'thc' },
  { id: 'only5', category: 'Gummies', medRec: 'REC', productLines: ['Gummy | 5pk | Theory Wellness'] },
  { id: 'jeeter2', category: 'Preroll', medRec: 'REC', productLines: ['Preroll | 2g | Jeeter'], brandTokens: ['jeeter'] },
  { id: 'rec-default', category: 'Preroll', medRec: 'REC', productLines: [] },
  { id: 'med-default', category: 'Preroll', medRec: 'MED', productLines: [] },
];

test('parses Form | Size | Brand', () => {
  assert.deepEqual(parseProductLine('Distillate Cart | 1.0g | Theory Wellness'),
    { form: 'Distillate Cart', size: '1.0g', brand: 'Theory Wellness', raw: 'Distillate Cart | 1.0g | Theory Wellness' });
  assert.equal(parseProductLine(null).raw, '');
});
test('vendor logic', () => {
  assert.equal(vendorClass(''), 'Theory');
  assert.equal(vendorClass(null), 'Theory');
  assert.equal(vendorClass('Theory Wellness LLC'), 'Theory');
  assert.equal(vendorClass('Jeeter Inc'), 'ThirdParty');
  assert.equal(wholesaleEligible('Jeeter Inc'), false);
});
test('THC resolves last: combo lands on CBN row', () => {
  const r = routeLine({ category: 'Gummies', name: 'Gummies THC 1mg / CBN 1mg', productLine: PL }, rows);
  assert.equal(r.row.id, 'cbn');
});
test('pure THC picks THC row', () => {
  assert.equal(routeLine({ category: 'Gummies', name: 'Gummies THC 10mg', productLine: PL }, rows).row.id, 'thc');
});
test('smallest list wins over a wider list claiming the same line', () => {
  const r = routeLine({ category: 'Gummies', name: 'Gummies THC', productLine: 'Gummy | 5pk | Theory Wellness' }, rows);
  assert.equal(r.row.id, 'only5');
});
test('blank/unlisted line falls back to MED vs REC; never mixes', () => {
  assert.equal(routeLine({ category: 'Preroll', name: 'Preroll 1g', productLine: '' }, rows).row.id, 'rec-default');
  assert.equal(routeLine({ category: 'Preroll', name: 'MED - Preroll 1g', productLine: 'Preroll | 1g | Jeeter' }, rows).row.id, 'med-default');
  assert.equal(medOrRec('MED - HI5 Seltzer'), 'MED');
});
test('brand row scoped to listed lines (Jeeter 1g does not hit Jeeter 2g row)', () => {
  assert.equal(routeLine({ category: 'Preroll', name: 'Jeeter 1g', productLine: 'Preroll | 1g | Jeeter' }, rows).row.id, 'rec-default');
  assert.equal(routeLine({ category: 'Preroll', name: 'Jeeter 2g', productLine: 'Preroll | 2g | Jeeter' }, rows).row.id, 'jeeter2');
});
test('unresolvable tie is flagged, not resolved', () => {
  const dup = [{ id: 'a', category: 'X', medRec: 'REC', productLines: ['A | 1g | B'] }, { id: 'b', category: 'X', medRec: 'REC', productLines: ['A | 1g | B'] }];
  const r = routeLine({ category: 'X', name: 'x', productLine: 'A | 1g | B' }, dup);
  assert.equal(r.row, null); assert.equal(r.via, 'tie'); assert.equal(r.tie.length, 2);
});
