// Who holds what: which faction, guild or house controls each place, for tinting map pins. A place's own say comes
// first (a connection like "controlled by" / "ruled by" / "held by" / "owned by" / "claimed by" to a power, or its
// Ruled by / Controlled by / Led by / Owner field naming one); otherwise it's held by whoever holds the place
// around it. Pure, so it can be tested.

export const POWERS = ['faction', 'guild', 'clan'];
const FIELDS = ['controlled_by', 'ruler', 'owner'];
const HOLD = /\b(controlled|ruled|held|owned|claimed|governed|run)\s+by\b/i;
const norm = (s) => String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ').trim();

// → Map(placeId → { by: power entry, inherited: boolean })
export function controllers(entries) {
  const list = entries || [];
  const byId = new Map(list.map((e) => [e.id, e]));
  const powers = list.filter((e) => POWERS.includes(e.kind));
  const byName = new Map(powers.map((p) => [norm(p.name), p]));
  const own = (e) => {
    for (const l of e.links || []) { const t = byId.get(l.id); if (t && POWERS.includes(t.kind) && HOLD.test(l.label || '')) return t; }
    for (const f of FIELDS) { const p = byName.get(norm(e.fields?.[f])); if (p) return p; }
    return null;
  };
  const out = new Map();
  const resolve = (e, seen = new Set()) => {
    if (out.has(e.id)) return out.get(e.id);
    if (seen.has(e.id)) return null;
    seen.add(e.id);
    const mine = own(e);
    let r = mine ? { by: mine, inherited: false } : null;
    if (!r) { const p = byId.get(e.parent_id); const up = p ? resolve(p, seen) : null; if (up) r = { by: up.by, inherited: true }; }
    out.set(e.id, r);
    return r;
  };
  for (const e of list) resolve(e);
  for (const [k, v] of out) if (!v) out.delete(k);
  return out;
}

// Each power's colour slot (0–7), by its place among the world's powers sorted by name, so a power keeps its colour
// whatever is on screen; the ninth and later share "other" (-1).
export function powerSlots(entries) {
  const powers = (entries || []).filter((e) => POWERS.includes(e.kind)).sort((a, b) => a.name.localeCompare(b.name) || String(a.id).localeCompare(String(b.id)));
  return new Map(powers.map((p, i) => [p.id, i < 8 ? i : -1]));
}
