import test from 'node:test';
import assert from 'node:assert/strict';
import { purchases, spending } from '../js/purchases.js';

const ch = (id, name, log) => ({ id, name, kind: 'character', fields: { play: JSON.stringify({ cp: 100, log }) } });
const ann = ch('a', 'Ann', [
  { at: '2026-11-01T10:00:00Z', text: 'Bought Rope at Smithy for 1 gp', cp: -100 },
  { at: '2026-11-02T10:00:00Z', text: 'Got 5 gp from the split', cp: 500 },
  { at: '2026-11-03T10:00:00Z', text: 'Ordered 2 × Pale ale at The Bell for 8 cp', cp: -8 },
]);
const bo = ch('b', 'Bo', [{ at: '2026-11-04T10:00:00Z', text: 'Put Pale ale on the party’s tab at The Bell (4 cp)' }, { at: '2026-11-05T10:00:00Z', text: 'Sold a dagger for 1 gp', cp: 100 }]);

test('purchases: shop, stall and tavern lines, newest first', () => {
  const p = purchases([ann, bo, { id: 'x', name: 'X', fields: { play: 'not json' } }]);
  assert.deepEqual(p.map((x) => [x.who.name, x.cp]), [['Bo', 0], ['Ann', 8], ['Ann', 100]]);
  assert.match(p[0].text, /on the party’s tab/);
});

test('spending: what each character spent, biggest first', () => {
  assert.deepEqual(spending([ann, bo]).map((x) => [x.who.name, x.cp, x.count]), [['Ann', 108, 2], ['Bo', 0, 1]]);
  assert.deepEqual(spending([]), []);
});

test('topGoods: the goods bought most often', async () => {
  const { topGoods } = await import('../js/purchases.js');
  const c1 = ch('a', 'Ann', [{ at: '1', text: 'Bought Rope at Smithy for 1 gp', cp: -100, items: [{ name: 'Rope', qty: 1 }] }, { at: '2', text: 'Ordered 2 × Pale ale at The Bell for 8 cp', cp: -8, items: [{ name: 'Pale ale', qty: 2 }] }]);
  const c2 = ch('b', 'Bo', [{ at: '3', text: 'Ordered Pale ale at The Bell for 4 cp', cp: -4, items: [{ name: 'pale ale', qty: 1 }] }, { at: '4', text: 'Gave Rope to Ann', items: [{ name: 'Rope', qty: -1 }] }]);
  assert.deepEqual(topGoods([c1, c2]), [{ name: 'Pale ale', qty: 3, times: 2 }, { name: 'Rope', qty: 1, times: 1 }]);
});

test('customersAt: who bought at a place, by name, not a place with a longer name', async () => {
  const { customersAt } = await import('../js/purchases.js');
  const c1 = ch('a', 'Ann', [{ at: '1', text: 'Ordered Pale ale at The Bell for 4 cp', cp: -4 }, { at: '2', text: 'Put Stew on the party’s tab at The Bell (5 cp)' }, { at: '3', text: 'Bought Rope at The Bell Tower for 1 gp', cp: -100 }]);
  const c2 = ch('b', 'Bo', [{ at: '4', text: 'Ordered 3 × Pale ale at The Bell for 1 sp 2 cp', cp: -12 }]);
  assert.deepEqual(customersAt([c1, c2], 'The Bell').map((x) => [x.who.name, x.count, x.cp]), [['Ann', 2, 4], ['Bo', 1, 12]]);
  assert.deepEqual(customersAt([c1, c2], 'The Bell Tower').map((x) => [x.who.name, x.count]), [['Ann', 1]]);
  assert.deepEqual(customersAt([c1], ''), []);
});

test('placeOf, spots and goodsAt: where the party buys, and what', async () => {
  const { placeOf, spots, goodsAt, purchases: ps } = await import('../js/purchases.js');
  assert.equal(placeOf('Bought Rope at Smithy for 1 gp'), 'Smithy');
  assert.equal(placeOf('Put Stew on the party’s tab at The Bell (5 cp)'), 'The Bell');
  assert.equal(placeOf('Bought Candles at the candle and lamp stall in Brindle market for 9 cp'), 'the candle and lamp stall in Brindle market');
  assert.equal(placeOf('Got 5 gp'), '');
  const c = ch('a', 'Ann', [{ at: '1', text: 'Ordered Pale ale at The Bell for 4 cp', cp: -4, items: [{ name: 'Pale ale', qty: 1 }] }, { at: '2', text: 'Ordered Stew at The Crow for 5 cp', cp: -5 }, { at: '3', text: 'Ordered 2 × Pale ale at The Bell for 8 cp', cp: -8, items: [{ name: 'Pale ale', qty: 2 }] }, { at: '4', text: 'Bought Rope at Smithy for 1 gp', cp: -100, items: [{ name: 'Rope', qty: 1 }] }]);
  assert.deepEqual(spots(ps([c]), 'tavern').map((x) => [x.place, x.count]), [['The Bell', 2], ['The Crow', 1]]);
  assert.deepEqual(spots(ps([c]), 'shop').map((x) => [x.place, x.count]), [['Smithy', 1]]);
  assert.deepEqual(goodsAt([c], 'The Bell'), [{ name: 'Pale ale', qty: 3, times: 2 }]);
});
