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
