import test from 'node:test';
import assert from 'node:assert/strict';
import { birthdaysBetween, birthdayText } from '../js/birthdays.js';
import { makeCalendar, toDays } from '../js/calendar.js';

test('birthdays recur every year, with an age when the year is known', () => {
  const cal = makeCalendar('seasons', 1040);
  const m0 = cal.months[0].name, m1 = cal.months[1].name, last = cal.months.at(-1).name;
  const E = (id, kind, born, status) => ({ id, kind, name: id, fields: { born, ...(status ? { status } : {}) } });
  const list = [E('Ann', 'npc', `3 ${m1} 1000`), E('Bo', 'character', `5 ${m1}`), E('Cy', 'npc', `3 ${m1} 1000`, 'Dead'), E('Di', 'faction', `3 ${m1}`), E('Ed', 'npc', 'someday'), E('Fy', 'npc', `2 ${m0} 1045`)];
  const from = toDays(cal, { year: 1040, month: 1, day: 1 }), to = toDays(cal, { year: 1040, month: 1, day: 10 });
  const r = birthdaysBetween(cal, list, from, to);
  assert.deepEqual(r.map((x) => [x.entry.id, x.date.day, x.age]), [['Ann', 3, 40], ['Bo', 5, null]]);
  assert.deepEqual(r.map(birthdayText), ['🎂 Ann turns 40', '🎂 Bo’s birthday']);
  // Across New Year: the end of 1040 and the start of 1041.
  const ny = birthdaysBetween(cal, [E('Gil', 'npc', `${cal.months.at(-1).days} ${last}`), E('Hal', 'npc', `1 ${m0}`)], toDays(cal, { year: 1040, month: cal.months.length - 1, day: cal.months.at(-1).days }), toDays(cal, { year: 1041, month: 0, day: 2 }));
  assert.deepEqual(ny.map((x) => [x.entry.id, x.date.year]), [['Gil', 1040], ['Hal', 1041]]);
  // Not before they were born.
  assert.deepEqual(birthdaysBetween(cal, list, toDays(cal, { year: 1040, month: 0, day: 1 }), toDays(cal, { year: 1040, month: 0, day: 5 })).map((x) => x.entry.id), []);
});
