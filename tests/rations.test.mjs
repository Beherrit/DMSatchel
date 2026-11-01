import test from 'node:test';
import assert from 'node:assert/strict';
import { eatRations } from '../js/rations.js';

test('a day’s rations a day', () => {
  let r = eatRations('Rope\nRations (1 day) x10\nTorch', 3);
  assert.deepEqual([r.text, r.had, r.ate, r.short], ['Rope\n7 Rations (1 day)\nTorch', 10, 3, 0]);
  r = eatRations('2 rations\nWaterskin\n1 Iron rations', 5);
  assert.deepEqual([r.text, r.ate, r.short], ['Waterskin', 3, 2]);
  r = eatRations('Rope', 2); assert.deepEqual([r.text, r.had, r.short], ['Rope', 0, 2]);
  assert.equal(eatRations('Rations x4', 0).text, 'Rations x4');
});

test('rations from the stash', async () => {
  const { feedFromStash } = await import('../js/rations.js');
  const r = feedFromStash([{ id: 'b', name: 'Bo', short: 2 }, { id: 'c', name: 'Cy', short: 3 }], [{ item: 'Rope', qty: 4 }, { item: 'Rations (1 day)', qty: 4 }]);
  assert.deepEqual([...r.left], [['b', 0], ['c', 1]]);
  assert.deepEqual(r.used, [{ item: 'Rations (1 day)', qty: 4, by: ['Bo', 'Cy'] }]);
  assert.deepEqual(feedFromStash([{ id: 'b', name: 'Bo', short: 1 }], []).used, []);
});

test('hirelings eat from the stash first', async () => {
  const { feedHirelings, stashAfter, feedFromStash } = await import('../js/rations.js');
  const stash = [{ item: 'Rations (1 day)', qty: 7 }, { item: 'Rope', qty: 2 }];
  const h = feedHirelings([{ id: 'g', name: 'Gil' }, { id: 'm', name: 'Mags' }], 3, stash);
  assert.deepEqual(h.fed.used, [{ item: 'Rations (1 day)', qty: 6, by: ['Gil', 'Mags'] }]);
  assert.deepEqual(h.short, []);
  const rest = stashAfter(stash, h.fed.used);
  assert.deepEqual(rest, [{ item: 'Rations (1 day)', qty: 1 }, { item: 'Rope', qty: 2 }]);
  assert.equal(feedFromStash([{ id: 'a', name: 'Ann', short: 2 }], rest).left.get('a'), 1);
  const lean = feedHirelings([{ id: 'g', name: 'Gil' }, { id: 'm', name: 'Mags' }], 3, [{ item: 'Rations', qty: 4 }]);
  assert.deepEqual(lean.short, [{ name: 'Mags', days: 2 }]);
  assert.deepEqual(feedHirelings([], 3, stash).short, []);
});
