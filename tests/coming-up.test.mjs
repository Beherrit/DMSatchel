import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar } from '../js/calendar.js';
import { comingUp, whenText } from '../js/coming-up.js';

test('comingUp: the week ahead for one character', () => {
  const base = makeCalendar('seasons', 1040);
  const m = base.months[1].name;
  const cal = { ...base, month: 1, day: 3, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }] };
  const ann = { kind: 'character', name: 'Ann', fields: { born: `6 ${m} 1010` } };
  const quests = [{ kind: 'quest', name: 'Ring the Bell', fields: { deadline: `9 ${m} 1040`, status: 'Active' } }, { kind: 'quest', name: 'Old job', fields: { deadline: `4 ${m} 1040`, status: 'Completed' } }, { kind: 'quest', name: 'Far off', fields: { deadline: `30 ${m} 1040`, status: 'Active' } }];
  const list = comingUp(cal, ann, quests);
  assert.deepEqual(list.map((x) => [x.in, x.icon, x.text]), [[2, '🎉', 'Bridge Day (the shops are shut)'], [3, '🎂', 'Your birthday: Ann turns 30'], [6, '⏳', 'Deadline: Ring the Bell']]);
  assert.deepEqual(comingUp(null, ann, quests), []);
  assert.equal(whenText(0), 'today'); assert.equal(whenText(1), 'tomorrow'); assert.equal(whenText(4), 'in 4 days');
});
