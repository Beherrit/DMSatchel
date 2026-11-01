// "Since your last visit": what other people changed in the world after a given time. Pure, so it can be tested.

const after = (t, since) => Boolean(t) && new Date(t).getTime() > new Date(since).getTime();
const newest = (a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at));

// d: { entries, since, me (name), myCharacterIds, following: [ids], talk: [{ entry_id, entry_name, gm, created_at, body }] }
// → { followed, sessions, handouts, downtime, quests, added, changed, talk, total }; what you follow comes first
// and isn't repeated in the other groups.
export function whatsNew(d) {
  const since = d.since;
  if (!since) return { followed: [], sessions: [], handouts: [], downtime: [], quests: [], added: [], changed: [], talk: [], total: 0 };
  const others = (e, by) => by !== d.me;
  const live = (d.entries || []).filter((e) => (e.status || 'live') === 'live');
  const created = (e) => after(e.created_at, since) && others(e, e.created_by);
  const touched = (e) => after(e.updated_at, since) && others(e, e.updated_by);
  const mine = new Set(d.myCharacterIds || []);
  const follow = new Set(d.following || []);
  const followed = live.filter((e) => follow.has(e.id) && touched(e)).sort(newest);
  const isFollowed = (e) => follow.has(e.id);
  const sessions = live.filter((e) => !isFollowed(e) && e.kind === 'session' && (created(e) || touched(e))).sort(newest);
  const handouts = live.filter((e) => !isFollowed(e) && e.kind === 'handout' && touched(e)).sort(newest);
  const downtime = live.filter((e) => e.kind === 'downtime' && after(e.fields?.resolved, since) && (mine.has(e.fields?.character) || !mine.size)).sort(newest);
  const quests = live.filter((e) => !isFollowed(e) && e.kind === 'quest' && touched(e)).sort(newest);
  const shown = new Set([...followed, ...sessions, ...handouts, ...downtime, ...quests].map((e) => e.id));
  const rest = live.filter((e) => !shown.has(e.id) && !['downtime', 'journal'].includes(e.kind));
  const added = rest.filter(created).sort(newest);
  const changed = rest.filter((e) => !created(e) && touched(e)).sort(newest);
  const talk = (d.talk || []).filter((c) => after(c.created_at, since) && c.gm !== d.me).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const total = followed.length + sessions.length + handouts.length + downtime.length + quests.length + added.length + changed.length + talk.length;
  return { followed, sessions, handouts, downtime, quests, added, changed, talk, total };
}

// The time to compare against for a freshly loaded world: the server's mark for members, else the browser's own.
export function visitSince(info) {
  if (info && 'prev_visit' in info) return info.prev_visit || null;
  try { return localVisit(localStorage, `satchel-visit-${info?.id || 'world'}`); } catch { return null; }
}

// Browser-side visit marks for people the server doesn't track (the site admin): same three-hour sitting rule.
export function localVisit(store, key, now = Date.now()) {
  let v = {};
  try { v = JSON.parse(store.getItem(key) || '{}') || {}; } catch { v = {}; }
  const seen = Number(v.seen) || 0;
  const prev = !seen ? null : now - seen > 3 * 3600000 ? seen : Number(v.prev) || null;
  try { store.setItem(key, JSON.stringify({ seen: now, prev })); } catch { /* private window */ }
  return prev ? new Date(prev).toISOString() : null;
}

// Since your last visit, on the road: the places the party arrived at after `since` (journey stops, oldest first).
export const roadSince = (stops, since) => (Array.isArray(stops) ? stops : []).filter((s) => s?.id && (!since || String(s.at) > String(since))).map((s) => s.id);

// Days passed in the world since your last visit: this browser remembers the in-world day it last saw in your previous
// sitting. since: your last visit's mark (changes when a new sitting starts); today: today's day number.
// → days passed, or null when it can't tell yet (first visit on this browser, or no calendar).
export function worldDaysSince(store, key, today, since) {
  if (!Number.isFinite(today)) return null;
  let v = {};
  try { v = JSON.parse(store.getItem(key) || '{}') || {}; } catch { v = {}; }
  const fresh = v.since !== (since || null);
  const prevDay = fresh ? (Number.isFinite(v.day) ? v.day : null) : (Number.isFinite(v.prevDay) ? v.prevDay : null);
  try { store.setItem(key, JSON.stringify({ since: since || null, prevDay, day: today })); } catch { /* private window */ }
  return prevDay === null ? null : Math.max(0, today - prevDay);
}
