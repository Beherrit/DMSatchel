// Time of day and light: the in-world hour during play, and the torches, lanterns and spells burning down as the GM
// moves time on. Stored on the world as { minutes (since midnight), lights: [{ id, name, left, total }] }.
// Passing midnight moves the calendar on by a day. Pure, shared by the page and the server.

export const LIGHTS = [['Torch', 60], ['Lantern', 360], ['Candle', 60], ['Light (cantrip)', 60], ['Continual flame', 0]];
export const STEPS = [[10, '+10 min'], [60, '+1 hour'], [60, 'Short rest (1 hour)'], [480, 'Long rest (8 hours)']];

const newId = () => Math.random().toString(36).slice(2, 9);
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));

export function readClock(c) {
  return { minutes: int(c?.minutes ?? 480, 0, 1439), lights: (Array.isArray(c?.lights) ? c.lights : []).filter((l) => l && l.name).slice(0, 20)
    .map((l) => ({ id: String(l.id || newId()), name: String(l.name).slice(0, 60), left: int(l.left, 0, 100000), total: int(l.total, 0, 100000), ...(l.forever ? { forever: true } : {}) })) };
}

// Move time on. → { clock, days (midnights passed), out: [names of lights that went out] }
export function advanceClock(c, by) {
  const cur = readClock(c), step = int(by, 0, 60 * 24 * 30);
  const total = cur.minutes + step;
  const out = [], lights = [];
  for (const l of cur.lights) {
    if (l.forever) { lights.push(l); continue; }
    const left = l.left - step;
    if (left > 0) lights.push({ ...l, left }); else out.push(l.name);
  }
  return { clock: { minutes: total % 1440, lights }, days: Math.floor(total / 1440), out };
}

export function setTime(c, minutes) { return { ...readClock(c), minutes: int(minutes, 0, 1439) }; }

export function addLight(c, name, minutes) {
  const cur = readClock(c), n = String(name || '').trim().slice(0, 60);
  if (!n) return { error: 'Name the light.' };
  if (cur.lights.length >= 20) return { error: 'That’s a lot of lights already. Put one out first.' };
  const m = int(minutes, 0, 100000);
  return { clock: { ...cur, lights: [...cur.lights, { id: newId(), name: n, left: m, total: m, ...(m ? {} : { forever: true }) }] } };
}
export const removeLight = (c, id) => { const cur = readClock(c); return { ...cur, lights: cur.lights.filter((l) => l.id !== id) }; };

const PARTS = [[0, 'the dead of night'], [300, 'dawn'], [420, 'morning'], [660, 'midday'], [780, 'afternoon'], [1020, 'evening'], [1140, 'dusk'], [1260, 'night']];
export const partOfDay = (m) => [...PARTS].reverse().find(([from]) => m >= from)[1];
export const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const leftText = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
