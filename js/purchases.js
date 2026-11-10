// What the party bought: the purchases in the characters' sheet logs (play.log), from shops, market stalls and
// taverns ("Bought …", "Ordered …", "Put … on the party’s tab"). Pure, so it can be tested.
import { readLog } from './play-log.js';

const BUY = /^(Bought|Ordered|Put .+ on the party’s tab)\b/;
const playOf = (c) => { try { return JSON.parse(c?.fields?.play || '{}') || {}; } catch { return {}; } };

// → [{ who (the character entry), at, text, cp (what it cost, positive), items: [{ name, qty }] }], newest first.
export function purchases(characters) {
  const out = [];
  for (const c of characters || []) for (const l of readLog(playOf(c))) if (BUY.test(l.text)) out.push({ who: c, at: l.at, text: l.text, cp: Math.max(0, -(Number(l.cp) || 0)), items: (l.items || []).filter((x) => x.qty > 0) });
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// Coin spent: by character, what their logged purchases came to. → [{ who, cp, count }], biggest spender first.
export function spending(characters) {
  const by = new Map();
  for (const p of purchases(characters)) { const x = by.get(p.who.id) || { who: p.who, cp: 0, count: 0 }; x.cp += p.cp; x.count += 1; by.set(p.who.id, x); }
  return [...by.values()].sort((a, b) => b.cp - a.cp || a.who.name.localeCompare(b.who.name));
}

// Most-bought goods: what the party's purchases brought in, by how many times bought. → [{ name, qty, times }].
export function topGoods(characters) {
  const by = new Map();
  for (const p of purchases(characters)) for (const it of p.items) { const k = it.name.toLowerCase(), x = by.get(k) || { name: it.name, qty: 0, times: 0 }; x.qty += it.qty; x.times += 1; if (/^[a-z]/.test(x.name) && /^[A-Z]/.test(it.name)) x.name = it.name; by.set(k, x); }
  return [...by.values()].sort((a, b) => b.times - a.times || b.qty - a.qty || a.name.localeCompare(b.name));
}

// A place's customers: the characters whose logged purchases were at this place (a shop, stall or tavern by name),
// → [{ who, count, cp }], most purchases first.
export function customersAt(characters, placeName) {
  const name = String(placeName || '').trim();
  if (!name) return [];
  const re = new RegExp(` at ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?= for | \\(|$)`);
  const by = new Map();
  for (const p of purchases(characters)) if (re.test(p.text)) { const x = by.get(p.who.id) || { who: p.who, count: 0, cp: 0 }; x.count += 1; x.cp += p.cp; by.set(p.who.id, x); }
  return [...by.values()].sort((a, b) => b.count - a.count || b.cp - a.cp || a.who.name.localeCompare(b.who.name));
}
