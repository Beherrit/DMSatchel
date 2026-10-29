// Between sessions: what the players did since the last session was logged (journals, downtime, suggestions and
// table talk), for the GMs' prep. Pure, so it can be tested.
import { sessionOrder } from './appearances.js';

// → { since, last, journals, downtime, suggested, talk }; since is when the latest session was logged (or two weeks
// ago if there's none).
export function betweenSessions(entries, talk = [], now = Date.now()) {
  const last = sessionOrder(entries || [])[0] || null;
  const since = last?.created_at ? Date.parse(last.created_at) : now - 14 * 86400000;
  const after = (t) => Boolean(t) && Date.parse(t) > since;
  const newest = (a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at));
  return {
    since: new Date(since).toISOString(), last,
    journals: (entries || []).filter((e) => e.kind === 'journal' && after(e.created_at)).sort(newest),
    downtime: (entries || []).filter((e) => e.kind === 'downtime' && (after(e.created_at) || after(e.updated_at))).sort(newest),
    suggested: (entries || []).filter((e) => e.status === 'suggested' && after(e.created_at)).sort(newest),
    talk: (talk || []).filter((c) => after(c.created_at)),
  };
}
