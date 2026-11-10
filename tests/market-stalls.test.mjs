import test from 'node:test';
import assert from 'node:assert/strict';
import { marketStalls, stallsText } from '../js/market-stalls.js';

test('marketStalls: seeded by town and date, sized by the town', () => {
  const a = marketStalls('t1:1040-1-6', 'Town'), b = marketStalls('t1:1040-1-6', 'Town'), c = marketStalls('t1:1040-1-13', 'Town');
  assert.deepEqual(a, b);
  assert.equal(a.length, 4);
  assert.notDeepEqual(a, c);
  assert.equal(marketStalls('x', 'Hamlet').length, 2);
  assert.equal(marketStalls('x', 'City').length, 5);
  assert.equal(new Set(a.map((s) => s.name)).size, a.length);
  for (const s of a) { assert.ok(s.goods.length >= 2 && s.goods.length <= 4); for (const g of s.goods) assert.match(g.price, /\d+ (gp|sp|cp)/); }
  assert.deepEqual(marketStalls(''), []);
  assert.equal(stallsText(a).split('\n').length, 4);
});

test('marketStalls: the price shown is the price paid, in whole coins', async () => {
  const { coinText } = await import('../js/economy.js');
  for (let k = 0; k < 40; k++) for (const s of marketStalls(`seed${k}`, 'Metropolis')) for (const g of s.goods) {
    assert.ok(Number.isInteger(g.cp) && g.cp >= 1);
    assert.equal(g.price, coinText(g.cp));
    if (g.cp >= 10000) assert.equal(g.cp % 100, 0); else if (g.cp >= 100) assert.equal(g.cp % 10, 0);
  }
});

test('stallsHours: up, going up, packed away', async () => {
  const { stallsHours } = await import('../js/market-stalls.js');
  assert.deepEqual(stallsHours(14 * 60), { up: true, text: 'Up till 17:00 (another 3 h)' });
  assert.deepEqual(stallsHours(16 * 60 + 30), { up: true, text: 'Up till 17:00 (another 30 min)' });
  assert.deepEqual(stallsHours(4 * 60), { up: false, text: 'Going up at 06:00 (in 2 h)' });
  assert.deepEqual(stallsHours(20 * 60), { up: false, text: 'Packed away at 17:00' });
  assert.equal(stallsHours(1440 + 600).up, true);
});
