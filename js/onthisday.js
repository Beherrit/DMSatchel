// On this day: for the world's front page, what happened on today's in-world date in earlier years, whose birthday
// it is and which holiday. Pure, so it can be tested.
import { parseDate, today, toDays, holidaysOn } from './calendar.js';
import { birthdaysBetween } from './birthdays.js';

const DATED = { event: 'date', session: 'world_date' };

export function onThisDay(cal, entries) {
  const now = today(cal), n = toDays(cal, now);
  const anniversaries = [];
  for (const e of entries || []) {
    const f = DATED[e.kind]; if (!f) continue;
    const d = parseDate(cal, e.fields?.[f]);
    // Only dates that name their year count (a year-less date reads as this year).
    if (d && d.month === now.month && d.day === now.day && d.year < now.year && /\d{2,}/.test(String(e.fields[f]).replace(String(d.day), ''))) {
      anniversaries.push({ entry: e, yearsAgo: now.year - d.year });
    }
  }
  anniversaries.sort((a, b) => a.yearsAgo - b.yearsAgo || a.entry.name.localeCompare(b.entry.name));
  return { anniversaries, birthdays: birthdaysBetween(cal, entries, n, n), holidays: holidaysOn(cal, now) };
}

export const yearsAgoText = (n) => (n === 1 ? 'A year ago today' : `${n} years ago today`);
