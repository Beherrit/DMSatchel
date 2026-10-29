import test from 'node:test';
import assert from 'node:assert/strict';
import { onThisDay, yearsAgoText } from '../js/onthisday.js';
import { makeCalendar } from '../js/calendar.js';

test('anniversaries of dated events, birthdays and holidays on today’s date', () => {
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 3 };
  const M = cal.months[1].name;
  const list = [
    { id: 'f', kind: 'event', name: 'Fall of Brindle', fields: { date: `3 ${M} 990` } },
    { id: 'p', kind: 'session', name: 'Session 2', fields: { world_date: `3 ${M} 1039` } },
    { id: 'x', kind: 'event', name: 'No year', fields: { date: `3 ${M}` } },
    { id: 'o', kind: 'event', name: 'Other day', fields: { date: `4 ${M} 990` } },
    { id: 'n', kind: 'npc', name: 'Ann', fields: { born: `3 ${M} 1000` } },
  ];
  const r = onThisDay(cal, list);
  assert.deepEqual(r.anniversaries.map((a) => [a.entry.id, a.yearsAgo]), [['p', 1], ['f', 50]]);
  assert.deepEqual(r.birthdays.map((b) => [b.entry.id, b.age]), [['n', 40]]);
  assert.ok(Array.isArray(r.holidays));
  assert.equal(yearsAgoText(1), 'A year ago today'); assert.equal(yearsAgoText(50), '50 years ago today');
});
