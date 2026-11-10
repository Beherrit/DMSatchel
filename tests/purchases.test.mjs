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
