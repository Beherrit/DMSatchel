// The week in town: the coming days in a settlement, with its holidays, its market day, and which of its shops and
// taverns shut on which day (a weekly day off, or a holiday). Pure: works on a calendar, a town and its shops.
import { toDays, fromDays, holidaysOn, weekday, holidayTitle } from './calendar.js';
import { shopOpen, isMarketDay } from './shop-hours.js';
import { birthdaysBetween } from './birthdays.js';

// → [{ n, date, weekday, today, holidays: [names], market (bool), noMarket (bool: market weekday, but a holiday),
//      shut: [{ name, why: 'holiday' | 'day off' }] }], only days with something to say.
// people: who lives in the town, for their birthdays ({ name, age|null } on the day's births).
export function weekInTown(cal, town, shops = [], days = 7, people = []) {
  if (!cal || !Array.isArray(cal.months) || !cal.months.length) return [];
  const from = toDays(cal, { year: cal.year, month: cal.month, day: cal.day });
  const out = [];
  let bdays = [];
  try { bdays = people.length ? birthdaysBetween(cal, people, from, from + days - 1) : []; } catch { bdays = []; }
  for (let n = from; n < from + days; n++) {
    const births = bdays.filter((b) => b.n === n).map((b) => ({ name: b.entry.name, age: b.age }));
    const day = { n, ...dayInTown(cal, town, shops, fromDays(cal, n)), today: n === from, births };
    if (day.holidays.length || day.market || day.noMarket || day.shut.length || births.length) out.push(day);
  }
  return out;
}

// One day in town: → { date, weekday, holidays, market, noMarket, shut: [{ name, why }], open: [names open for a holiday] } (see weekInTown).
export function dayInTown(cal, town, shops, date) {
  const wd = Array.isArray(cal.weekdays) && cal.weekdays.length ? weekday(cal, date) || '' : '';
  // A local holiday with a first year is counted: "the 200th Founding Day".
  const holidays = Array.isArray(cal.holidays) ? holidaysOn(cal, date).map((h) => holidayTitle(h, date.year)) : [];
  const marketWd = !!wd && isMarketDay(town, wd);
  const shut = [], open = [];
  for (const s of shops) {
    const o = shopOpen(s, 12 * 60, { holiday: holidays[0] || '', weekday: wd });
    if (o.holiday) shut.push({ name: s.name, why: 'holiday' });
    else if (o.dayOff) shut.push({ name: s.name, why: 'day off' });
    // Open for the holiday: a shop that chose to trade on festival days (taverns always do, so they aren't listed).
    else if (holidays.length && /^yes$/i.test(String(s?.fields?.holiday_open || '').trim())) open.push(s.name);
  }
  return { date, weekday: wd, holidays, market: marketWd && !holidays.length, noMarket: marketWd && !!holidays.length, shut, open };
}

// One line of the week: "🎉 Bridge Day · no market · shut: Smithy, Tanner".
export function weekDayText(d) {
  const bits = [...d.holidays.map((h) => `🎉 ${h}`)];
  for (const b of d.births || []) bits.push(`🎂 ${b.name}’s birthday${b.age !== null && b.age !== undefined ? ` (${b.age})` : ''}`);
  if (d.market) bits.push('🧺 market day');
  if (d.noMarket) bits.push('no market (holiday)');
  const off = d.shut.filter((s) => s.why === 'day off').map((s) => s.name), hol = d.shut.filter((s) => s.why === 'holiday').map((s) => s.name);
  if (hol.length) bits.push(`shut for the holiday: ${hol.join(', ')}`);
  if (off.length) bits.push(`day off: ${off.join(', ')}`);
  if (d.open?.length) bits.push(`open for the holiday: ${d.open.join(', ')}`);
  return bits.join(' · ');
}

// The whole week as plain text, for a handout or a chat: "The week in Brindle\n- Starday 6 Thawmoon: 🧺 market day".
export function weekText(townName, week, label) {
  return [`The week in ${townName}`, ...week.map((d) => `- ${label(d)}: ${weekDayText(d)}`)].join('\n');
}

// The next market day in a town, from today (today counts), skipping any that fall on a holiday.
// → { n, date, weekday, inDays } or null (no market day, no weekdays, or none within `within` days).
export function nextMarket(cal, town, within = 60) {
  if (!cal || !town?.fields?.market_day || !Array.isArray(cal.weekdays) || !cal.weekdays.length) return null;
  const from = toDays(cal, { year: cal.year, month: cal.month, day: cal.day });
  for (let n = from; n <= from + within; n++) {
    const date = fromDays(cal, n), wd = weekday(cal, date);
    if (isMarketDay(town, wd) && !(Array.isArray(cal.holidays) && holidaysOn(cal, date).length)) return { n, date, weekday: wd, inDays: n - from };
  }
  return null;
}
export const inDaysText = (k) => (k === 0 ? 'today' : k === 1 ? 'tomorrow' : `in ${k} days`);

// A shop's next day shut (from tomorrow): its weekly day off, or a holiday it doesn't trade on.
// → { inDays, weekday, why: 'day off' | 'holiday', holiday? } or null (open every day for `within` days).
export function nextShut(cal, shop, within = 60) {
  if (!cal || !Array.isArray(cal.months) || !cal.months.length) return null;
  const from = toDays(cal, { year: cal.year, month: cal.month, day: cal.day });
  for (let n = from + 1; n <= from + within; n++) {
    const d = dayInTown(cal, null, [shop], fromDays(cal, n)), s = d.shut[0];
    if (s) return { inDays: n - from, weekday: d.weekday, why: s.why, ...(s.why === 'holiday' ? { holiday: d.holidays[0] } : {}) };
  }
  return null;
}
