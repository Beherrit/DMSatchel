// Weather by the day: the same weather all day at a place, seeded by the place and the date (in-world when the world
// has a calendar, real otherwise), so redrawing doesn't change it and a forecast matches what each day shows when it
// comes. Pure, so it can be tested.
import { rollWeather, seasonOf } from './encounters.js';
import { today, toDays, fromDays, formatDate } from './calendar.js';

// The day `offset` days from today: { label, seed, season }.
function dayOf(cal, offset, now) {
  if (cal) {
    const d = fromDays(cal, toDays(cal, today(cal)) + offset);
    const text = formatDate(cal, d, { weekday: true });
    return { label: text, seed: text, season: seasonOf(d.month, cal.months.length) };
  }
  const d = new Date(now); d.setDate(d.getDate() + offset);
  return { label: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }), seed: d.toDateString(), season: 'Summer' };
}

// One place's weather on one day (0 = today).
export function dayWeather(placeId, terrain, cal, offset = 0, now = Date.now()) {
  const d = dayOf(cal, offset, now);
  return rollWeather({ terrain, season: d.season, seed: `${placeId}:${d.seed}` });
}

// Today and the days after it: [{ label, weather }].
export function forecast(placeId, terrain, cal, days = 7, now = Date.now()) {
  return Array.from({ length: days }, (_, i) => ({ label: dayOf(cal, i, now).label, weather: dayWeather(placeId, terrain, cal, i, now) }));
}

// Weather slows the road: how much longer travel takes in this weather (the worst of it counts), and why.
// → { factor, why } (factor 1 and why '' when the weather's no hindrance)
export function weatherSlowdown(w) {
  const sky = String(w?.sky || ''), wind = String(w?.wind || '');
  const reasons = [[/Heavy snow/i.test(sky), 2, 'heavy snow'], [/Heavy rain/i.test(sky), 1.5, 'heavy rain'], [/Light snow/i.test(sky), 1.5, 'snow'], [/Strong/i.test(wind), 1.25, 'a strong wind']];
  const worst = reasons.filter(([on]) => on).sort((a, b) => b[1] - a[1])[0];
  return worst ? { factor: worst[1], why: worst[2] } : { factor: 1, why: '' };
}
