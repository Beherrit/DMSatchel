// What happened to my coin?: changes made to a character's sheet from outside it (a split, a hand-out, living
// costs, rations, a purchase, a rest) leave a short line in play.log, newest last, the last 30 kept. Pure, so the
// page and the server share it.

import { inventoryLines } from './handover.js';

export const LOG_MAX = 30;

export const readLog = (play) => (Array.isArray(play?.log) ? play.log.filter((x) => x && x.text) : []);

// Adds a line to play (in place) and returns play. change (from changeOf) is kept with the line when it moved coin
// or items, so "since last session" can add them up.
export function addLog(play, text, by = '', at = new Date().toISOString(), change = null) {
  const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!t) return play;
  const cp = Math.round(Number(change?.cp) || 0), items = (change?.items || []).filter((x) => x.qty).slice(0, 8).map((x) => ({ name: String(x.name).slice(0, 80), qty: x.qty }));
  play.log = [...readLog(play), { at: String(at).slice(0, 40), text: t, ...(by ? { by: String(by).slice(0, 80) } : {}), ...(cp ? { cp } : {}), ...(items.length ? { items } : {}) }].slice(-LOG_MAX);
  return play;
}

// What a change did to a sheet: before and after are { cp, inventory } → { cp: signed copper, items: [{ name, qty }] }
// (qty signed: + came in, − went out), items matched by name whatever their case.
export function changeOf(before = {}, after = {}) {
  const count = (text) => { const m = new Map(); for (const x of inventoryLines(text)) { const k = x.name.toLowerCase(); const c = m.get(k) || { name: x.name, qty: 0 }; c.qty += x.qty; m.set(k, c); } return m; };
  const a = count(before.inventory), b = count(after.inventory), items = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) { const d = (b.get(k)?.qty || 0) - (a.get(k)?.qty || 0); if (d) items.push({ name: (b.get(k) || a.get(k)).name, qty: d }); }
  return { cp: Math.round((Number(after.cp) || 0) - (Number(before.cp) || 0)), items };
}
export const snapshot = (play) => ({ cp: Number(play?.cp) || 0, inventory: String(play?.inventory || '') });

// Since last session, for you: the sheet's history after a time (ISO), with the coin and items it moved added up.
// → { lines (newest first), cp, gained: [{ name, qty }], lost: [{ name, qty }] }
export function logSince(play, since) {
  const lines = readLog(play).filter((x) => !since || String(x.at) > String(since));
  const items = new Map(); let cp = 0;
  for (const x of lines) {
    cp += Math.round(Number(x.cp) || 0);
    for (const i of Array.isArray(x.items) ? x.items : []) { const k = String(i.name).toLowerCase(); const c = items.get(k) || { name: i.name, qty: 0 }; c.qty += Number(i.qty) || 0; items.set(k, c); }
  }
  const all = [...items.values()].filter((x) => x.qty);
  return { lines: lines.slice().reverse(), cp, gained: all.filter((x) => x.qty > 0), lost: all.filter((x) => x.qty < 0).map((x) => ({ name: x.name, qty: -x.qty })) };
}

// You've got news: the lines in a sheet's log that weren't there before (by time and text), newest last.
export function newLines(oldPlay, newPlay) {
  const seen = new Set(readLog(oldPlay).map((x) => `${x.at}|${x.text}`));
  return readLog(newPlay).filter((x) => !seen.has(`${x.at}|${x.text}`));
}

// The play state stored on an entry (fields.play, JSON), or {} when there is none or it won't parse.
export function playJson(e) {
  try { const p = JSON.parse(e?.fields?.play || '{}'); return p && typeof p === 'object' ? p : {}; } catch { return {}; }
}
