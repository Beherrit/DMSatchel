// Birthdays on the calendar: characters' and NPCs' in-world birthdays (fields.born, any date the calendar can read)
// recur every year. Pure, so it can be tested.
import { parseDate, toDays, fromDays, today } from './calendar.js';

const KINDS = ['character', 'npc'];
const gone = (e) => ['Dead', 'Undead'].includes(e.fields?.status);

// Did the text give a birth year? "3 Thaw 1012" and "Thaw 1012" yes; "3 Thaw" no.
const yearGiven = (text, day) => { const nums = String(text).match(/-?\d+/g) || []; return nums.length >= 2 || (nums.length === 1 && Number(nums[0]) !== day); };

// Birthdays falling between two day numbers (inclusive): → [{ entry, n, date, age|null }], soonest first.
export function birthdaysBetween(cal, entries, fromN, toN) {
  const out = [];
  const y0 = fromDays(cal, fromN).year, y1 = fromDays(cal, toN).year;
  for (const e of entries || []) {
    if (!KINDS.includes(e.kind) || gone(e)) continue;
    const b = parseDate(cal, e.fields?.born);
    if (!b) continue;
    const knowsYear = yearGiven(e.fields.born, b.day);
    for (let y = y0; y <= y1; y++) {
      if (knowsYear && y < b.year) continue;
      const date = { year: y, month: b.month, day: b.day }, n = toDays(cal, date);
      if (n >= fromN && n <= toN) out.push({ entry: e, n, date, age: knowsYear ? y - b.year : null });
    }
  }
  return out.sort((a, b) => a.n - b.n || a.entry.name.localeCompare(b.entry.name));
}

export const birthdayText = (x) => `🎂 ${x.entry.name}${x.age ? ` turns ${x.age}` : '’s birthday'}`;

// How old someone is today in the world (or was when they died, if the date they died is one the calendar reads):
// → { age, died } or null when the birth year isn't known.
export function ageOf(cal, e) {
  if (!cal || !KINDS.includes(e?.kind)) return null;
  const b = parseDate(cal, e.fields?.born);
  if (!b || !yearGiven(e.fields.born, b.day)) return null;
  let at = today(cal), died = false;
  if (e.fields?.status === 'Dead') { const d = parseDate(cal, e.fields?.fate_day); if (!d) return null; at = d; died = true; }
  const age = at.year - b.year - (at.month < b.month || (at.month === b.month && at.day < b.day) ? 1 : 0);
  return age >= 0 ? { age, died } : null;
}

export const ageText = (a) => (a.died ? `died aged ${a.age}` : `${a.age} year${a.age === 1 ? '' : 's'} old`);
