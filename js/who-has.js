// Who has it?: one search across every character's inventory and the party treasury's items, matching each word
// at the start of a word ("rope" finds "Silk rope" and "Ropemaker's tools", "sword" not "Longsword"). Pure, so it
// can be tested.
import { inventoryLines } from './handover.js';
import { carried } from './weights.js';

const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9’']+/).filter(Boolean);

// chars: [{ id, name, inventory }]; stash: [{ item, qty, holder }] from the treasury.
// → [{ item, qty, who, id (character id, or null for the treasury) }], characters first, then the treasury.
export function whoHas(q, chars, stash) {
  const want = words(q);
  if (!want.length) return [];
  const hit = (name) => { const ws = words(name); return want.every((w) => ws.some((x) => x.startsWith(w))); };
  const out = [];
  for (const c of chars || []) for (const x of inventoryLines(c.inventory)) if (hit(x.name)) out.push({ item: x.name, qty: x.qty, who: c.name, id: c.id });
  for (const s of stash || []) if (s.qty > 0 && hit(s.item)) out.push({ item: s.item, qty: s.qty, who: s.holder ? `the treasury (${s.holder} carries it)` : 'the treasury', id: null });
  return out;
}

// Everything the party carries: every character's gear and the treasury's, merged by name (whatever the case), with
// who has how many. chars: [{ id, name, inventory }]; stash as above. → [{ item, total, holders: [{ who, qty, id }] }]
// in name order.
export function everything(chars, stash) {
  const all = new Map();
  const add = (item, qty, who, id) => {
    const k = item.toLowerCase().trim(); if (!k || !(qty > 0)) return;
    const cur = all.get(k) || { item: item.trim(), total: 0, holders: [] };
    cur.total += qty;
    const h = cur.holders.find((x) => x.who === who); if (h) h.qty += qty; else cur.holders.push({ who, qty, id });
    all.set(k, cur);
  };
  for (const c of chars || []) for (const x of carried(c.inventory).items) add(x.name, x.qty, c.name, c.id);
  for (const s of stash || []) add(s.item, s.qty, s.holder ? `the treasury (with ${s.holder})` : 'the treasury', null);
  return [...all.values()].sort((a, b) => a.item.localeCompare(b.item));
}
