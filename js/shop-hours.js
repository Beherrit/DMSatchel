import { toDays, fromDays, weekday } from './calendar.js';
// Shops keep hours: by the world's clock (minutes after midnight), shops trade from 8 in the morning to 8 at night,
// and taverns until 2 in the morning. Pure, so the page and the server share it.

const HOURS = { shop: [8 * 60, 20 * 60], tavern: [8 * 60, 26 * 60] }; // a close past 24:00 runs into the next day

const kindOf = (shop) => (shop?.fields?.type === 'Tavern' || /tavern|inn/i.test(shop?.fields?.shop_type || '') ? 'tavern' : 'shop');

// A shop's own hours (its Hours field): "10-18", "10:30–18", "6pm–2am", "9am to 5pm", "noon–midnight" →
// [open, close] in minutes (close past 24:00 when it runs into the night), or null when it can't read them.
export function parseHours(text) {
  const t = String(text || '').toLowerCase().replace(/[’']/g, '').trim();
  if (!t) return null;
  const part = '(\\d{1,2}(?::\\d\\d)?\\s*(?:am|pm)?|noon|midnight)';
  const m = new RegExp(`^${part}\\s*(?:-|–|—|to|till|until)\\s*${part}$`).exec(t);
  if (!m) return null;
  const at = (x) => {
    if (x === 'noon') return 720;
    if (x === 'midnight') return 1440;
    const r = /^(\d{1,2})(?::(\d\d))?\s*(am|pm)?$/.exec(x.trim());
    let h = Number(r[1]) % 24;
    if (r[3]) h = (Number(r[1]) % 12) + (r[3] === 'pm' ? 12 : 0);
    return h * 60 + (Number(r[2]) || 0);
  };
  let from = at(m[1]); const to = at(m[2]);
  if (from === 1440) from = 0;
  if (from === to) return null;
  return [from, to > from ? to : to + 1440];
}

// The hours a shop keeps: its own, or the usual for its kind; on its town's market day it opens two hours early.
export const MARKET_EARLY = 120;
const hoursOf = (shop, day) => { const [from, to] = parseHours(shop?.fields?.hours) || HOURS[kindOf(shop)]; return day?.market && kindOf(shop) === 'shop' ? [Math.max(0, from - MARKET_EARLY), to] : [from, to]; };
const clock = (x) => `${String(Math.floor((x % 1440) / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
const opensText = (from) => (from === 8 * 60 ? 'at 8 in the morning' : `at ${clock(from)}`);

// holiday: the name of today's holiday, if any: shops shut for it all day (taverns stay open: it's a festival).
// → { open, opens (text, when shut), holiday? }
// day: today's holiday name, or tradeDay(cal)'s { holiday, weekday } (a shop with a day off shuts on it, taverns too).
export function shopOpen(shop, minutes, day = '') {
  const holiday = typeof day === 'string' ? day : day?.holiday || '';
  // Open on holidays: a shop can choose to trade on festival days (taverns always do).
  if (holiday && kindOf(shop) === 'shop' && !/^yes$/i.test(String(shop?.fields?.holiday_open || '').trim())) return { open: false, opens: 'tomorrow', holiday };
  const off = typeof day === 'object' && day?.weekday && String(shop?.fields?.closed_on || '').trim().toLowerCase().replace(/s$/, '') === day.weekday.toLowerCase().replace(/s$/, '');
  if (off) return { open: false, opens: 'tomorrow', dayOff: day.weekday };
  const [from, to] = hoursOf(shop, day);
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const open = (m >= from && m < Math.min(to, 1440)) || (to > 1440 && m < to - 1440);
  // Shut at night, or (for a shop that keeps night hours) by day: "shut for the night" only when it is.
  return { open, opens: open ? '' : opensText(from), ...(open ? {} : { night: m >= 20 * 60 || m < 6 * 60 }) };
}

// Today's holiday on a calendar (from calendar.js's cleaned calendar), for shopOpen: its name, or ''.
export function holidayToday(cal) {
  if (!cal || !Array.isArray(cal.holidays)) return '';
  return cal.holidays.find((h) => h.month === cal.month && h.day === cal.day)?.name || '';
}

// Today, for the shops: { holiday, weekday } (weekday '' when the calendar has none), for shopOpen and friends. Add
// market: true for a shop whose town's market day it is (see marketDayToday).
export function tradeDay(cal) {
  if (!cal) return { holiday: '', weekday: '' };
  let wd = '';
  try { wd = Array.isArray(cal.weekdays) && cal.weekdays.length && Array.isArray(cal.months) ? weekday(cal, { year: cal.year, month: cal.month, day: cal.day }) || '' : ''; } catch { wd = ''; }
  return { holiday: holidayToday(cal), weekday: wd };
}

// What a shut shop says: "shut for Bridge Day" or "shut for the night".
export const shutText = (o) => (o.holiday ? `shut for ${o.holiday}` : o.dayOff ? `shut on ${o.dayOff}s` : o.night === false ? 'shut just now' : 'shut for the night');

// Closing time: how long until a shop shuts (when open) or opens (when shut), in minutes of the world's clock.
// → { open, mins } (mins null when it's shut for a holiday: it opens tomorrow).
export function untilChange(shop, minutes, holiday = '') {
  const o = shopOpen(shop, minutes, holiday);
  if (o.holiday || o.dayOff) return { open: false, mins: null };
  const [from, to] = hoursOf(shop, holiday);
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
  if (o.holiday || o.dayOff) return { open: false, text: shutText(o) };
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

// Trading hours, in minutes after midnight: [open, close] (close may run past midnight: 26 * 60 is 2 at night).
export const tradingHours = (shop, day) => [...hoursOf(shop, day)];

// Hours as a sign on the door: "Open 08:00–20:00", "Open 18:00–02:00 · Shut on Firedays".
export function hoursSign(shop) {
  const [from, to] = hoursOf(shop, null), off = String(shop?.fields?.closed_on || '').trim().replace(/s$/i, '');
  return `Open ${clock(from)}–${clock(to)}${off ? ` · Shut on ${off}s` : ''}`;
}

// Rolled shops keep sensible hours: the hours that suit a trade (SHOP_TYPES in economy.js), or '' for the usual.
const TRADE_HOURS = { 'Black market': '10pm–4am', 'Curiosity shop': '11–19', 'Bookseller': '9–17', 'Temple': '6–20', 'Stables': '6–20', 'Shipwright & chandler': '6–18', 'Jeweler': '10–18', 'Magic shop': '10–18', 'Trading post': '7–19' };
export const typicalHours = (type) => TRADE_HOURS[type] || '';

// Market day: a settlement's Market day field names a weekday; is today it? (case and a plural "s" don't matter)
export const isMarketDay = (town, weekdayName) => !!weekdayName && String(town?.fields?.market_day || '').trim().toLowerCase().replace(/s$/, '') === String(weekdayName).toLowerCase().replace(/s$/, '');

// Hours as you type: how the Hours field reads ("Open 18:00–02:00"), or that it can't ('' when empty).
export function hoursPreview(text) {
  if (!String(text || '').trim()) return '';
  const h = parseHours(text);
  return h ? `Open ${clock(h[0])}–${clock(h[1])}` : 'Can’t read that; the usual hours apply (shops 08:00–20:00, taverns 08:00–02:00). Try “10–18” or “6pm–2am”.';
}
