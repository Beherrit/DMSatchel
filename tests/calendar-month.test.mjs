import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar, toDays } from '../js/calendar.js';
import { monthLines } from '../js/calendar-month.js';

test('monthLines: a month day by day', () => {
  const cal = { ...makeCalendar('seasons', 1040), moons: [], holidays: [{ name: 'Bridge Day', month: 0, day: 3 }] };
  const n = (day) => toDays(cal, { year: 1040, month: 0, day });
  const lines = monthLines(cal, { year: 1040, month: 0 }, {
    dated: [{ entry: { name: 'Session 4', kind: 'session' }, n: n(3) }, { entry: { name: 'Ring the Bell', kind: 'quest' }, n: n(9) }, { entry: { name: 'Market', kind: 'event' }, n: n(9), repeat: true }],
    births: [{ entry: { name: 'Ann' }, n: n(12), age: 30 }], arrivals: [{ n: n(12), name: 'Sedge' }],
  });
  assert.equal(monthLines(cal, { year: 1040, month: 0 }, { dated: [{ entry: { name: 'Fair', kind: 'event' }, n: n(2) }] })[0].things[0].icon, '');
  assert.deepEqual(lines.map((l) => [l.day, l.things.map((t) => `${t.icon} ${t.text}`)]), [
    [3, ['🎉 Bridge Day', '▶ Played: Session 4']],
    [9, ['⏳ Deadline: Ring the Bell', '↻ Market']],
    [12, ['🎂 Ann turns 30', '⚑ The party arrived in Sedge']],
  ]);
  assert.deepEqual(monthLines(cal, { year: 1040, month: 1 }), []);
});
