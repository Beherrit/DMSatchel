import test from 'node:test';
import assert from 'node:assert/strict';
import { stockItems, buyFrom } from '../js/purchase.js';
import { generateShop, stockText } from '../js/economy.js';
import { makeRng } from '../js/rng.js';

const STOCK = `Attitude: Friendly · Haggle DC 12 · Buys at 50% of value

## Adventuring gear
Rope | 1 gp | 3 in stock
Lantern | 5 gp (usually 4 gp) | 1 in stock | Shortage
Torch | 1 cp | available
Tent | 2 gp | out of stock`;

test('what’s for sale, in copper', () => {
  assert.deepEqual(stockItems(STOCK).map(({ name, cp, qty }) => [name, cp, qty]), [['Rope', 100, 3], ['Lantern', 500, 1], ['Torch', 1, -1]]);
  // A generated shop's stock reads back too.
  const shop = generateShop(makeRng('s'), { type: 'General store' });
  assert.ok(stockItems(stockText(shop)).length > 3);
});

test('buying takes it off the shelf', () => {
  const a = buyFrom(STOCK, 'rope', 2);
  assert.deepEqual([a.name, a.qty, a.cp], ['Rope', 2, 200]);
  assert.ok(a.text.includes('Rope | 1 gp | 1 in stock'));
  const b = buyFrom(a.text, 'Rope', 1);
  assert.ok(b.text.includes('Rope | 1 gp | out of stock'));
  assert.ok(buyFrom(b.text, 'Rope').error);
  assert.ok(buyFrom(STOCK, 'Lantern', 2).error);
  assert.ok(buyFrom(STOCK, 'Lantern', 1).text.includes('Lantern | 5 gp (usually 4 gp) | out of stock | Shortage'));
  const t = buyFrom(STOCK, 'Torch', 10); assert.equal(t.cp, 10); assert.equal(t.text, STOCK); // "available" never runs out
  assert.ok(buyFrom(STOCK, 'Tent').error); assert.ok(buyFrom(STOCK, 'Dragon').error);
});
