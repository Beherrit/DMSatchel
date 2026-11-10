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
