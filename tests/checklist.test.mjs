import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChecklist, readChecklist } from '../js/checklist.js';

test('add, tick, untick, reorder and remove steps', () => {
  let n = 0; const id = () => `c${++n}`;
  let l = applyChecklist(null, { add: ' Print  sheets ' }, 5, id).list;
  l = applyChecklist(l, { add: 'Update the map' }, 5, id).list;
  assert.deepEqual(l.items, [{ id: 'c1', text: 'Print sheets' }, { id: 'c2', text: 'Update the map' }]);
  l = applyChecklist(l, { done: 'c2' }, 5).list;
  assert.deepEqual(l.done, ['c2']);
  l = applyChecklist(l, { order: ['c2', 'c1'] }, 5).list;
  assert.deepEqual(l.items.map((x) => x.id), ['c2', 'c1']);
  assert.deepEqual(applyChecklist(l, { done: 'c2', on: false }, 5).list.done, []);
  l = applyChecklist(l, { remove: 'c2' }, 5).list;
  assert.deepEqual([l.items.length, l.done], [1, []]);
  assert.ok(applyChecklist(l, { add: '  ' }, 5).error);
  assert.ok(applyChecklist(l, { done: 'nope' }, 5).error);
});

test('ticks clear when the next session changes; steps stay', () => {
  const raw = { items: [{ id: 'a', text: 'Print' }], done: ['a'], round: 5 };
  assert.deepEqual(readChecklist(raw, 5).done, ['a']);
  assert.deepEqual(readChecklist(raw, 6), { items: [{ id: 'a', text: 'Print' }], done: [], round: 6 });
});
