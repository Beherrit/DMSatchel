import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRevealAt, startOfLocalDay } from '../js/reveal-date.js';

test('a reveal date has to be ahead, but not too far', () => {
  const now = Date.parse('2026-10-29T12:00:00Z');
  assert.deepEqual(cleanRevealAt(null, now), { at: null });
  assert.deepEqual(cleanRevealAt('', now), { at: null });
  assert.deepEqual(cleanRevealAt('2026-11-06T00:00:00.000Z', now), { at: '2026-11-06T00:00:00.000Z' });
  assert.ok(cleanRevealAt('2026-10-01', now).error);
  assert.ok(cleanRevealAt('2031-01-01', now).error);
  assert.ok(cleanRevealAt('soon', now).error);
  const d = new Date(startOfLocalDay('2026-11-06'));
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()], [2026, 10, 6, 0]);
  assert.equal(startOfLocalDay('6 Nov'), null);
});
