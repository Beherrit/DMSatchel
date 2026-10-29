import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReminder, openReminders } from '../js/reminders.js';

test('add, tick, clear done and remove notes for the next session', () => {
  let n = 0; const id = () => `r${++n}`;
  let l = applyReminder(null, { add: ' Give Pip  the letter ' }, id).list;
  l = applyReminder(l, { add: 'Bring the map' }, id).list;
  assert.deepEqual(l.map((r) => r.text), ['Give Pip the letter', 'Bring the map']);
  l = applyReminder(l, { done: 'r1' }).list;
  assert.deepEqual(openReminders(l).map((r) => r.id), ['r2']);
  assert.deepEqual(applyReminder(l, { done: 'r1', on: false }).list[0].done, false);
  l = applyReminder(l, { clear_done: true }).list;
  assert.deepEqual(l.map((r) => r.id), ['r2']);
  assert.deepEqual(applyReminder(l, { remove: 'r2' }).list, []);
  assert.ok(applyReminder(l, { add: '' }).error); assert.ok(applyReminder(l, { done: 'zz' }).error); assert.ok(applyReminder(l, {}).error);
});
