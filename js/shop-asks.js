// Ask the shopkeeper: what players have asked a shop for that it doesn't stock, kept on the shop as fields.asks
// (JSON), so the GMs can stock it. Pure.
import { fmtPrice } from './economy.js';

export const ASKS_MAX = 20;

export function readAsks(json) {
  let list = [];
  try { list = JSON.parse(json || '[]'); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((x) => x && x.item).map((x) => ({ at: String(x.at || ''), by: String(x.by || ''), item: String(x.item).slice(0, 80) }));
}

// The same thing asked again (by anyone) isn't added twice; the newest ask moves to the end.
export function addAsk(json, ask) {
  const item = String(ask.item || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!item) return json || '[]';
  const rest = readAsks(json).filter((x) => x.item.toLowerCase() !== item.toLowerCase());
  return JSON.stringify([...rest, { at: String(ask.at || new Date().toISOString()).slice(0, 40), by: String(ask.by || '').slice(0, 120), item }].slice(-ASKS_MAX));
}

export const dropAsk = (json, item) => JSON.stringify(readAsks(json).filter((x) => x.item.toLowerCase() !== String(item || '').toLowerCase()));

// A line for a shop's shelf: "Grappling hook | 2 gp | 1 in stock".
export const shelfLine = (name, cp, qty = 1) => `${String(name).trim()} | ${fmtPrice(cp / 100)} | ${qty} in stock`;
