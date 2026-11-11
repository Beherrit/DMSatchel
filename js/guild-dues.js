// Guild dues: what a guild's "Dues & benefits" text asks of its members each in-world month ("5 gp a month",
// "2 sp per tenday", "50 gp a year"), and whether a member has paid this month (a "Paid … dues to <guild> for <month>"
// line in their sheet's log). Pure.
import { parseCoins } from './economy.js';

// → { cp, per: 'month' | 'week' | 'year', monthly (cp a month, rounded) } or null when it names no amount and period.
export function parseDues(text) {
  const t = String(text || '').toLowerCase();
  const m = /(\d[\d,.]*\s*(?:pp|gp|ep|sp|cp))\s*(?:a|an|per|each|every|\/)?\s*(month|moon|tenday|week|year)|(\d[\d,.]*\s*(?:pp|gp|ep|sp|cp))\s+(monthly|weekly|yearly|annually)/.exec(t);
  if (!m) return null;
  const amount = parseCoins(m[1] || m[3]), word = m[2] || m[4];
  if (!(amount > 0)) return null;
  const per = /month|moon/.test(word) ? 'month' : /week|tenday/.test(word) ? 'week' : 'year';
  const monthly = Math.round(per === 'month' ? amount : per === 'week' ? amount * 4 : amount / 12);
  return { cp: amount, per, monthly };
}

// The log line for paying a month's dues, and whether a log already has it.
export const duesLine = (guildName, monthLabel, cpText) => `Paid ${cpText} dues to ${guildName} for ${monthLabel}`;
export const paidDues = (log, guildName, monthLabel) => (Array.isArray(log) ? log : []).some((l) => typeof l?.text === 'string' && l.text.startsWith('Paid ') && l.text.endsWith(` dues to ${guildName} for ${monthLabel}`));
