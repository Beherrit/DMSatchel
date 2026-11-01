// Waiting on the GM: things in the world that need a GM's hand: what's been asked for in shops, wages owed to
// hirelings, and bounties on the dead or captured that haven't been paid. Pure.
import { readAsks } from './shop-asks.js';
import { owedTo } from './hirelings.js';
import { bountyCp, CLAIMED } from './bounty.js';
import { readTab, tabTotal } from './tab.js';

// entries: as a GM sees them → { asks: [{ shop, items: [names] }], owed: [{ entry, cp }], bounties: [{ entry, cp }],
//   tabs: [{ shop, cp, orders }], count }
export function waitingOnGm(entries) {
  const asks = [], owed = [], bounties = [], tabs = [];
  for (const e of entries || []) {
    const a = e.kind === 'location' ? readAsks(e.fields?.asks) : [];
    if (a.length) asks.push({ shop: e, items: a.map((x) => x.item) });
    const t = e.kind === 'location' ? readTab(e.fields?.tab) : [];
    if (t.length) tabs.push({ shop: e, cp: tabTotal(t), orders: t.length });
    if (e.kind === 'npc' && owedTo(e)) owed.push({ entry: e, cp: owedTo(e) });
    if (e.kind === 'npc' && CLAIMED.includes(e.fields?.status) && !e.fields?.bounty_paid && bountyCp(e.fields?.bounty)) bounties.push({ entry: e, cp: bountyCp(e.fields.bounty) });
  }
  const byName = (a, b) => (a.shop || a.entry).name.localeCompare((b.shop || b.entry).name);
  return { asks: asks.sort(byName), owed: owed.sort(byName), bounties: bounties.sort(byName), tabs: tabs.sort(byName), count: asks.length + owed.length + bounties.length + tabs.length };
}
