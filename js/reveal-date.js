// Reveal on a date: a hidden entry can be set to reveal itself to players on a chosen day (a letter that arrives, a
// festival that's announced). The server reveals it the first time anyone loads the world after that moment. Pure,
// so it can be tested.

const MAX_AHEAD = 3 * 366 * 864e5;

// A requested time → { at: ISO string | null } or { error }. null/'' clears it.
export function cleanRevealAt(v, now = Date.now()) {
  if (v === null || v === '' || v === undefined) return { at: null };
  const t = Date.parse(String(v));
  if (!Number.isFinite(t)) return { error: 'Pick a date.' };
  if (t <= now) return { error: 'Pick a day after today, or use “Reveal to players” now.' };
  if (t - now > MAX_AHEAD) return { error: 'Pick a day within the next three years.' };
  return { at: new Date(t).toISOString() };
}

// 'YYYY-MM-DD' (a day picked in the GM's own time zone) → the start of that day there, as an ISO string.
export function startOfLocalDay(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toISOString() : null;
}
