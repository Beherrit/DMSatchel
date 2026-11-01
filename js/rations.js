// Rations run down: on the road, each character eats one day's rations a day from their own inventory (a line such
// as "Rations (1 day) x10" or "8 rations"). Who runs out is reported, not punished. Pure, so it can be tested.
import { inventoryLines } from './handover.js';

const IS_RATION = /\bration/i;

// → { text (the inventory after), had, ate, short }
export function eatRations(inventory, days) {
  const want = Math.max(0, Math.round(Number(days) || 0));
  const lines = String(inventory || '').split('\n');
  const found = inventoryLines(inventory).filter((x) => IS_RATION.test(x.name));
  const had = found.reduce((t, x) => t + x.qty, 0);
  let need = want;
  for (const x of found) {
    if (!need) break;
    const take = Math.min(need, x.qty);
    need -= take;
    lines[x.index] = x.qty - take ? `${x.qty - take} ${x.name}` : null;
  }
  return { text: lines.filter((l) => l !== null).join('\n'), had, ate: want - need, short: need };
}

// Rations from the stash: cover each character's shortfall from the treasury's rations, in order, while they last.
// short: [{ id, name, short }]; stash: the treasury's items [{ item, qty }].
// → { left: Map(id → days still short), used: [{ item, qty, by: [names] }] }
export function feedFromStash(short, stash) {
  const pots = (stash || []).filter((s) => IS_RATION.test(s.item) && s.qty > 0).map((s) => ({ item: s.item, left: s.qty, used: 0, by: new Set() }));
  const left = new Map();
  for (const c of short || []) {
    let need = c.short;
    for (const p of pots) { if (!need) break; const take = Math.min(need, p.left); if (take) { p.left -= take; p.used += take; need -= take; p.by.add(c.name); } }
    left.set(c.id, need);
  }
  return { left, used: pots.filter((p) => p.used).map((p) => ({ item: p.item, qty: p.used, by: [...p.by] })) };
}

// The stash after some of it was eaten (used: from feedFromStash).
export function stashAfter(stash, used) {
  const left = new Map((used || []).map((u) => [u.item, u.qty]));
  return (stash || []).map((s) => ({ ...s, qty: s.qty - (left.get(s.item) || 0) })).filter((s) => s.qty > 0);
}

// Hirelings eat too: each hired NPC eats a day's rations a day from the stash, before the characters' shortfall.
// hires: [{ id, name }] → { fed: feedFromStash's result, short: [{ name, days }] }
export function feedHirelings(hires, days, stash) {
  const fed = feedFromStash((hires || []).map((h) => ({ id: h.id, name: h.name, short: days })), stash);
  return { fed, short: (hires || []).map((h) => ({ name: h.name, days: fed.left.get(h.id) || 0 })).filter((x) => x.days) };
}
