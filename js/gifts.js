// Gifts for NPCs: what the party has given an NPC (items, coin, a bribe), kept on the NPC as fields.gifts (JSON),
// newest last, the last 30. Pure.
import { coinText } from './economy.js';

export const GIFTS_MAX = 30;

export function readGifts(json) {
  let list = [];
  try { list = JSON.parse(json || '[]'); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((x) => x && (x.item || x.cp)).map((x) => ({ at: String(x.at || ''), by: String(x.by || ''), item: String(x.item || ''), qty: Math.max(1, Math.round(Number(x.qty) || 1)), cp: Math.max(0, Math.round(Number(x.cp) || 0)), note: String(x.note || '') }));
}

export function addGift(json, g) {
  const line = { at: String(g.at || new Date().toISOString()).slice(0, 40), by: String(g.by || '').slice(0, 120), item: String(g.item || '').slice(0, 200), qty: Math.max(1, Math.round(Number(g.qty) || 1)), cp: Math.max(0, Math.round(Number(g.cp) || 0)), note: String(g.note || '').replace(/\s+/g, ' ').trim().slice(0, 200) };
  return JSON.stringify([...readGifts(json), line].slice(-GIFTS_MAX));
}

// "2 × Potion of healing and 5 gp"
export const giftWhat = (g) => [g.item ? `${g.qty > 1 ? `${g.qty} × ` : ''}${g.item}` : '', g.cp ? coinText(g.cp) : ''].filter(Boolean).join(' and ');
