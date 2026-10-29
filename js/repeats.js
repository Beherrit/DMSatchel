// Repeating events: an event can come round every week, month or year from its date (market day, the council's
// moot, a feast), optionally until a date. Pure, so it can be tested.
import { parseDate, toDays, fromDays } from './calendar.js';

// The repeats after the event's own date that fall between two day numbers: → [{ entry, n, date }], soonest first.
// The first time is the event's own date, which the calendar already shows.
export function repeatsBetween(cal, entries, fromN, toN) {
  const out = [];
  const week = cal.weekdays.length || 7;
  for (const e of entries || []) {
    const how = e.kind === 'event' && e.fields?.repeats;
    if (!how) continue;
    const start = parseDate(cal, e.fields.date);
    if (!start) continue;
    const s = toDays(cal, start);
    const until = parseDate(cal, e.fields.until);
    const end = Math.min(toN, until ? toDays(cal, until) : Infinity);
    const add = (n, date) => { if (n > s && n >= fromN && n <= end) out.push({ entry: e, n, date: date || fromDays(cal, n) }); };
    if (how === 'Every week') {
      const first = Math.max(s + week, s + Math.ceil((fromN - s) / week) * week);
      for (let n = first; n <= end; n += week) add(n);
    } else if (how === 'Every month' || how === 'Every year') {
      const a = fromDays(cal, Math.max(fromN, s)), b = fromDays(cal, end === Infinity ? toN : end);
      for (let y = a.year; y <= b.year; y++) {
        const months = how === 'Every year' ? [start.month] : cal.months.map((_, i) => i);
        for (const month of months) {
          if (start.day > cal.months[month].days) continue; // this month is too short for the day
          const date = { year: y, month, day: start.day };
          add(toDays(cal, date), date);
        }
      }
    }
  }
  return out.sort((a, b) => a.n - b.n || a.entry.name.localeCompare(b.entry.name));
}
