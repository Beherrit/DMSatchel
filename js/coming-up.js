// Coming up for you: the next week of in-world days that matter to one character: their birthday, the deadlines of
// their quests, and festivals. Pure: cal from calendar.js, entries as the viewer sees them.
import { toDays, today, fromDays, parseDate, holidaysOn } from './calendar.js';
import { birthdaysBetween } from './birthdays.js';

const DONE = ['Completed', 'Failed', 'Abandoned'];

// char: the character entry; quests: the quests that are theirs (or the party's). → [{ n, in (days from today),
// date, icon, text, entry? }] by day.
export function comingUp(cal, char, quests, days = 7) {
  if (!cal || !char) return [];
  const from = toDays(cal, today(cal)), to = from + days, out = [];
  for (const b of birthdaysBetween(cal, [char], from, to)) out.push({ n: b.n, date: b.date, icon: '🎂', text: b.age ? `Your birthday: ${char.name} turns ${b.age}` : `Your birthday` });
  for (const q of quests || []) {
    if (q.kind !== 'quest' || DONE.includes(q.fields?.status)) continue;
    const d = parseDate(cal, q.fields?.deadline);
    if (!d) continue;
    const n = toDays(cal, d);
    if (n >= from && n <= to) out.push({ n, date: d, icon: '⏳', text: `Deadline: ${q.name}`, entry: q });
  }
  for (let n = from; n <= to; n++) { const d = fromDays(cal, n); for (const h of holidaysOn(cal, d)) out.push({ n, date: d, icon: '🎉', text: h.name }); }
  return out.map((x) => ({ ...x, in: x.n - from })).sort((a, b) => a.n - b.n);
}

// "today", "tomorrow", "in 3 days".
export const whenText = (k) => (k === 0 ? 'today' : k === 1 ? 'tomorrow' : `in ${k} days`);
