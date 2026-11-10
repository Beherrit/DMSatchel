// What the party bought: the purchases in the characters' sheet logs (play.log), from shops, market stalls and
// taverns ("Bought …", "Ordered …", "Put … on the party’s tab"). Pure, so it can be tested.
import { readLog } from './play-log.js';

const BUY = /^(Bought|Ordered|Put .+ on the party’s tab)\b/;
const playOf = (c) => { try { return JSON.parse(c?.fields?.play || '{}') || {}; } catch { return {}; } };

// → [{ who (the character entry), at, text, cp (what it cost, positive) }], newest first.
export function purchases(characters) {
  const out = [];
  for (const c of characters || []) for (const l of readLog(playOf(c))) if (BUY.test(l.text)) out.push({ who: c, at: l.at, text: l.text, cp: Math.max(0, -(Number(l.cp) || 0)) });
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// Coin spent: by character, what their logged purchases came to. → [{ who, cp, count }], biggest spender first.
export function spending(characters) {
  const by = new Map();
  for (const p of purchases(characters)) { const x = by.get(p.who.id) || { who: p.who, cp: 0, count: 0 }; x.cp += p.cp; x.count += 1; by.set(p.who.id, x); }
  return [...by.values()].sort((a, b) => b.cp - a.cp || a.who.name.localeCompare(b.who.name));
}
