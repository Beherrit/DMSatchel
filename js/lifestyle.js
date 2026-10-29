// Living costs: when days pass, what each character spends to live, by lifestyle (SRD 5.1 lifestyle expenses, per
// day). Nobody goes below nothing: who can't pay it all pays what they have. Pure, so it can be tested.

export const LIFESTYLES = [['Wretched', 0], ['Squalid', 10], ['Poor', 20], ['Modest', 100], ['Comfortable', 200], ['Wealthy', 400], ['Aristocratic', 1000]];
export const perDay = (name) => LIFESTYLES.find(([n]) => n === name)?.[1] ?? 100;

// chars: [{ id, name, cp }] → { each: [{ id, name, owed, paid, short }], total } for paying from their own coin;
// or, from the treasury (treasuryCp given), { each: [], total, paid, short } with one sum for the whole party.
export function livingCosts(chars, days, lifestyle, treasuryCp = null) {
  const d = Math.max(0, Math.round(Number(days) || 0)), rate = perDay(lifestyle);
  const list = chars || [];
  if (treasuryCp !== null) {
    const total = rate * d * list.length, paid = Math.max(0, Math.min(total, Math.round(treasuryCp)));
    return { each: [], total, paid, short: total - paid };
  }
  const each = list.map((c) => { const owed = rate * d, paid = Math.max(0, Math.min(owed, Math.round(Number(c.cp) || 0))); return { id: c.id, name: c.name, owed, paid, short: owed - paid }; });
  return { each, total: each.reduce((t, x) => t + x.paid, 0) };
}
