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

export function moonlight(cal, date) {
  const moons = Array.isArray(cal?.moons) ? cal.moons.filter((m) => m && Number(m.cycle) > 0) : [];
  if (!moons.length) return null;
  const phases = moons.map((m) => ({ moon: m, ...moonPhase(cal, m, date) }));
  const best = phases.reduce((a, b) => ((LIGHT[b.name] ?? 0) > (LIGHT[a.name] ?? 0) ? b : a));
  const level = LIGHT[best.name] ?? 0;
  const who = moons.length > 1 ? `${best.moon.name}: ` : '';
  return { level, icon: best.icon, text: `${who}${best.name}: ${SAY[level]}` };
}
