import test from 'node:test';
import assert from 'node:assert/strict';
import { longRest } from '../js/rest.js';

test('a long rest', () => {
  const p = longRest({ hp: 3, temp: 5, slots: { 1: 2 }, death: { ok: 1, fail: 2 }, hd: 4, exhaustion: 2 }, { maxhp: 30, level: 6 });
  assert.deepEqual(p, { hp: 30, temp: 0, slots: {}, death: { ok: 0, fail: 0 }, hd: 1, exhaustion: 1 });
  assert.equal(longRest({ hd: 1 }, { maxhp: 8, level: 1 }).hd, 0); // at least one hit die back
  assert.equal(longRest({}, { maxhp: 8, level: 3 }).exhaustion, 0);
});
