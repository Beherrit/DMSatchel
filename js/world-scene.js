// Set the scene where the party is (or any place): the time, the weather, the light and any festival, as one line
// (scene.js), for session prep, the session sheet and the party page.
import { world, getEntry } from './world-store.js';
import { cleanCalendar, today, withLocal } from './calendar.js';
import { readClock, partOfDay } from './clock.js';
import { holidayToday, tradeDay, marketToday } from './shop-hours.js';
import { moonlight } from './moonlight.js';
import { sceneLine } from './scene.js';
import { dayWeather } from './forecast.js';
import { placeTerrains } from './encounter-ui.js';
import { worldCalendar } from './world-calendar.js';

const townOf = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.kind === 'settlement') return x; return null; };

// here: a place entry (default: where the party is). → the line, or '' when there's no place.
export function sceneFor(here = world.info?.party_at && getEntry(world.info.party_at)) {
  if (!here) return '';
  let weather = null;
  try { weather = dayWeather(here.id, placeTerrains(here), worldCalendar()); } catch { weather = null; }
  const m = world.info?.clock?.minutes, c = cleanCalendar(world.info?.cal), night = m !== undefined && (m % 1440 >= 20 * 60 || m % 1440 < 5 * 60);
  const ml = night && c ? moonlight(c, today(c), weather?.sky || '') : null;
  return sceneLine({ place: (townOf(here) || here).name, part: m === undefined ? '' : partOfDay(m), weather: weather?.line || '', moon: ml?.text || '',
    holiday: c ? holidayToday(withLocal(c, townOf(here))) : '',
    // Market-day crowds: the party's town's market day (its own holidays count, so no market on one).
    market: (() => { const t = townOf(here); return !!(c && t && marketToday(t, tradeDay(withLocal(c, t)))); })(), lights: readClock(world.info?.clock).lights.map((l) => l.name) });
}
