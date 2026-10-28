// Who has appeared in which sessions: a session counts an entry when its log links it ([[Name]], in the text or
// any field) or it's among the session's connections. Pure; the caller says how to read links from text.

export const sessionOrder = (entries) => entries.filter((e) => e.kind === 'session')
  .sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)));

// → Map(id → { count, last: session, ago }) where ago is how many sessions back the last appearance was (0 = latest).
export function appearances(entries, idsIn) {
  const out = new Map();
  sessionOrder(entries).forEach((s, ago) => {
    const ids = new Set([...idsIn([s.summary, s.body, ...Object.values(s.fields || {})].join('\n')), ...(s.links || []).map((l) => l.id)]);
    for (const id of ids) {
      const cur = out.get(id);
      if (cur) cur.count++;
      else out.set(id, { count: 1, last: s, ago });
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
