// Copy a place with what's in it: plan the new entries level by level (a place before what's inside it), so each
// copy can be put inside its copied parent once that exists; links between copied entries point at the copies.
// Pure, so it can be tested.

export const NOT_COPIED_KINDS = new Set(['character', 'session', 'journal', 'downtime']);
export const NOT_COPIED_FIELDS = ['play', 'known', 'attitudes', 'attendance', 'goals', 'spread', 'objectives', 'reward_paid', 'gallery'];

// → [[entries at depth 0], [depth 1], …] (the place itself first; kinds that belong to people or play left out)
export function copyLevels(place, entries) {
  const kids = new Map();
  for (const e of entries) if (e.parent_id) (kids.get(e.parent_id) || kids.set(e.parent_id, []).get(e.parent_id)).push(e);
  const levels = [[place]], seen = new Set([place.id]);
  for (;;) {
    const next = levels.at(-1).flatMap((p) => (kids.get(p.id) || []).filter((c) => !seen.has(c.id) && !NOT_COPIED_KINDS.has(c.kind) && c.status !== 'suggested'));
    if (!next.length || levels.length > 20) break;
    next.forEach((c) => seen.add(c.id));
    levels.push(next);
  }
  return levels;
}

// The new entry for one copy, given the ids made so far (old id → new id).
export function copyOf(e, made, { name, hide = false, tag = 'copied' } = {}) {
  const fields = Object.fromEntries(Object.entries(e.fields || {}).filter(([k]) => !NOT_COPIED_FIELDS.includes(k)));
  return {
    kind: e.kind, name: name || e.name, summary: e.summary || '', body: e.body || '', secret: e.secret || '', fields,
    tags: [...new Set([...(e.tags || []), ...(tag ? [tag] : [])])].slice(0, 30),
    parent_id: e.parent_id && made.has(e.parent_id) ? made.get(e.parent_id) : e.parent_id || null,
    links: (e.links || []).map((l) => ({ ...l, id: made.get(l.id) || l.id })),
    visibility: hide ? 'gm' : e.visibility || 'all',
  };
}

// What's coming along, for the dialog: { NPC: 4, Location: 2 } by kind.
export function contentsCount(levels) {
  const out = {};
  for (const e of levels.slice(1).flat()) out[e.kind] = (out[e.kind] || 0) + 1;
  return out;
}
