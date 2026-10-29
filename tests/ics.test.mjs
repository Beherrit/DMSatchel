import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionIcs, googleCalendarUrl } from '../js/ics.js';

test('an .ics event with escaped text, a reminder and CRLF lines', () => {
  const ics = sessionIcs({ start: '2026-10-31T19:00:00Z', title: 'Story of X; session 13, again', url: 'https://dmsatchel.vercel.app/?w=x', uid: 'x-1@dmsatchel', now: new Date('2026-10-29T00:00:00Z') });
  const lines = ics.split('\r\n');
  assert.ok(lines.includes('DTSTART:20261031T190000Z') && lines.includes('DTEND:20261031T230000Z') && lines.includes('DTSTAMP:20261029T000000Z'));
  assert.ok(lines.includes('SUMMARY:Story of X\; session 13\\, again'));
  assert.ok(lines.includes('TRIGGER:-PT2H') && lines[0] === 'BEGIN:VCALENDAR' && ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(lines.every((l) => l.length <= 75));
});

test('a Google Calendar link', () => {
  const u = new URL(googleCalendarUrl({ start: '2026-10-31T19:00:00Z', hours: 3, title: 'Story of X', url: 'https://x' }));
  assert.equal(u.searchParams.get('dates'), '20261031T190000Z/20261031T220000Z');
  assert.equal(u.searchParams.get('text'), 'Story of X');
});
