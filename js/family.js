// Family trees from entry connections: "parent of", "child of", "married to" and "sibling of".
// Pure functions over a list of entries, so they can be tested without the page.

const PEOPLE = ['npc', 'character', 'deity'];
export const FAMILY_LABELS = ['parent of', 'child of', 'married to', 'sibling of'];

// Every family relation as {parent, child} pairs and symmetric spouse/sibling pairs.
export function relations(entries) {
  const ids = new Set(entries.filter((e) => PEOPLE.includes(e.kind)).map((e) => e.id));
  const parents = [], spouses = [], siblings = [];
  const seen = new Set();
  const add = (list, a, b, sym) => { const k = sym ? [a, b].sort().join('|') : `${a}>${b}`; if (a !== b && ids.has(a) && ids.has(b) && !seen.has(`${list.name}${k}`)) { seen.add(`${list.name}${k}`); list.push([a, b]); } };
  parents.name = 'p'; spouses.name = 's'; siblings.name = 'b';
  for (const e of entries) for (const l of e.links || []) {
    const label = String(l.label || '').toLowerCase();
    if (label === 'parent of') add(parents, e.id, l.id);
    else if (label === 'child of') add(parents, l.id, e.id);
    else if (label === 'married to') add(spouses, e.id, l.id, true);
    else if (label === 'sibling of') add(siblings, e.id, l.id, true);
  }
  return { parents, spouses, siblings };
}

// Everyone related to `id` by blood or marriage (the whole connected family).
export function familyOf(id, entries) {
  const { parents, spouses, siblings } = relations(entries);
  const adj = new Map();
  const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); if (!adj.has(b)) adj.set(b, new Set()); adj.get(a).add(b); adj.get(b).add(a); };
  for (const [a, b] of [...parents, ...spouses, ...siblings]) link(a, b);
  const out = new Set([id]); const queue = [id];
  while (queue.length) for (const n of adj.get(queue.shift()) || []) if (!out.has(n)) { out.add(n); queue.push(n); }
  return out;
}

// Direct relatives of one person, for the list on their page.
export function relativesOf(id, entries) {
  const { parents, spouses, siblings } = relations(entries);
  const par = parents.filter(([, c]) => c === id).map(([p]) => p);
  const kids = parents.filter(([p]) => p === id).map(([, c]) => c);
  const sib = new Set(siblings.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a)));
  for (const p of par) for (const [pp, c] of parents) if (pp === p && c !== id) sib.add(c);
  return { parents: par, children: kids, spouses: spouses.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a)), siblings: [...sib] };
}

// Layout: one row per generation, spouses side by side, children ordered under their parents.
export function layout(ids, entries) {
  const set = new Set(ids);
  const rel = relations(entries);
  const parents = rel.parents.filter(([a, b]) => set.has(a) && set.has(b));
  const spouses = rel.spouses.filter(([a, b]) => set.has(a) && set.has(b));
  const siblings = rel.siblings.filter(([a, b]) => set.has(a) && set.has(b));
  const gen = new Map([...set].map((id) => [id, 0]));
  for (let i = 0; i < set.size + 2; i++) {
    let changed = false;
    for (const [p, c] of parents) if (gen.get(c) < gen.get(p) + 1) { gen.set(c, gen.get(p) + 1); changed = true; }
    for (const [a, b] of [...spouses, ...siblings]) { const m = Math.max(gen.get(a), gen.get(b)); if (gen.get(a) !== m || gen.get(b) !== m) { gen.set(a, m); gen.set(b, m); changed = true; } }
    if (!changed) break;
  }
  const min = Math.min(...gen.values());
  const rows = [];
  for (const [id, g] of gen) (rows[g - min] = rows[g - min] || []).push(id);
  const pos = new Map();
  const name = (id) => entries.find((e) => e.id === id)?.name || '';
  rows.forEach((row, r) => {
    // Order by the average position of each person's parents, then keep spouses next to each other.
    const key = (id) => { const ps = parents.filter(([, c]) => c === id).map(([p]) => pos.get(p)?.x).filter((x) => x != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : Infinity; };
    row.sort((a, b) => key(a) - key(b) || name(a).localeCompare(name(b)));
    const ordered = [];
    for (const id of row) {
      if (ordered.includes(id)) continue;
      ordered.push(id);
      for (const [a, b] of spouses) { const o = a === id ? b : b === id ? a : null; if (o && row.includes(o) && !ordered.includes(o)) ordered.push(o); }
    }
    ordered.forEach((id, i) => pos.set(id, { x: i, y: r }));
    rows[r] = ordered;
  });
  return { rows, pos, parents, spouses };
}
