import test from 'node:test';
import assert from 'node:assert/strict';
import { deadlineOf, deadlineText } from '../js/deadline.js';
import { makeCalendar } from '../js/calendar.js';

test('days left on a quest', () => {
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 3 }; // 3 Thawmoon 1040
  const Q = (deadline, status = 'Active') => ({ kind: 'quest', fields: { deadline, status } });
  assert.equal(deadlineOf(cal, Q('8 Thawmoon 1040')).left, 5);
  assert.equal(deadlineOf(cal, Q('3 Thawmoon 1040')).left, 0);
  assert.equal(deadlineOf(cal, Q('1 Thawmoon 1040')).left, -2);
  assert.equal(deadlineOf(cal, Q('2 Seedtime 1040')).left > 25, true);
  assert.equal(deadlineOf(cal, Q('8 Thawmoon 1040', 'Completed')), null);
  assert.equal(deadlineOf(cal, Q('soon')), null);
  assert.equal(deadlineOf(null, Q('8 Thawmoon 1040')), null);
  assert.equal(deadlineOf(cal, { kind: 'event', fields: { deadline: '8 Thawmoon 1040' } }), null);
  assert.deepEqual([0, 1, 5, -1, -3].map(deadlineText), ['due today', '1 day left', '5 days left', 'overdue by 1 day', 'overdue by 3 days']);
});

test('deadlines on holidays say so', async () => {
  const { deadlineOf, deadlineText } = await import('../js/deadline.js');
  const { makeCalendar } = await import('../js/calendar.js');
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 1, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }] };
  const m = cal.months[1].name; // months count from 0, as the calendar's holidays do
  const d = deadlineOf(cal, { kind: 'quest', fields: { deadline: `5 ${m} 1040`, status: 'Active' } });
  assert.equal(d.holiday, 'Bridge Day');
  assert.equal(deadlineText(d.left, d.holiday), 'due on Bridge Day, in 4 days');
  assert.equal(deadlineText(0, 'Bridge Day'), 'due today, Bridge Day');
  assert.equal(deadlineText(-2, 'Bridge Day'), 'was due on Bridge Day: overdue by 2 days');
  assert.equal(deadlineOf(cal, { kind: 'quest', fields: { deadline: `6 ${m} 1040`, status: 'Active' } }).holiday, '');
  assert.equal(deadlineText(3), '3 days left');
});
