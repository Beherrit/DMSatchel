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
