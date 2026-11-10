// Coming up for you: the next week of in-world days that matter to one character: their birthday, the deadlines of
// their quests, and festivals. Pure: cal from calendar.js, entries as the viewer sees them.
import { toDays, today, fromDays, parseDate, holidaysOn, weekday } from './calendar.js';
import { birthdaysBetween } from './birthdays.js';

const DONE = ['Completed', 'Failed', 'Abandoned'];

// char: the character entry; quests: the quests that are theirs (or the party's). → [{ n, in (days from today),
// date, icon, text, entry? }] by day.
// markets: [{ town (a name), day (its market weekday) }], for "Market day in Brindle" on those days.
export function comingUp(cal, char, quests, days = 7, { markets = [] } = {}) {
  if (!cal || !char) return [];
  const from = toDays(cal, today(cal)), to = from + days, out = [];
  for (const b of birthdaysBetween(cal, [char], from, to)) out.push({ n: b.n, date: b.date, icon: '🎂', text: b.age ? `Your birthday: ${char.name} turns ${b.age}` : `Your birthday` });
  for (const q of quests || []) {
    if (q.kind !== 'quest' || DONE.includes(q.fields?.status)) continue;
    const d = parseDate(cal, q.fields?.deadline);
    if (!d) continue;
    const n = toDays(cal, d);
    // Holiday deadlines: say when one falls on a festival day.
    const hol = Array.isArray(cal.holidays) ? holidaysOn(cal, d)[0]?.name : '';
    if (n >= from && n <= to) out.push({ n, date: d, icon: '⏳', text: `Deadline: ${q.name}${hol ? ` (on ${hol})` : ''}`, entry: q });
  }
  for (let n = from; n <= to; n++) { const d = fromDays(cal, n); for (const h of holidaysOn(cal, d)) out.push({ n, date: d, icon: '🎉', text: `${h.name} (the shops are shut)` }); }
  // Market day coming up: the next market day in each town given (just the first, so it isn't every week's list).
  const norm = (w) => String(w || '').trim().toLowerCase().replace(/s$/, '');
  if (Array.isArray(cal.weekdays) && cal.weekdays.length) for (const mk of markets) {
    for (let n = from; n <= to; n++) { const d = fromDays(cal, n); if (norm(weekday(cal, d)) === norm(mk.day) && !holidaysOn(cal, d).length) { out.push({ n, date: d, icon: '🧺', text: `Market day in ${mk.town}` }); break; } }
  }
  return out.map((x) => ({ ...x, in: x.n - from })).sort((a, b) => a.n - b.n);
}

// "today", "tomorrow", "in 3 days".
export const whenText = (k) => (k === 0 ? 'today' : k === 1 ? 'tomorrow' : `in ${k} days`);
