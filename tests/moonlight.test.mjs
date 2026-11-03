import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar, moonPhase } from '../js/calendar.js';
import { moonlight } from '../js/moonlight.js';

test('moonlight follows the brightest moon', () => {
  const cal = makeCalendar('seasons', 1040);
  // Find a full-moon night and a new-moon night in the first month.
  const days = Array.from({ length: cal.months[0].days }, (_, i) => ({ year: 1040, month: 0, day: i + 1 }));
  const full = days.find((d) => moonPhase(cal, cal.moons[0], d).name === 'Full moon');
  const dark = days.find((d) => moonPhase(cal, cal.moons[0], d).name === 'New moon');
  assert.equal(moonlight(cal, full).level, 4); assert.match(moonlight(cal, full).text, /read by/);
  assert.equal(moonlight(cal, dark).level, 0); assert.match(moonlight(cal, dark).text, /bring a light/);
  // A second moon that's full lights a dark night, and is named.
  const two = { ...cal, moons: [cal.moons[0], { name: 'Pale Sister', cycle: cal.moons[0].cycle, offset: cal.moons[0].offset + cal.moons[0].cycle / 2 }] };
  const m = moonlight(two, dark); assert.ok(m.level >= 3, JSON.stringify(m)); assert.match(m.text, /^Pale Sister: /);
  assert.equal(moonlight({ ...cal, moons: [] }, full), null);
});

test('clouds hide the moon', () => {
  const cal = makeCalendar('seasons', 1040);
  const days = Array.from({ length: cal.months[0].days }, (_, i) => ({ year: 1040, month: 0, day: i + 1 }));
  const full = days.find((d) => moonPhase(cal, cal.moons[0], d).name === 'Full moon');
  assert.equal(moonlight(cal, full, 'Clear').level, 4);
  const o = moonlight(cal, full, 'Heavy rain'); assert.equal(o.level, 0); assert.match(o.text, /behind the clouds \(heavy rain\)/);
  const p = moonlight(cal, full, 'Scattered clouds'); assert.equal(p.level, 3); assert.match(p.text, /through broken cloud/);
  const dark = days.find((d) => moonPhase(cal, cal.moons[0], d).name === 'New moon');
  assert.match(moonlight(cal, dark, 'Overcast').text, /^New moon: /); // no moon to hide
});
