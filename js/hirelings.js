// Hirelings: NPCs travelling with the party for a daily wage (fields.hired = 'yes', fields.wage as coin text such as
// "2 sp"), paid from the treasury when days pass. SRD 5.1 hireling rates as the presets. Pure, so it can be tested.
import { parseCoins } from './economy.js';

export const WAGES = [['Untrained hireling', 20], ['Skilled hireling', 200]];

export const isHired = (e) => e?.kind === 'npc' && e.fields?.hired === 'yes' && !['Dead', 'Missing'].includes(e.fields?.status);
export const wageOf = (e) => Math.max(0, parseCoins(e?.fields?.wage || '') || 0);

// → { list: [{ entry, wage }], perDay, total (for these days) }
export function payroll(entries, days = 1) {
  const list = (entries || []).filter(isHired).map((entry) => ({ entry, wage: wageOf(entry) })).sort((a, b) => a.entry.name.localeCompare(b.entry.name));
  const perDay = list.reduce((t, x) => t + x.wage, 0);
  return { list, perDay, total: perDay * Math.max(0, Math.round(Number(days) || 0)) };
}

// What's owed to a hireling from wages the treasury couldn't cover (fields.owed, copper as text).
export const owedTo = (e) => Math.max(0, Math.round(Number(e?.fields?.owed) || 0));

// Wages owed: pay each hireling's wages for these days in turn while the coin lasts. list: from payroll(); available:
// the treasury's coin. → { paid: [{ entry, cp }], owed: [{ entry, cp }], total (paid), short (owed in all) }
export function payWages(list, days, available) {
  let left = Math.max(0, Math.round(Number(available) || 0));
  const n = Math.max(0, Math.round(Number(days) || 0)), paid = [], owed = [];
  for (const { entry, wage } of list || []) {
    const due = wage * n, give = Math.min(due, left);
    left -= give;
    if (give) paid.push({ entry, cp: give });
    if (due > give) owed.push({ entry, cp: due - give });
  }
  return { paid, owed, total: paid.reduce((t, x) => t + x.cp, 0), short: owed.reduce((t, x) => t + x.cp, 0) };
}
