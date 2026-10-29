import test from 'node:test';
import assert from 'node:assert/strict';
import { repeatsBetween } from '../js/repeats.js';
import { makeCalendar, toDays, formatDate } from '../js/calendar.js';

const cal = makeCalendar('seasons', 1040);
const M = (i) => cal.months[i].name;
const ev = (name, date, repeats, until) => ({ id: name, kind: 'event', name, fields: { date, repeats, ...(until ? { until } : {}) } });
const span = (y0, m0, d0, y1, m1, d1) => [toDays(cal, { year: y0, month: m0, day: d0 }), toDays(cal, { year: y1, month: m1, day: d1 })];

test('weekly, monthly and yearly repeats after the first date', () => {
  const w = cal.weekdays.length;
  const list = [ev('Market', `1 ${M(0)} 1040`, 'Every week'), ev('Moot', `5 ${M(0)} 1040`, 'Every month'), ev('Feast', `9 ${M(1)} 1000`, 'Every year'), ev('Once', `2 ${M(0)} 1040`, '')];
  const [a, b] = span(1040, 0, 1, 1040, 1, 10);
  const r = repeatsBetween(cal, list, a, b);
  const market = r.filter((x) => x.entry.id === 'Market').map((x) => x.n - a);
  assert.deepEqual(market.slice(0, 3), [w, 2 * w, 3 * w]);
  assert.deepEqual(r.filter((x) => x.entry.id === 'Moot').map((x) => formatDate(cal, x.date)), [`5 ${M(1)} 1040`]);
  assert.deepEqual(r.filter((x) => x.entry.id === 'Feast').map((x) => formatDate(cal, x.date)), [`9 ${M(1)} 1040`]);
  assert.equal(r.some((x) => x.entry.id === 'Once'), false);
});

test('until stops the repeats, and nothing before the start', () => {
  const [a, b] = span(1040, 0, 1, 1041, 0, 1);
  const r = repeatsBetween(cal, [ev('Moot', `5 ${M(0)} 1040`, 'Every month', `20 ${M(2)} 1040`)], a, b);
  assert.deepEqual(r.map((x) => x.date.month), [1, 2]);
  const [c, d] = span(1030, 0, 1, 1030, 5, 1);
  assert.deepEqual(repeatsBetween(cal, [ev('Feast', `9 ${M(1)} 1040`, 'Every year')], c, d), []);
});
