// A shop's ledger: the party's recent trade at a shop (who bought or sold what, for how much), kept in the shop's
// fields.trade as JSON, newest last, the last 30. Written by the buy and sell routes and the GMs' "Sell the loot". Pure.
import { coinText } from './economy.js';

export const TRADE_MAX = 30;

export function readTrade(json) {
  let list = [];
  try { list = JSON.parse(json || '[]'); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((x) => x && x.item && ['buy', 'sell'].includes(x.dir))
    .map((x) => ({ at: String(x.at || ''), who: String(x.who || ''), dir: x.dir, item: String(x.item), qty: Math.max(1, Math.round(Number(x.qty) || 1)), cp: Math.max(0, Math.round(Number(x.cp) || 0)) }));
}

// line: { who, dir: 'buy' | 'sell' (from the party's side), item, qty, cp, at } → the new JSON.
export function addTrade(json, line) {
  const at = line.at || new Date().toISOString();
  const next = [...readTrade(json), { at: String(at).slice(0, 40), who: String(line.who || '').slice(0, 120), dir: line.dir === 'sell' ? 'sell' : 'buy', item: String(line.item || '').slice(0, 200), qty: Math.max(1, Math.round(Number(line.qty) || 1)), cp: Math.max(0, Math.round(Number(line.cp) || 0)) }];
  return JSON.stringify(next.slice(-TRADE_MAX));
}

// "Ann bought 2 × Rope for 2 gp", "The party sold Lute for 17 gp 5 sp".
export const tradeText = (x) => `${x.who || 'The party'} ${x.dir === 'sell' ? 'sold' : 'bought'} ${x.qty > 1 ? `${x.qty} × ` : ''}${x.item} for ${coinText(x.cp)}`;

// Totals for the ledger's head: { bought, sold } in copper, from the party's side.
export const tradeTotals = (list) => list.reduce((t, x) => { t[x.dir === 'sell' ? 'sold' : 'bought'] += x.cp; return t; }, { bought: 0, sold: 0 });
