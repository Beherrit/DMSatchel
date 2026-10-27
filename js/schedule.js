// Next-session scheduling: a GM proposes dates, everyone answers yes / maybe / no for each, and the best date wins.
// Pure helpers shared by the page and the server.

export const ANSWERS = ['yes', 'maybe', 'no'];
export const MAX_DATES = 10;

// Proposed dates: real date-times (ISO strings), no repeats, in order, at most MAX_DATES.
export function cleanDates(list) {
  const seen = new Set(), out = [];
  for (const v of Array.isArray(list) ? list : []) {
    const t = Date.parse(v);
    if (!Number.isFinite(t)) continue;
    const iso = new Date(t).toISOString();
    if (!seen.has(iso)) { seen.add(iso); out.push(iso); }
  }
  return out.sort().slice(0, MAX_DATES);
}

// One person's answers: one entry per date, each 'yes', 'maybe', 'no' or '' (not answered).
export const cleanVote = (list, n) => Array.from({ length: n }, (_, i) => (ANSWERS.includes(list?.[i]) ? list[i] : ''));

// Per date: who said what, and a score (yes = 2, maybe = 1). The best date has the most yeses, then maybes, then
// comes first; it's null until someone can make one. `missing` is members who haven't answered anything.
export function tally(poll, memberIds = []) {
  const votes = poll.votes || {};
  const rows = (poll.dates || []).map((at, i) => {
    const row = { i, at, yes: [], maybe: [], no: [] };
    for (const [who, list] of Object.entries(votes)) if (ANSWERS.includes(list?.[i])) row[list[i]].push(who);
    row.score = row.yes.length * 2 + row.maybe.length;
    return row;
  });
  let best = null;
  for (const r of rows) if (r.score > 0 && (!best || r.yes.length > best.yes.length || (r.yes.length === best.yes.length && r.maybe.length > best.maybe.length))) best = r;
  const answered = new Set(Object.entries(votes).filter(([, l]) => (l || []).some((x) => ANSWERS.includes(x))).map(([w]) => String(w)));
  return { rows, best: best ? best.i : null, missing: memberIds.map(String).filter((id) => !answered.has(id)) };
}

// "Saturday 14 November, 7:00 pm" in the reader's own time zone.
export const dateText = (iso, opts = {}) => new Date(iso).toLocaleString(undefined, { weekday: opts.short ? 'short' : 'long', day: 'numeric', month: opts.short ? 'short' : 'long', hour: 'numeric', minute: '2-digit' });

// "today", "tomorrow", "in 5 days", "3 days ago", by calendar day.
export function untilText(iso, now = new Date()) {
  const day = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const n = Math.round((day(new Date(iso)) - day(now)) / 86400000);
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n > 0 ? `in ${n} days` : `${-n} days ago`;
}
