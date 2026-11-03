// Quest deadlines: an open quest's in-world deadline (fields.deadline, any date the calendar reads) as days left.
// Finished quests have no countdown. Pure, so it can be tested.
import { parseDate, toDays, today, holidaysOn } from './calendar.js';

const DONE = ['Completed', 'Failed', 'Abandoned'];

// → { left (days; negative when overdue), date } or null.
export function deadlineOf(cal, q) {
  if (!cal || q?.kind !== 'quest' || DONE.includes(q.fields?.status)) return null;
  const d = parseDate(cal, q.fields?.deadline);
  if (!d) return null;
  // Deadlines on holidays: the holiday the day falls on, if any.
  const holiday = Array.isArray(cal.holidays) ? holidaysOn(cal, d)[0]?.name || '' : '';
  return { left: toDays(cal, d) - toDays(cal, today(cal)), date: d, holiday };
}

// "4 days left", or on a holiday "due on Bridge Day, in 4 days" (passed or not: "was due on Bridge Day, 2 days ago").
export function deadlineText(left, holiday = '') {
  if (typeof holiday === 'string' && holiday) {
    if (left === 0) return `due today, ${holiday}`;
    if (left < 0) return `was due on ${holiday}: overdue by ${-left} day${left === -1 ? '' : 's'}`;
    return `due on ${holiday}, in ${left} day${left === 1 ? '' : 's'}`;
  }
  if (left === 0) return 'due today';
  if (left < 0) return `overdue by ${-left} day${left === -1 ? '' : 's'}`;
  return `${left} day${left === 1 ? '' : 's'} left`;
}
