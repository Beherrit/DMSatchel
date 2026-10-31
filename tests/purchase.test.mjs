import test from 'node:test';
import assert from 'node:assert/strict';
import { stockItems, buyFrom, sellTo, setHaggle, haggleFor, readHaggle, withHaggle } from '../js/purchase.js';
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

test('selling: the buy-back rate on the usual price, and onto the shelf', () => {
  const GOODS = [['Lantern', 5, 'Gear'], ['Shield', 10, 'Armor']];
  const a = sellTo(STOCK, 'rope', 2, GOODS);
  assert.deepEqual([a.name, a.qty, a.cp], ['Rope', 2, 100]); // 1 gp each at 50%
  assert.ok(a.text.includes('Rope | 1 gp | 5 in stock'));
  assert.equal(sellTo(STOCK, 'Lantern', 1, GOODS).cp, 200); // its usual 4 gp, not the shortage price
  assert.ok(sellTo(STOCK, 'Tent', 1).text.includes('Tent | 2 gp | 1 in stock'));
  const s = sellTo(STOCK, 'Shield', 1, GOODS);
  assert.equal(s.cp, 500); assert.ok(s.text.endsWith('## Bought from adventurers\nShield | 10 gp | 1 in stock'));
  assert.ok(sellTo(s.text, 'Shield', 1, GOODS).text.includes('Shield | 10 gp | 2 in stock'));
  assert.ok(sellTo(STOCK, 'Mysterious idol', 1, GOODS).error);
  assert.equal(sellTo(STOCK, 'Torch', 3).cp, 1); // never less than a copper
  assert.equal(sellTo(STOCK.replace('50%', '80%'), 'Rope', 1).cp, 80);
});

test('haggling: granted per character, used once', () => {
  let h = setHaggle('', 'p', -10);
  assert.equal(haggleFor(h, 'p'), -10); assert.equal(haggleFor(h, 'b'), 0);
  h = setHaggle(h, 'b', 10); assert.deepEqual(readHaggle(h), { p: -10, b: 10 });
  h = setHaggle(h, 'p', 0); assert.deepEqual(readHaggle(h), { b: 10 });
  assert.equal(setHaggle(h, 'b', null), '');
  assert.deepEqual(readHaggle('{"x": 50, "y": -20}'), { y: -20 }); // only the allowed results
  assert.deepEqual(readHaggle('junk'), {});
  assert.equal(withHaggle(200, -10), 180); assert.equal(withHaggle(200, 10), 220); assert.equal(withHaggle(1, -20), 1); assert.equal(withHaggle(300, 0), 300);
});
