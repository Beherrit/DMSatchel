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
