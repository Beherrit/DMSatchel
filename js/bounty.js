// Bounties pay out: when a GM marks an NPC with a bounty dead or captured, the bounty can go into the party treasury.
// Pure: what's due, read from the NPC's "Bounty on their head" text ("500 gp", "1,000 gp, alive", "50 gp 5 sp").
import { parseCoins } from './economy.js';

export const CLAIMED = ['Dead', 'Captured'];

// The coin in a bounty's text, in copper (0 when there's none to read).
export function bountyCp(text) {
  const m = /(\d[\d,]*(?:\.\d+)?)\s*(pp|gp|ep|sp|cp|gold|silver|copper|platinum)?\b(?:\s+(\d+)\s*(sp|cp))?/i.exec(String(text || ''));
  if (!m) return 0;
  const unit = { gold: 'gp', silver: 'sp', copper: 'cp', platinum: 'pp' }[String(m[2] || '').toLowerCase()] || m[2] || 'gp';
  return parseCoins(`${m[1].replace(/,/g, '')} ${unit}${m[3] ? ` ${m[3]} ${m[4]}` : ''}`);
}

// before/after: the NPC before and after a save → { cp, by, text } when its bounty has just come due, else null.
export function bountyDue(before, after) {
  if (!after || after.kind !== 'npc' || after.fields?.bounty_paid) return null;
  if (!CLAIMED.includes(after.fields?.status) || CLAIMED.includes(before?.fields?.status)) return null;
  const cp = bountyCp(after.fields?.bounty);
  return cp ? { cp, by: String(after.fields?.bounty_by || '').trim(), text: String(after.fields.bounty).trim() } : null;
}

// Bounties on the party page: open bounties (not yet claimed or paid) → [{ entry, text, by, cp }], the richest first.
export function openBounties(entries) {
  return (entries || []).filter((e) => e.kind === 'npc' && String(e.fields?.bounty || '').trim() && !CLAIMED.includes(e.fields?.status) && !e.fields?.bounty_paid && e.fields?.status !== 'Dead')
    .map((e) => ({ entry: e, text: String(e.fields.bounty).trim(), by: String(e.fields?.bounty_by || '').trim(), cp: bountyCp(e.fields.bounty) }))
    .sort((a, b) => b.cp - a.cp || a.entry.name.localeCompare(b.entry.name));
}
