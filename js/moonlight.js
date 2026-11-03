// Moonlight at night: how much the world's moons light the way tonight, from their phases (the brightest moon wins).
// Pure: cal from calendar.js (with moons), date { year, month, day }. → { level, icon, text } or null without moons.
import { moonPhase } from './calendar.js';

const LIGHT = { 'Full moon': 4, 'Waxing gibbous': 3, 'Waning gibbous': 3, 'First quarter': 2, 'Last quarter': 2, 'Waxing crescent': 1, 'Waning crescent': 1, 'New moon': 0 };
const SAY = [
  'no moon to see by, so bring a light',
  'little to see by outdoors',
  'dim light, enough to follow a road',
  'enough light to see by outdoors',
  'bright enough to read by outdoors',
];

// sky: tonight's weather sky ("Overcast", "Heavy rain", "Scattered clouds"…), when known: cloud hides the moon.
const CLOUDED = /overcast|rain|snow|storm|sleet|drizzle|fog|mist|hail|blizzard/i, PATCHY = /cloud/i;
export function moonlight(cal, date, sky = '') {
  const moons = Array.isArray(cal?.moons) ? cal.moons.filter((m) => m && Number(m.cycle) > 0) : [];
  if (!moons.length) return null;
  const phases = moons.map((m) => ({ moon: m, ...moonPhase(cal, m, date) }));
  const best = phases.reduce((a, b) => ((LIGHT[b.name] ?? 0) > (LIGHT[a.name] ?? 0) ? b : a));
  const moonLevel = LIGHT[best.name] ?? 0;
  const who = moons.length > 1 ? `${best.moon.name}: ` : '';
  // Clouds hide the moon: overcast or worse leaves it dark; scattered clouds dim it a step.
  if (moonLevel && CLOUDED.test(sky)) return { level: 0, icon: '☁️', text: `${who}${best.name} behind the clouds (${sky.toLowerCase()}): ${SAY[0]}` };
  const level = moonLevel && PATCHY.test(sky) ? moonLevel - 1 : moonLevel;
  return { level, icon: best.icon, text: `${who}${best.name}${level < moonLevel ? ' through broken cloud' : ''}: ${SAY[level]}` };
}

// Night in the encounter roll: what tonight's light means at the table (moonlight is dim light; no moon is darkness).
export function nightLight(level) {
  return level > 0
    ? 'Dim light (moonlit): the area is lightly obscured, so sight-based Perception checks have disadvantage.'
    : 'Darkness: the area is heavily obscured without a light; creatures without darkvision are effectively blinded.';
}
