import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionGaps, realGapText } from '../js/session-gaps.js';
import { makeCalendar } from '../js/calendar.js';

test('sessionGaps: real days and in-world days since the session before', () => {
  const cal = makeCalendar('seasons', 1040), m = cal.months[1].name;
  const S = (id, played_on, world_date) => ({ id, kind: 'session', fields: { played_on, world_date } });
  const g = sessionGaps([S('c', '2026-11-15', `9 ${m} 1040`), S('b', '2026-11-01', `5 ${m} 1040`), S('a', '2026-10-31', '')], cal);
  assert.deepEqual(g.get('c'), { real: 14, world: 4 });
  assert.deepEqual(g.get('b'), { real: 1, world: null });
  assert.equal(g.has('a'), false);
});

test('realGapText', () => {
  assert.deepEqual([0, 1, 5, 14, 40, 90, null].map(realGapText), ['the same day', 'the next day', '5 days later', '2 weeks later', '6 weeks later', '3 months later', '']);
});

test('pace averages the gaps', async () => {
  const { pace } = await import('../js/session-gaps.js');
  assert.deepEqual(pace(new Map([['a', { real: 14, world: 4 }], ['b', { real: 7, world: null }], ['c', { real: null, world: 2 }]])), { real: 11, world: 3 });
  assert.deepEqual(pace(new Map()), { real: null, world: null });
});

test('playingSince: the first session and how long ago', async () => {
  const { playingSince } = await import('../js/session-gaps.js');
  const S = (d) => ({ kind: 'session', fields: { played_on: d } });
  assert.deepEqual(playingSince([S('2026-11-01'), S('2026-10-18'), S('')], '2026-11-09'), { date: '2026-10-18', ago: '3 weeks ago' });
  assert.deepEqual(playingSince([S('2026-11-09')], '2026-11-09'), { date: '2026-11-09', ago: 'today' });
  assert.equal(playingSince([], '2026-11-09'), null);
});
