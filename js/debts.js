// Debts between friends: one character lends another coin, and both sheets keep the balance between them in
// play.debts ({ other character's id: { name, cp, note, at } }; cp > 0: they owe this character, < 0: this character
// owes them). Paying back reduces it; at zero it's gone. Pure, so the page and the server share it.

const MAX = 40;

export function readDebts(play) {
  const d = play?.debts && typeof play.debts === 'object' && !Array.isArray(play.debts) ? play.debts : {};
  return Object.entries(d).map(([id, x]) => ({ id, name: String(x?.name || 'Someone'), cp: Math.round(Number(x?.cp) || 0), note: String(x?.note || ''), at: String(x?.at || '') }))
    .filter((x) => x.cp).sort((a, b) => b.cp - a.cp || a.name.localeCompare(b.name));
}

// Moves the balance with another character by cp (+: they owe more, −: they owe less / this character owes more), in
// place; returns play. A note replaces the old one when given; the balance at zero removes the line.
export function shiftDebt(play, other, cp, note = '', at = new Date().toISOString()) {
  const d = { ...(play.debts && typeof play.debts === 'object' && !Array.isArray(play.debts) ? play.debts : {}) };
  const cur = d[other.id] || { name: other.name, cp: 0, note: '' };
  const next = Math.round((Number(cur.cp) || 0) + (Number(cp) || 0));
  if (!next) delete d[other.id];
  else d[other.id] = { name: String(other.name || cur.name).slice(0, 120), cp: next, note: String(note || cur.note || '').slice(0, 200), at: String(at).slice(0, 40) };
  // Keep the list bounded: the smallest balances go first.
  const keys = Object.keys(d);
  if (keys.length > MAX) for (const k of keys.sort((a, b) => Math.abs(d[a].cp) - Math.abs(d[b].cp)).slice(0, keys.length - MAX)) delete d[k];
  play.debts = d;
  return play;
}

// What this character is owed by, or owes, another (cp > 0: owed to them).
export const balanceWith = (play, id) => readDebts(play).find((x) => x.id === id)?.cp || 0;

// Debts at a glance: who owes whom across the party, read from each lender's sheet (so each debt counts once).
// chars: [{ id, name, play }] → [{ from (who owes), fromId, to (who's owed), toId, cp, note }], the biggest first.
export function partyDebts(chars) {
  const out = [];
  for (const c of chars || []) for (const d of readDebts(c.play)) if (d.cp > 0) out.push({ from: d.name, fromId: d.id, to: c.name, toId: c.id, cp: d.cp, note: d.note });
  return out.sort((a, b) => b.cp - a.cp || a.from.localeCompare(b.from));
}
