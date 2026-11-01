import test from 'node:test';
import assert from 'node:assert/strict';
import { mergePlay } from '../js/play-merge.js';

test('an open sheet keeps changes made elsewhere', () => {
  const base = { hp: 10, cp: 500, inventory: 'Rope', slots: {} };
  const mine = { hp: 4, cp: 500, inventory: 'Rope', slots: {} }; // took damage on the sheet
  const stored = { hp: 10, cp: 1500, inventory: 'Rope\n2 Potion of healing', slots: {}, shopping: ['Lantern'] }; // the GM split coin and handed out potions
  assert.deepEqual(mergePlay(base, mine, stored), { hp: 4, cp: 1500, inventory: 'Rope\n2 Potion of healing', slots: {}, shopping: ['Lantern'] });
  // When both changed the same thing, the sheet's own change wins (it's the latest thing the player did).
  assert.equal(mergePlay({ cp: 500 }, { cp: 400 }, { cp: 1500 }).cp, 400);
  // Nested values compare whole.
  assert.deepEqual(mergePlay({ slots: { 1: 1 } }, { slots: { 1: 2 } }, { slots: {} }).slots, { 1: 2 });
  assert.deepEqual(mergePlay(base, base, null), {});
});
