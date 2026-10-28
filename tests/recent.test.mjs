import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecent, pushRecent, MAX_RECENT } from '../js/recent.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('newest first, no repeats, at most ten, per world', () => {
  const s = memory();
  pushRecent(s, 'w', 'a'); pushRecent(s, 'w', 'b'); pushRecent(s, 'w', 'a');
  assert.deepEqual(readRecent(s, 'w'), ['a', 'b']);
  assert.deepEqual(readRecent(s, 'other'), []);
  for (let i = 0; i < 15; i++) pushRecent(s, 'w', `e${i}`);
  assert.equal(readRecent(s, 'w').length, MAX_RECENT);
  assert.equal(readRecent(s, 'w')[0], 'e14');
});

test('broken or blocked storage is harmless', () => {
  assert.deepEqual(readRecent({ getItem: () => '{bad' }, 'w'), []);
  assert.deepEqual(readRecent({ getItem: () => { throw new Error('blocked'); } }, 'w'), []);
  assert.deepEqual(pushRecent({ getItem: () => null, setItem: () => { throw new Error('full'); } }, 'w', 'a'), ['a']);
});
