import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moonEvent, makeCalendar, cleanCalendar, toDays, fromDays, advance, parseDate, formatDate, moonPhase, weekday, yearLength, PRESETS } from '../js/calendar.js';

test('days round-trip across years, including negative years', () => {
  for (const preset of Object.keys(PRESETS)) {
    const cal = makeCalendar(preset, 1000);
    for (const n of [-5000, -1, 0, 1, 359, 360, 365, 12345]) assert.equal(toDays(cal, fromDays(cal, n)), n, `${preset} ${n}`);
  }
});

test('advancing wraps months and years', () => {
  const cal = { ...makeCalendar('seasons', 1041), month: 11, day: 29 };
  const next = advance(cal, 3);
  assert.deepEqual([next.year, next.month, next.day], [1042, 0, 2]);
  const back = advance(next, -3);
  assert.deepEqual([back.year, back.month, back.day], [1041, 11, 29]);
  assert.equal(yearLength(cal), 360);
});

test('parses dates written several ways', () => {
  const cal = makeCalendar('seasons', 1042);
  assert.deepEqual(parseDate(cal, '14 Highsun 1042'), { year: 1042, month: 5, day: 14 });
  assert.deepEqual(parseDate(cal, 'Highsun 14, 1040'), { year: 1040, month: 5, day: 14 });
  assert.deepEqual(parseDate(cal, 'the 3rd of Leaffall, 998 AR'), { year: 998, month: 8, day: 3 });
  assert.deepEqual(parseDate(cal, 'Bloomtide'), { year: 1042, month: 4, day: 1 });
  assert.equal(parseDate(cal, 'sometime last spring'), null);
  assert.equal(parseDate(cal, '45 Highsun 1042'), null);
  const t = makeCalendar('thirteen', 5);
  assert.deepEqual(parseDate(t, '2 Long Night Moon 7'), { year: 7, month: 12, day: 2 });
});

test('formats, weekdays and moon phases', () => {
  const cal = { ...makeCalendar('seasons', 1042), era: 'AR' };
  assert.equal(formatDate(cal, { year: 1042, month: 5, day: 14 }), '14 Highsun 1042 AR');
  assert.ok(cal.weekdays.includes(weekday(cal, { year: 1042, month: 5, day: 14 })));
  const m = cal.moons[0];
  assert.equal(moonPhase(cal, m, fromDays(cal, 0)).name, 'New moon');
  assert.equal(moonPhase(cal, m, fromDays(cal, 15)).name, 'Full moon');
});

test('cleanCalendar repairs bad input', () => {
  assert.equal(cleanCalendar(null), null);
  const c = cleanCalendar({ months: [{ name: 'A', days: 'x' }, { name: 'B', days: 500 }], month: 9, day: 99, moons: [{ cycle: 0 }], holidays: [{ name: 'H', month: 5, day: 1 }] });
  assert.equal(c.months[0].days, 30); assert.equal(c.months[1].days, 100);
  assert.equal(c.month, 1); assert.equal(c.day, 99); assert.equal(c.moons[0].cycle, 30); assert.equal(c.holidays.length, 0);
});

test('new and full moon fall on exactly one day per cycle', () => {
  for (const preset of ['seasons', 'earthlike']) {
    const cal = makeCalendar(preset, 1000), m = cal.moons[0];
    let news = 0, fulls = 0;
    for (let n = 0; n < 360; n++) { const e = moonEvent(cal, m, fromDays(cal, n)); if (e === 'new') news++; if (e === 'full') fulls++; }
    const cycles = 360 / m.cycle;
    assert.ok(Math.abs(news - cycles) <= 1 && Math.abs(fulls - cycles) <= 1, `${preset}: ${news} new, ${fulls} full`);
  }
});
