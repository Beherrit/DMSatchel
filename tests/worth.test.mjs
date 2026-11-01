import test from 'node:test';
import assert from 'node:assert/strict';
import { priceIndex, worthOf } from '../js/worth.js';

const GOODS = [['Arrows (20)', 1, 'Weapons'], ['Chain mail', 75, 'Armor'], ['Longsword', 15, 'Weapons'], ['Hempen rope (50 ft)', 1, 'Adventuring gear'], ['Silk rope (50 ft)', 10, 'Adventuring gear'],
  ['Torch', 0.01, 'Adventuring gear'], ['Rations (1 day)', 0.5, 'Adventuring gear'], ['Inn stay (comfortable)', 0.8, 'Lodging & services'], ['Lesser Restoration', 120, 'Spellcasting']];

test('priceIndex: names as players write them', () => {
  const p = priceIndex(GOODS);
  assert.deepEqual(p('Rope'), { name: 'Hempen rope (50 ft)', cp: 100 });
  assert.deepEqual(p('20 arrows'.replace(/^\d+ /, '')), { name: 'Arrows (20)', cp: 5 });
  assert.deepEqual(p('Arrows (20)'), { name: 'Arrows (20)', cp: 100 });
  assert.deepEqual(p('Silvered longsword'), { name: 'Longsword', cp: 1500 });
  assert.deepEqual(p('Torches'), { name: 'Torch', cp: 1 });
  assert.equal(p('+1 Longsword'), null);
  assert.equal(p('Longsword +2'), null);
  assert.equal(p('Lesser Restoration'), null);
  assert.equal(p('Mystery box'), null);
});

test('worthOf: half the list price, kits on one line, the unknown listed', () => {
  const w = worthOf('Chain mail, longsword, 4 GP\nRope\n20 arrows\n7 Rations (1 day)\n+1 Longsword\nMystery box', GOODS);
  assert.equal(w.list, 7500 + 1500 + 100 + 100 + 350);
  assert.equal(w.cp, Math.floor(w.list / 2));
  assert.deepEqual(w.unknown, ['+1 Longsword', 'Mystery box']);
  assert.deepEqual(w.priced.find((x) => x.name === 'arrows'), { name: 'arrows', qty: 20, cp: 50 });
  assert.equal(worthOf('Chain mail', GOODS, 80).cp, 6000);
  assert.deepEqual(worthOf('', GOODS), { cp: 0, list: 0, priced: [], unknown: [] });
});
