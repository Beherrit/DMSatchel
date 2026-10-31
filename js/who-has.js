// Who has it?: one search across every character's inventory and the party treasury's items, matching each word
// at the start of a word ("rope" finds "Silk rope" and "Ropemaker's tools", "sword" not "Longsword"). Pure, so it
// can be tested.
import { inventoryLines } from './handover.js';

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
