import test from 'node:test';
import assert from 'node:assert/strict';
import { roomsOf, nightCosts, minutesToMorning } from '../js/inn.js';
import { rollMenu } from '../js/menu.js';
import { makeRng } from '../js/rng.js';

test('rooms, costs and the morning', () => {
  const m = rollMenu(makeRng('inn'), { size: 'Town' });
  assert.deepEqual(roomsOf(m).map((x) => x.name), ['A place in the common room', 'A private room']);
  assert.deepEqual(roomsOf(null), []);
  assert.deepEqual(nightCosts([{ id: 'a', name: 'Ann', cp: 500 }, { id: 'b', name: 'Bo', cp: 20 }], 50).map((x) => [x.name, x.paid, x.short]), [['Ann', 50, 0], ['Bo', 20, 30]]);
  assert.equal(minutesToMorning(22 * 60), 10 * 60); // 10 pm → 8 am
  assert.equal(minutesToMorning(2 * 60), 6 * 60); // 2 am → 8 am the same day
  assert.equal(minutesToMorning(9 * 60), 23 * 60); // 9 am → tomorrow
});
