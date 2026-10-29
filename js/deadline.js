// Quest deadlines: an open quest's in-world deadline (fields.deadline, any date the calendar reads) as days left.
// Finished quests have no countdown. Pure, so it can be tested.
import { parseDate, toDays, today } from './calendar.js';

const DONE = ['Completed', 'Failed', 'Abandoned'];

// → { left (days; negative when overdue), date } or null.
export function deadlineOf(cal, q) {
  if (!cal || q?.kind !== 'quest' || DONE.includes(q.fields?.status)) return null;
  const d = parseDate(cal, q.fields?.deadline);
  return d ? { left: toDays(cal, d) - toDays(cal, today(cal)), date: d } : null;
}

export function deadlineText(left) {
  if (left === 0) return 'due today';
  if (left < 0) return `overdue by ${-left} day${left === -1 ? '' : 's'}`;
  return `${left} day${left === 1 ? '' : 's'} left`;
}
