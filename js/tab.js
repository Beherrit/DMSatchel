// A tab at the tavern: orders put on the party's tab (fields.tab on the tavern, JSON), settled later by a GM from the
// treasury. Pure.
import { coinText } from './economy.js';

export function readTab(json) {
  let list = [];
  try { list = JSON.parse(json || '[]'); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((x) => x && x.item).map((x) => ({ at: String(x.at || ''), who: String(x.who || ''), item: String(x.item), qty: Math.max(1, Math.round(Number(x.qty) || 1)), cp: Math.max(0, Math.round(Number(x.cp) || 0)) }));
}
export function addTab(json, line) {
  const next = [...readTab(json), { at: String(line.at || new Date().toISOString()).slice(0, 40), who: String(line.who || '').slice(0, 120), item: String(line.item || '').slice(0, 200), qty: Math.max(1, Math.round(Number(line.qty) || 1)), cp: Math.max(0, Math.round(Number(line.cp) || 0)) }];
  return JSON.stringify(next.slice(-60));
}
export const tabTotal = (list) => (list || []).reduce((t, x) => t + x.cp, 0);
// "Ann: 2 × Pale ale (8 cp)"
export const tabLine = (x) => `${x.who}: ${x.qty > 1 ? `${x.qty} × ` : ''}${x.item} (${coinText(x.cp)})`;

// Pay your own tab: one character's orders on the tab, and the rest. → { mine, rest }
export function splitTab(list, who) {
  const k = String(who || '').trim().toLowerCase();
  return { mine: (list || []).filter((x) => x.who.trim().toLowerCase() === k), rest: (list || []).filter((x) => x.who.trim().toLowerCase() !== k) };
}
