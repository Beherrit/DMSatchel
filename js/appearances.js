// Who has appeared in which sessions: a session counts an entry when its log links it ([[Name]], in the text or
// any field) or it's among the session's connections. Pure; the caller says how to read links from text.

export const sessionOrder = (entries) => entries.filter((e) => e.kind === 'session')
  .sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)));

// → Map(id → { count, last: session, ago, first: session }) where ago is how many sessions back the last appearance was
// (0 = latest) and first is the session they first came up in.
export function appearances(entries, idsIn) {
  const out = new Map();
  sessionOrder(entries).forEach((s, ago) => {
    const ids = new Set([...idsIn([s.summary, s.body, ...Object.values(s.fields || {})].join('\n')), ...(s.links || []).map((l) => l.id)]);
    for (const id of ids) {
      const cur = out.get(id);
      if (cur) { cur.count++; cur.first = s; } // newest first, so the last one seen here is the first meeting
      else out.set(id, { count: 1, last: s, ago, first: s });
    }
  });
  return out;
}

// People around a place who could turn up again: seen before, but not in the last `quiet` sessions; key people
// who have never been seen come after them. Longest absent first.
export function dueBack(people, seen, quiet = 2) {
  const back = people.filter((p) => seen.get(p.id)?.ago >= quiet).sort((a, b) => seen.get(b.id).ago - seen.get(a.id).ago || seen.get(b.id).count - seen.get(a.id).count);
  const unseen = people.filter((p) => !seen.has(p.id) && (p.tags || []).includes('key'));
  return [...back, ...unseen];
}

// Last seen: the place a session was set in, as far as its log says: of the places it mentions or links, the one the
// NPC lives in (or inside) first, else the first one. idsIn(text) → ids; byId: id → entry; places: kinds that count.
export function sceneOf(session, idsIn, byId, places, npc = null) {
  if (!session) return null;
  const ids = [...new Set([...idsIn([session.summary, session.body, ...Object.values(session.fields || {})].join('\n')), ...(session.links || []).map((l) => l.id)])];
  const found = ids.map((id) => byId(id)).filter((e) => e && places.includes(e.kind));
  if (!found.length) return null;
  // Their own place first, then the places around it, nearest first.
  for (let p = npc?.parent_id && byId(npc.parent_id), i = 0; p && i < 12; p = p.parent_id && byId(p.parent_id), i++) { const hit = found.find((f) => f.id === p.id); if (hit) return hit; }
  return found[0];
}

// What happened with them: the first line (or sentence) of a session's log that names an entry, as plain text
// ([[links]] shown as their names), trimmed to `max` characters; '' when the log doesn't name them in its text.
export function quoteOf(session, entry, max = 200) {
  const name = String(entry?.name || '').toLowerCase();
  if (!session || !name) return '';
  const plain = (t) => t.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  for (const line of String(session.body || '').split(/\n+/)) {
    for (const bit of line.split(/(?<=[.!?])\s+/)) {
      if (!bit.toLowerCase().includes(name)) continue;
      const t = plain(bit);
      if (t) return t.length > max ? `${t.slice(0, max - 1)}…` : t;
    }
  }
  return '';
}

// Every time they came up: the sessions that name an entry (or connect to it), newest first.
export function sessionsWith(entries, idsIn, id) {
  return sessionOrder(entries).filter((s) => {
    const ids = new Set([...idsIn([s.summary, s.body, ...Object.values(s.fields || {})].join('\n')), ...(s.links || []).map((l) => l.id)]);
    return ids.has(id);
  });
}
