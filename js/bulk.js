// Bulk actions on many entries at once (GMs): reveal, hide, tag, untag, or move into a place. Shared by the page and
// the server, so both agree on what a tag looks like and what can't move where.
import { LIMITS } from './world-schema.js';

export const cleanTag = (t) => String(t ?? '').trim().replace(/^#+/, '').trim().toLowerCase().slice(0, LIMITS.tag);

// The place itself and every place above it. Nothing in that chain may move inside the place (it would contain itself).
export function chainUp(parentOf, id, max = 60) {
  const out = new Set();
  for (let at = id, n = 0; at && !out.has(at) && n < max; n++) { out.add(at); at = parentOf(at); }
  return out;
}

// Which of the picked entries can move into the target place (null: out of any place).
export function movable(entries, ids, targetId) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const blocked = targetId ? chainUp((id) => byId.get(id)?.parent_id || null, targetId) : new Set();
  const ok = [], stay = [];
  for (const id of ids) {
    const e = byId.get(id);
    if (!e) continue;
    if (blocked.has(id)) stay.push(id);
    else if ((e.parent_id || null) !== (targetId || null)) ok.push(id);
  }
  return { ok, stay };
}

// The tags among the picked entries, most common first (for "remove a tag").
export function tagsAmong(entries, ids) {
  const pick = new Set(ids), count = new Map();
  for (const e of entries) if (pick.has(e.id)) for (const t of e.tags || []) count.set(t, (count.get(t) || 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t, n]) => ({ tag: t, n }));
}
