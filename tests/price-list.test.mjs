import test from 'node:test';
import assert from 'node:assert/strict';
import { priceGroups } from '../js/price-list.js';
import { GOODS } from '../js/economy.js';

test('the price list, grouped and searchable', () => {
  const all = priceGroups();
  assert.equal(all.reduce((t, g) => t + g.rows.length, 0), GOODS.length);
  assert.equal(all[0].cat, 'Weapons');
  for (const g of all) for (let i = 1; i < g.rows.length; i++) assert.ok(g.rows[i - 1][1] <= g.rows[i][1], 'cheapest first');
  const ale = priceGroups('ale');
  assert.ok(ale.some((g) => g.cat === 'Food & drink' && g.rows.some(([n]) => n === 'Ale (mug)')));
  assert.deepEqual(priceGroups('armor').map((g) => g.cat).includes('Armor'), true); // by kind
  assert.ok(priceGroups('plate armor')[0].rows.some(([n, p]) => n === 'Plate armor' && p === 1500));
  assert.deepEqual(priceGroups('zzzz'), []);
  assert.deepEqual(priceGroups('ale').flatMap((g) => g.rows.map(([n]) => n)), ['Ale (mug)', 'Ale (gallon)']); // not Scale mail
});

test('prices in one town', () => {
  const market = { inflation: 10, conditions: [{ kind: 'shortage', category: 'Food & drink', factor: 2 }, { kind: 'embargo', category: 'Alchemy', factor: 3 }], festival: '' };
  const ale = priceGroups('ale mug', undefined, market)[0].rows[0];
  assert.equal(ale[0], 'Ale (mug)'); assert.ok(Math.abs(ale[1] - 0.04 * 1.1 * 2) < 1e-9); assert.equal(ale[2], 'Shortage');
  assert.equal(priceGroups('acid', undefined, market)[0].rows[0][2], 'Banned');
  assert.equal(priceGroups('rope hempen', undefined, market)[0]?.rows[0][2] ?? '', '');
  assert.equal(priceGroups('ale mug')[0].rows[0].length, 2); // usual prices have no notes
});
