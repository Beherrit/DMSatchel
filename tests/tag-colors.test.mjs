import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTagColor, tagSlot, TAG_COLORS } from '../js/tag-colors.js';

test('tag colours', () => {
  let r = applyTagColor(null, '#Villain', 7); assert.deepEqual(r.map, { villain: 7 });
  r = applyTagColor(r.map, 'clue', 3); assert.equal(tagSlot(r.map, 'CLUE'), 3);
  r = applyTagColor(r.map, 'villain', null); assert.deepEqual(r.map, { clue: 3 });
  assert.ok(applyTagColor({}, 'x', 8).error); assert.ok(applyTagColor({}, 'x', 'red').error); assert.ok(applyTagColor({}, '', 1).error);
  assert.deepEqual(applyTagColor({ bad: 'blue', ok: 2 }, 'y', 0).map, { ok: 2, y: 0 }); // junk dropped
  const full = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`t${i}`, 0]));
  assert.ok(applyTagColor(full, 'new', 1).error); assert.ok(!applyTagColor(full, 't5', 1).error);
  assert.equal(tagSlot({}, 'x'), -1); assert.equal(TAG_COLORS.length, 8);
});
