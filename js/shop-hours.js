import { toDays, fromDays } from './calendar.js';
// Shops keep hours: by the world's clock (minutes after midnight), shops trade from 8 in the morning to 8 at night,
// and taverns until 2 in the morning. Pure, so the page and the server share it.

const HOURS = { shop: [8 * 60, 20 * 60], tavern: [8 * 60, 26 * 60] }; // a close past 24:00 runs into the next day

const kindOf = (shop) => (shop?.fields?.type === 'Tavern' || /tavern|inn/i.test(shop?.fields?.shop_type || '') ? 'tavern' : 'shop');

// holiday: the name of today's holiday, if any: shops shut for it all day (taverns stay open: it's a festival).
// → { open, opens (text, when shut), holiday? }
export function shopOpen(shop, minutes, holiday = '') {
  if (holiday && kindOf(shop) === 'shop') return { open: false, opens: 'tomorrow', holiday };
  const [from, to] = HOURS[kindOf(shop)];
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const open = (m >= from && m < Math.min(to, 1440)) || (to > 1440 && m < to - 1440);
  return { open, opens: open ? '' : 'at 8 in the morning' };
}

// Today's holiday on a calendar (from calendar.js's cleaned calendar), for shopOpen: its name, or ''.
export function holidayToday(cal) {
  if (!cal || !Array.isArray(cal.holidays)) return '';
  return cal.holidays.find((h) => h.month === cal.month && h.day === cal.day)?.name || '';
}

// What a shut shop says: "shut for Bridge Day" or "shut for the night".
export const shutText = (o) => (o.holiday ? `shut for ${o.holiday}` : 'shut for the night');

// Closing time: how long until a shop shuts (when open) or opens (when shut), in minutes of the world's clock.
// → { open, mins } (mins null when it's shut for a holiday: it opens tomorrow).
export function untilChange(shop, minutes, holiday = '') {
  const o = shopOpen(shop, minutes, holiday);
  if (o.holiday) return { open: false, mins: null };
  const [from, to] = HOURS[kindOf(shop)];
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  if (o.open) return { open: true, mins: to > 1440 && m < to - 1440 ? to - 1440 - m : to - m };
  return { open: false, mins: m < from ? from - m : 1440 - m + from };
}

// Holiday prices on the shelf: tomorrow's holiday (the day before it, festive goods cost more), or ''.
export function holidayTomorrow(cal) {
  if (!cal || !Array.isArray(cal.holidays) || !cal.holidays.length || !Array.isArray(cal.months)) return '';
  try { const t = fromDays(cal, toDays(cal, { year: cal.year, month: cal.month, day: cal.day }) + 1); return cal.holidays.find((h) => h.month === t.month && h.day === t.day)?.name || ''; } catch { return ''; }
}
export const EVE_MARKUP = 25;
const FESTIVE = /\b(candles?|ale|wine|mead|beer|cider|brandy|spirits?|sweets?|cakes?|honey|ribbons?|flowers?|garlands?|lanterns?|fireworks?|incense|perfume|fine clothes|costumes?)\b/i;
export const isFestive = (name) => FESTIVE.test(String(name || ''));
// The price of one thing on the eve of a holiday (a quarter more for festive goods), or as it was.
export const evePrice = (cp, name, eve) => (eve && isFestive(name) ? Math.ceil((Number(cp) || 0) * (100 + EVE_MARKUP) / 100) : Number(cp) || 0);

// Open or shut, in a few words (for a map pin): "open till 20:00", "open till 02:00", "shut for Bridge Day",
// "shut till 08:00". → { open, text }
export function openText(shop, minutes, holiday = '') {
  const o = shopOpen(shop, minutes, holiday);
  if (o.holiday) return { open: false, text: shutText(o) };
  const u = untilChange(shop, minutes, holiday);
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const at = (m + u.mins) % 1440, hh = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
  return { open: u.open, text: `${u.open ? 'open' : 'shut'} till ${hh(at)}` };
}

// The next holiday after today, within `within` days: { name, days } (days 1 = tomorrow), or null.
export function nextHoliday(cal, within = 30) {
  if (!cal || !Array.isArray(cal.holidays) || !cal.holidays.length || !Array.isArray(cal.months)) return null;
  try {
    const t0 = toDays(cal, { year: cal.year, month: cal.month, day: cal.day });
    for (let d = 1; d <= within; d++) {
      const t = fromDays(cal, t0 + d);
      const h = cal.holidays.find((x) => x.month === t.month && x.day === t.day);
      if (h) return { name: h.name, days: d };
    }
  } catch { /* a calendar we can't count on */ }
  return null;
}
