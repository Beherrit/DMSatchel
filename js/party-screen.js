// A party sheet for the GM's screen: one printable row per character with hit points, armour class, passive
// Perception, coin and what they carry. Pure, so it can be tested; the page gathers each character's play state and
// built stats (from the Character Forge, when there are any).
import { inventoryLines } from './handover.js';
import { loadOf } from './weights.js';
import { worthOf } from './worth.js';
import { GOODS } from './economy.js';

// chars: [{ id, name, about, play, stats, str, size }] →
//   [{ id, name, about, hp, max, temp, ac, passive, cp, carry, exhaustion, conditions, load, goods }]
//   (load: from loadOf; goods: what the gear would fetch at the shops, in copper)
// carry is one line ("Rope, 7 × Rations (1 day), Lute"); numbers missing from both play and stats come back null.
export function screenRows(chars) {
  const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
  return (chars || []).map(({ id, name, about = '', play = {}, stats = null, str = null, size = 'Medium' }) => {
    const max = num(play.maxhp) || num(stats?.hp) || null;
    const hp = num(play.hp) ?? max;
    return {
      id, name, about,
      hp: hp === null ? null : Math.max(0, hp), max, temp: Math.max(0, num(play.temp) || 0),
      ac: num(play.ac) || num(stats?.ac) || null,
      passive: num(play.passive) || num(stats?.passive) || null,
      cp: Math.max(0, Math.round(num(play.cp) || 0)),
      carry: inventoryLines(play.inventory).map((x) => (x.qty > 1 ? `${x.qty} × ${x.name}` : x.name)).join(', '),
      exhaustion: Math.max(0, num(play.exhaustion) || 0),
      conditions: Array.isArray(play.conditions) ? play.conditions.filter(Boolean) : [],
      load: loadOf(play, str, size),
      goods: worthOf(play.inventory, GOODS).cp,
    };
  });
}
