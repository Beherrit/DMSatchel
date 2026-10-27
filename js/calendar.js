// In-world calendars: named months of any length, weekdays, moons with phases, holidays, and the current date.
// Dates are written like "14 Highsun 1042" (an era suffix is optional), so they can live in ordinary entry fields.

export const PRESETS = {
  seasons: {
    label: 'Twelve months of 30 days, with seasons',
    months: ['Deepwinter', 'Thawmoon', 'Seedtime', 'Rainmoon', 'Bloomtide', 'Highsun', 'Goldfield', 'Harvest', 'Leaffall', 'Mistmoon', 'Frostfall', 'Longnight'].map((name) => ({ name, days: 30 })),
    weekdays: ['Moonday', 'Toilday', 'Wellday', 'Thornday', 'Fireday', 'Starday', 'Restday'],
    moons: [{ name: 'The moon', cycle: 30, offset: 0 }],
    holidays: [{ name: 'Midwinter', month: 0, day: 15 }, { name: 'Greengrass', month: 3, day: 1 }, { name: 'Midsummer', month: 5, day: 15 }, { name: 'Harvest Home', month: 7, day: 30 }, { name: 'Night of Lanterns', month: 11, day: 30 }],
  },
  earthlike: {
    label: 'Earth-like (twelve months, seven-day weeks)',
    months: [['Janus', 31], ['Februa', 28], ['Martius', 31], ['Aprilis', 30], ['Maius', 31], ['Junius', 30], ['Julius', 31], ['Augustus', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]].map(([name, days]) => ({ name, days })),
    weekdays: ['Sunday', 'Moonday', 'Tyrsday', 'Midweek', 'Thorsday', 'Freyday', 'Saturnday'],
    moons: [{ name: 'The moon', cycle: 29.5, offset: 0 }],
    holidays: [],
  },
  thirteen: {
    label: 'Thirteen months of 28 days',
    months: ['Ice', 'Wolf', 'Storm', 'Sap', 'Seed', 'Flower', 'Sun', 'Hay', 'Grain', 'Fruit', 'Smoke', 'Frost', 'Long Night'].map((m) => ({ name: `${m} Moon`, days: 28 })),
    weekdays: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'],
    moons: [{ name: 'The moon', cycle: 28, offset: 0 }],
    holidays: [],
  },
};

export function makeCalendar(preset = 'seasons', year = 1000) {
  const p = PRESETS[preset] || PRESETS.seasons;
  return { months: p.months.map((m) => ({ ...m })), weekdays: [...p.weekdays], moons: p.moons.map((m) => ({ ...m })), holidays: p.holidays.map((h) => ({ ...h })), era: '', year, month: 0, day: 1 };
}

// Accepts whatever was stored and returns a calendar that's safe to compute with, or null.
export function cleanCalendar(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.months) || !c.months.length) return null;
  const months = c.months.slice(0, 24).map((m) => ({ name: String(m?.name || 'Month').slice(0, 40), days: Math.max(1, Math.min(100, Math.round(Number(m?.days) || 30))) }));
  const weekdays = (Array.isArray(c.weekdays) ? c.weekdays : []).slice(0, 14).map((w) => String(w).slice(0, 30)).filter(Boolean);
  const moons = (Array.isArray(c.moons) ? c.moons : []).slice(0, 4).map((m) => ({ name: String(m?.name || 'Moon').slice(0, 40), cycle: Math.max(2, Math.min(400, Number(m?.cycle) || 30)), offset: Math.round(Number(m?.offset) || 0) }));
  const holidays = (Array.isArray(c.holidays) ? c.holidays : []).slice(0, 60).map((h) => ({ name: String(h?.name || '').slice(0, 60), month: Math.round(Number(h?.month) || 0), day: Math.round(Number(h?.day) || 1) }))
    .filter((h) => h.name && h.month >= 0 && h.month < months.length && h.day >= 1 && h.day <= months[h.month].days);
  const month = Math.max(0, Math.min(months.length - 1, Math.round(Number(c.month) || 0)));
  const day = Math.max(1, Math.min(months[month].days, Math.round(Number(c.day) || 1)));
  return { months, weekdays: weekdays.length ? weekdays : ['Day'], moons, holidays, era: String(c.era || '').slice(0, 12), year: Math.round(Number(c.year) || 0), month, day };
}

export const yearLength = (cal) => cal.months.reduce((t, m) => t + m.days, 0);

// Days since day 1 of month 0 of year 0. Works for negative years too.
export function toDays(cal, { year, month, day }) {
  let d = year * yearLength(cal);
  for (let i = 0; i < month; i++) d += cal.months[i].days;
  return d + day - 1;
}

export function fromDays(cal, n) {
  const len = yearLength(cal);
  const year = Math.floor(n / len);
  let rest = n - year * len, month = 0;
  while (rest >= cal.months[month].days) { rest -= cal.months[month].days; month++; }
  return { year, month, day: rest + 1 };
}

export const today = (cal) => ({ year: cal.year, month: cal.month, day: cal.day });
export function advance(cal, days) {
  const d = fromDays(cal, toDays(cal, today(cal)) + Math.round(days));
  return { ...cal, ...d };
}

export const weekday = (cal, date) => cal.weekdays[((toDays(cal, date) % cal.weekdays.length) + cal.weekdays.length) % cal.weekdays.length];

export function formatDate(cal, { year, month, day }, { weekday: wd = false } = {}) {
  return `${wd ? `${weekday(cal, { year, month, day })}, ` : ''}${day} ${cal.months[month].name} ${year}${cal.era ? ` ${cal.era}` : ''}`;
}

// "14 Highsun 1042", "Highsun 14, 1042", "14th of Highsun, 1042 AR" → {year, month, day}, or null.
export function parseDate(cal, text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const names = cal.months.map((m, i) => [m.name.toLowerCase(), i]).sort((a, b) => b[0].length - a[0].length);
  const low = s.toLowerCase();
  const hit = names.find(([n]) => low.includes(n));
  if (!hit) return null;
  const [name, month] = hit;
  const at = low.indexOf(name);
  const before = low.slice(0, at), after = low.slice(at + name.length);
  // The day comes before the month name ("14 Highsun", "3rd of Leaffall") or right after it ("Highsun 14, 1042").
  const dayBefore = before.match(/(\d{1,3})(?:st|nd|rd|th)?(?:\s+(?:day\s+)?of)?\s*$/);
  const dayAfter = dayBefore ? null : after.match(/^\s*(\d{1,3})(?:st|nd|rd|th)?\b(?!\s*\d)/);
  const dayM = dayBefore || dayAfter;
  const yearM = (dayAfter ? after.slice(dayAfter[0].length) : after).match(/-?\d+/);
  const day = dayM ? +dayM[1] : 1;
  if (day < 1 || day > cal.months[month].days) return null;
  return { year: yearM ? +yearM[0] : cal.year, month, day };
}

const PHASES = [['New moon', '🌑'], ['Waxing crescent', '🌒'], ['First quarter', '🌓'], ['Waxing gibbous', '🌔'], ['Full moon', '🌕'], ['Waning gibbous', '🌖'], ['Last quarter', '🌗'], ['Waning crescent', '🌘']];
export function moonPhase(cal, moon, date) {
  const age = (((toDays(cal, date) + moon.offset) % moon.cycle) + moon.cycle) % moon.cycle;
  const [name, icon] = PHASES[Math.floor((age / moon.cycle) * 8 + 0.5) % 8];
  return { name, icon, age };
}

export const holidaysOn = (cal, { month, day }) => cal.holidays.filter((h) => h.month === month && h.day === day);

// Days between two dates (b − a).
export const daysBetween = (cal, a, b) => toDays(cal, b) - toDays(cal, a);

// 'new' or 'full' on the one day each cycle when that happens, else null (for marking a month grid).
export function moonEvent(cal, moon, date) {
  const { age } = moonPhase(cal, moon, date);
  if (age < 1) return 'new';
  const half = moon.cycle / 2;
  return age >= half - 0.5 && age < half + 0.5 ? 'full' : null;
}
