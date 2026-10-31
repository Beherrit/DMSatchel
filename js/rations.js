// Rations run down: on the road, each character eats one day's rations a day from their own inventory (a line such
// as "Rations (1 day) x10" or "8 rations"). Who runs out is reported, not punished. Pure, so it can be tested.
import { inventoryLines } from './handover.js';

const IS_RATION = /\bration/i;

// → { text (the inventory after), had, ate, short }
export function eatRations(inventory, days) {
  const want = Math.max(0, Math.round(Number(days) || 0));
  const lines = String(inventory || '').split('\n');
  const found = inventoryLines(inventory).filter((x) => IS_RATION.test(x.name));
  const had = found.reduce((t, x) => t + x.qty, 0);
  let need = want;
  for (const x of found) {
    if (!need) break;
    const take = Math.min(need, x.qty);
    need -= take;
    lines[x.index] = x.qty - take ? `${x.qty - take} ${x.name}` : null;
  }
  return { text: lines.filter((l) => l !== null).join('\n'), had, ate: want - need, short: need };
}
