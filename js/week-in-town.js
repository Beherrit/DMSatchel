// The week in town: the coming days in a settlement, with its holidays, its market day, and which of its shops and
// taverns shut on which day (a weekly day off, or a holiday). Pure: works on a calendar, a town and its shops.
import { toDays, fromDays, holidaysOn, weekday } from './calendar.js';
import { shopOpen, isMarketDay } from './shop-hours.js';

// → [{ n, date, weekday, today, holidays: [names], market (bool), noMarket (bool: market weekday, but a holiday),
//      shut: [{ name, why: 'holiday' | 'day off' }] }], only days with something to say.
export function weekInTown(cal, town, shops = [], days = 7) {
  if (!cal || !Array.isArray(cal.months) || !cal.months.length) return [];
  const from = toDays(cal, { year: cal.year, month: cal.month, day: cal.day });
  const out = [];
  for (let n = from; n < from + days; n++) {
    const day = { n, ...dayInTown(cal, town, shops, fromDays(cal, n)), today: n === from };
    if (day.holidays.length || day.market || day.noMarket || day.shut.length) out.push(day);
  }
  return out;
}

// One day in town: → { date, weekday, holidays, market, noMarket, shut: [{ name, why }] } (see weekInTown).
export function dayInTown(cal, town, shops, date) {
  const wd = Array.isArray(cal.weekdays) && cal.weekdays.length ? weekday(cal, date) || '' : '';
  const holidays = Array.isArray(cal.holidays) ? holidaysOn(cal, date).map((h) => h.name) : [];
  const marketWd = !!wd && isMarketDay(town, wd);
  const shut = [];
  for (const s of shops) {
    const o = shopOpen(s, 12 * 60, { holiday: holidays[0] || '', weekday: wd });
    if (o.holiday) shut.push({ name: s.name, why: 'holiday' });
    else if (o.dayOff) shut.push({ name: s.name, why: 'day off' });
  }
  return { date, weekday: wd, holidays, market: marketWd && !holidays.length, noMarket: marketWd && !!holidays.length, shut };
}

// One line of the week: "🎉 Bridge Day · no market · shut: Smithy, Tanner".
export function weekDayText(d) {
  const bits = [...d.holidays.map((h) => `🎉 ${h}`)];
  if (d.market) bits.push('🧺 market day');
  if (d.noMarket) bits.push('no market (holiday)');
  const off = d.shut.filter((s) => s.why === 'day off').map((s) => s.name), hol = d.shut.filter((s) => s.why === 'holiday').map((s) => s.name);
  if (hol.length) bits.push(`shut for the holiday: ${hol.join(', ')}`);
  if (off.length) bits.push(`day off: ${off.join(', ')}`);
  return bits.join(' · ');
}

// The whole week as plain text, for a handout or a chat: "The week in Brindle\n- Starday 6 Thawmoon: 🧺 market day".
export function weekText(townName, week, label) {
  return [`The week in ${townName}`, ...week.map((d) => `- ${label(d)}: ${weekDayText(d)}`)].join('\n');
}
