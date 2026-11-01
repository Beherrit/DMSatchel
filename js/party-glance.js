// The party at a glance (GMs): one row per character from their play state: hit points, coin, days of rations,
// exhaustion and conditions, with hit points flagged when low. Pure, so it can be tested.
import { inventoryLines } from './handover.js';

export const rationsIn = (inventory) => inventoryLines(inventory).filter((x) => /\bration/i.test(x.name)).reduce((t, x) => t + x.qty, 0);

// chars: [{ id, name, play }] → [{ id, name, hp, max, low, down, cp, rations, exhaustion, conditions }]
export function partyRows(chars) {
  return (chars || []).map(({ id, name, play = {} }) => {
    const hp = Math.max(0, Number(play.hp) || 0), max = Math.max(0, Number(play.maxhp) || 0);
    return {
      id, name, hp, max, down: max > 0 && hp === 0, low: max > 0 && hp > 0 && hp <= max / 4,
      cp: Math.max(0, Math.round(Number(play.cp) || 0)), rations: rationsIn(play.inventory),
      exhaustion: Math.max(0, Number(play.exhaustion) || 0), conditions: Array.isArray(play.conditions) ? play.conditions : [],
    };
  });
}

// Worries for session prep: who's down or low on hit points, out of rations, exhausted, or broke (less than a day's
// modest living). rows from partyRows → [{ id, name, text }], the worst first.
export function worries(rows) {
  const out = [];
  for (const r of rows || []) {
    if (r.down) out.push({ id: r.id, name: r.name, rank: 0, text: 'is down (0 hit points)' });
    else if (r.low) out.push({ id: r.id, name: r.name, rank: 1, text: `is low on hit points (${r.hp} of ${r.max})` });
    if (r.exhaustion) out.push({ id: r.id, name: r.name, rank: 2, text: `has ${r.exhaustion} level${r.exhaustion === 1 ? '' : 's'} of exhaustion` });
    if (!r.rations) out.push({ id: r.id, name: r.name, rank: 3, text: 'has no rations' });
    if (r.cp < 100) out.push({ id: r.id, name: r.name, rank: 4, text: r.cp ? 'has less than a gold piece' : 'is broke' });
  }
  return out.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)).map(({ rank, ...w }) => w);
}

// Enough food for the road: for a trip of this many days, each character's rations against what they need.
// chars: [{ name, inventory }] → [{ name, has, short }]
export const rationsFor = (days, chars) => (chars || []).map((c) => { const has = rationsIn(c.inventory); return { name: c.name, has, short: Math.max(0, days - has) }; });

// The party's wealth: the treasury plus every character's purse, in copper. purses: [{ name, cp }]
export function partyWealth(treasuryCp, purses) {
  const inPurses = (purses || []).reduce((t, p) => t + Math.max(0, Math.round(Number(p.cp) || 0)), 0);
  const treasury = Math.max(0, Math.round(Number(treasuryCp) || 0));
  return { total: treasury + inPurses, treasury, purses: inPurses };
}
