import test from 'node:test';
import assert from 'node:assert/strict';
import { clockDiff, diffText } from '../js/clock-diff.js';

test('clockDiff: shops that opened or shut, people who moved', () => {
  const before = { shops: [{ id: 's', name: 'Smithy', open: false }, { id: 'b', name: 'The Bell', open: true }], people: [{ id: 'a', name: 'Ada', place: 'Smithy' }, { id: 'c', name: 'Cy', place: 'The Bell' }, { id: 'd', name: 'Dot', place: 'Square' }] };
  const after = { shops: [{ id: 's', name: 'Smithy', open: true }, { id: 'b', name: 'The Bell', open: true }], people: [{ id: 'a', name: 'Ada', place: 'The Bell' }, { id: 'c', name: 'Cy', place: 'The Bell' }, { id: 'e', name: 'Eve', place: 'Square' }] };
  const d = clockDiff(before, after);
  assert.deepEqual(d.opened, ['Smithy']); assert.deepEqual(d.shut, []);
  assert.deepEqual(d.moved, [{ name: 'Ada', from: 'Smithy', to: 'The Bell' }, { name: 'Dot', from: 'Square', to: null }, { name: 'Eve', from: null, to: 'Square' }]);
  assert.equal(diffText(d), 'Smithy opened; Ada went to The Bell; Dot left; Eve went to Square');
  assert.equal(diffText(d, 2), 'Smithy opened; Ada went to The Bell and 2 more');
  assert.deepEqual(clockDiff(null, null), { opened: [], shut: [], moved: [] });
  assert.equal(diffText(clockDiff(before, before)), '');
});
