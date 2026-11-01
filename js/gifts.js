// Gifts for NPCs: what the party has given an NPC (items, coin, a bribe), kept on the NPC as fields.gifts (JSON),
// newest last, the last 30. Pure.
import { coinText } from './economy.js';

export const GIFTS_MAX = 30;

export function readGifts(json) {
  let list = [];
  try { list = JSON.parse(json || '[]'); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((x) => x && (x.item || x.cp)).map((x) => ({ at: String(x.at || ''), by: String(x.by || ''), item: String(x.item || ''), qty: Math.max(1, Math.round(Number(x.qty) || 1)), cp: Math.max(0, Math.round(Number(x.cp) || 0)), note: String(x.note || ''), ...(x.wanted ? { wanted: true } : {}) }));
}

export function addGift(json, g) {
  const line = { at: String(g.at || new Date().toISOString()).slice(0, 40), by: String(g.by || '').slice(0, 120), item: String(g.item || '').slice(0, 200), qty: Math.max(1, Math.round(Number(g.qty) || 1)), cp: Math.max(0, Math.round(Number(g.cp) || 0)), note: String(g.note || '').replace(/\s+/g, ' ').trim().slice(0, 200), ...(g.wanted ? { wanted: true } : {}) };
  return JSON.stringify([...readGifts(json), line].slice(-GIFTS_MAX));
}

// "2 × Potion of healing and 5 gp"
export const giftWhat = (g) => [g.item ? `${g.qty > 1 ? `${g.qty} × ` : ''}${g.item}` : '', g.cp ? coinText(g.cp) : ''].filter(Boolean).join(' and ');

// A gift they wanted: does an item (or coin) answer something in the NPC's Wants text? Words of three letters or more
// in the item's name, singular or plural, found in what they want; coin answers "money", "gold", "coin"…
const STOP = new Set(['the', 'and', 'for', 'old', 'new', 'one', 'two', 'her', 'his', 'its', 'our', 'with', 'from', 'that', 'this', 'their', 'there', 'some', 'very', 'into', 'than', 'they']);
export function wantsMatch(wants, item, cp = 0) {
  const w = String(wants || '').toLowerCase();
  if (!w.trim()) return false;
  if (cp > 0 && /\b(money|gold|coins?|silver|riches|wealth|pay(ment)?|debts?)\b/.test(w)) return true;
  const words = String(item || '').toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z']+/).filter((x) => x.length >= 3 && !STOP.has(x));
  return words.some((x) => { const stem = x.replace(/(es|s)$/, ''); return new RegExp(`\\b${stem}(s|es)?\\b`).test(w); });
}

// Who's been given what: the gifts one character has given, across the NPCs (as the viewer sees them), newest first.
// npcs: [{ entry, gifts json }] → [{ npc (entry), …gift }]
export function givenBy(name, npcs) {
  const key = String(name || '').trim().toLowerCase(), out = [];
  for (const n of npcs || []) for (const g of readGifts(n.gifts)) if (g.by.trim().toLowerCase() === key) out.push({ npc: n.entry, ...g });
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
