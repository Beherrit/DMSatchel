// A shopping list: what a character means to buy (kept in their sheet's play state, play.shopping), matched against
// a shop's stock so the buy panel can offer it first. Pure, so it can be tested.

import { stockItems } from './purchase.js';

export const MAX_SHOPPING = 20;
const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9’']+/).filter(Boolean);

export const readList = (play) => (Array.isArray(play?.shopping) ? play.shopping.map((x) => String(x).slice(0, 80)).filter(Boolean) : []);

export function addToList(list, text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!t || list.some((x) => x.toLowerCase() === t.toLowerCase())) return list;
  return [...list, t].slice(0, MAX_SHOPPING);
}
export const removeFromList = (list, i) => list.filter((_, n) => n !== i);

// Does a stocked item answer a line on the list? Every word on the line starts a word of the item's name
// ("rope" finds "Hempen rope", "healing potion" finds "Potion of healing").
// Bare numbers on the line ("Rations × 3") are how many, not part of the name.
export const answers = (line, itemName) => { const want = words(line).filter((w) => !/^\d+$/.test(w)), have = words(itemName); return want.length > 0 && want.every((w) => have.some((h) => h.startsWith(w))); };

// The stock's items with the ones on the list first, each marked: items [{ name, … }] → [{ …item, wanted }]
export function listFirst(items, list) {
  const marked = (items || []).map((it) => ({ ...it, wanted: list.some((l) => answers(l, it.name)) }));
  return [...marked.filter((x) => x.wanted), ...marked.filter((x) => !x.wanted)];
}

// A packing list: put "Rations × n" on the list for a trip, in place of any rations line already there.
export function withRations(list, n) {
  const rest = (list || []).filter((l) => !answers(l, 'Rations (1 day)'));
  return n > 0 ? addToList(rest, `Rations × ${n}`) : rest;
}

// Open now?: the shops that stock something answering a line on the list, cheapest first.
// shops: [{ id, name, stock, … }] → [{ shop, item, cp }]
export function shopsFor(line, shops) {
  const out = [];
  for (const s of shops || []) {
    const hits = stockItems(s.stock).filter((it) => answers(line, it.name)).sort((a, b) => a.cp - b.cp);
    if (hits.length) out.push({ shop: s, item: hits[0].name, cp: hits[0].cp });
  }
  return out.sort((a, b) => a.cp - b.cp || a.shop.name.localeCompare(b.shop.name));
}

// A shopping trip: for everyone's lists ([{ who, lines }]) and the shops in reach ([{ id, name, stock, … }]), each
// shop that stocks something wanted, with what and for whom (the cheapest match per line per shop), most wanted first.
// Lines nobody stocks come back as `missing`. → { stops: [{ shop, wants: [{ who, line, item, cp }] }], missing }
export function tripPlan(lists, shops) {
  const stops = new Map(), missing = [];
  for (const { who, lines } of lists || []) for (const line of lines || []) {
    const found = shopsFor(line, shops);
    if (!found.length) { missing.push({ who, line }); continue; }
    for (const f of found) {
      if (!stops.has(f.shop.id)) stops.set(f.shop.id, { shop: f.shop, wants: [] });
      stops.get(f.shop.id).wants.push({ who, line, item: f.item, cp: f.cp });
    }
  }
  return { stops: [...stops.values()].sort((a, b) => b.wants.length - a.wants.length || a.shop.name.localeCompare(b.shop.name)), missing };
}
