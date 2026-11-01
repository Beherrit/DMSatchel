// Waiting on the GM: things in the world that need a GM's hand: what's been asked for in shops, wages owed to
// hirelings, and bounties on the dead or captured that haven't been paid. Pure.
import { readAsks } from './shop-asks.js';
import { owedTo } from './hirelings.js';
import { bountyCp, CLAIMED } from './bounty.js';

// entries: as a GM sees them → { asks: [{ shop, items: [names] }], owed: [{ entry, cp }], bounties: [{ entry, cp }], count }
export function waitingOnGm(entries) {
  const asks = [], owed = [], bounties = [];
  for (const e of entries || []) {
    const a = e.kind === 'location' ? readAsks(e.fields?.asks) : [];
    if (a.length) asks.push({ shop: e, items: a.map((x) => x.item) });
    if (e.kind === 'npc' && owedTo(e)) owed.push({ entry: e, cp: owedTo(e) });
    if (e.kind === 'npc' && CLAIMED.includes(e.fields?.status) && !e.fields?.bounty_paid && bountyCp(e.fields?.bounty)) bounties.push({ entry: e, cp: bountyCp(e.fields.bounty) });
  }
  const byName = (a, b) => (a.shop || a.entry).name.localeCompare((b.shop || b.entry).name);
  return { asks: asks.sort(byName), owed: owed.sort(byName), bounties: bounties.sort(byName), count: asks.length + owed.length + bounties.length };
}
