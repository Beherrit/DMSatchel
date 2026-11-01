// Living costs: when days pass, what each character spends to live, by lifestyle (SRD 5.1 lifestyle expenses, per
// day). Nobody goes below nothing: who can't pay it all pays what they have. Pure, so it can be tested.

export const LIFESTYLES = [['Wretched', 0], ['Squalid', 10], ['Poor', 20], ['Modest', 100], ['Comfortable', 200], ['Wealthy', 400], ['Aristocratic', 1000]];
export const perDay = (name) => LIFESTYLES.find(([n]) => n === name)?.[1] ?? 100;

// chars: [{ id, name, cp, lifestyle? }] (a character's own lifestyle, if they've chosen one, beats the party's)
// → { each: [{ id, name, lifestyle, owed, paid, short }], total } for paying from their own coin;
// or, from the treasury (treasuryCp given), { each, total, paid, short } with one sum for the whole party.
export function livingCosts(chars, days, lifestyle, treasuryCp = null) {
  const d = Math.max(0, Math.round(Number(days) || 0));
  const list = (chars || []).map((c) => { const ls = LIFESTYLES.some(([n]) => n === c.lifestyle) ? c.lifestyle : lifestyle; return { ...c, ls, owed: perDay(ls) * d }; });
  if (treasuryCp !== null) {
    const total = list.reduce((t, c) => t + c.owed, 0), paid = Math.max(0, Math.min(total, Math.round(treasuryCp)));
    return { each: list.map((c) => ({ id: c.id, name: c.name, lifestyle: c.ls, owed: c.owed })), total, paid, short: total - paid };
  }
  const each = list.map((c) => { const paid = Math.max(0, Math.min(c.owed, Math.round(Number(c.cp) || 0))); return { id: c.id, name: c.name, lifestyle: c.ls, owed: c.owed, paid, short: c.owed - paid }; });
  return { each, total: each.reduce((t, x) => t + x.paid, 0) };
}
