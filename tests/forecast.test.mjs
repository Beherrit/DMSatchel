import test from 'node:test';
import assert from 'node:assert/strict';
import { forecast, dayWeather } from '../js/forecast.js';
import { rollWeather, seasonOf } from '../js/encounters.js';
import { makeCalendar, advance, formatDate, today } from '../js/calendar.js';

test('tomorrow in the forecast is what tomorrow shows', () => {
  const cal = makeCalendar();
  const week = forecast('p1', ['forest'], cal, 7);
  assert.equal(week.length, 7);
  // Today's matches the way the app has always seeded it.
  assert.deepEqual(week[0].weather, rollWeather({ terrain: ['forest'], season: seasonOf(cal.month, cal.months.length), seed: `p1:${formatDate(cal, today(cal), { weekday: true })}` }));
  // Move the calendar on three days: that day's "today" is the forecast's day 3.
  const later = advance(cal, 3);
  assert.deepEqual(dayWeather('p1', ['forest'], later, 0), week[3].weather);
  assert.equal(week[3].label, formatDate(later, today(later), { weekday: true }));
  // Without a calendar, real days.
  const now = Date.parse('2026-03-01T12:00:00Z');
  const real = forecast('p1', ['coast'], null, 3, now);
  assert.deepEqual(real[1].weather, dayWeather('p1', ['coast'], null, 0, Date.parse('2026-03-02T12:00:00Z')));
  assert.deepEqual(real[0].weather, rollWeather({ terrain: ['coast'], season: 'Summer', seed: `p1:${new Date(now).toDateString()}` }));
});
