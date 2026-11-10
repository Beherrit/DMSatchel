// Market stalls: on a town's market day, a few travelling stalls set up in the square. Seeded by the town and the
// date, so everyone sees the same stalls all day and a different set next market day. Pure, so it can be tested.
import { makeRng } from './rng.js';
import { coinText } from './economy.js';

// [stall, keeper's trade, [[item, price in gp], ...]]
const STALLS = [
  ['Spice cart', 'a spice trader from the south', [['Pepper (1 oz)', 0.2], ['Saffron (pinch)', 1], ['Cinnamon bark', 0.3], ['Salt (1 lb)', 0.05], ['Dried chillies (string)', 0.1]]],
  ['Tinker’s barrow', 'a travelling tinker', [['Mended pot', 0.3], ['Tin lantern', 2], ['Set of needles', 0.1], ['Hinges (pair)', 0.2], ['Small padlock', 1]]],
  ['Cheese and cured meats', 'a farm family from up the valley', [['Wheel of hard cheese', 0.5], ['Smoked sausage', 0.05], ['Side of bacon', 0.4], ['Goat’s cheese', 0.1]]],
  ['Herb woman’s table', 'a hedge herbalist', [['Willow bark tea', 0.05], ['Comfrey poultice', 0.2], ['Sleeping draught', 1], ['Bundle of sage', 0.02], ['Antitoxin (vial)', 50]]],
  ['Bookseller’s crates', 'a bookseller with a cart of crates', [['Almanac', 1], ['Book of hours', 25], ['Map of the region', 5], ['Ink and quill', 10], ['Blank journal', 2]]],
  ['Weaver’s stall', 'a weaver and their apprentice', [['Wool cloak', 1], ['Linen shirt', 0.5], ['Woven blanket', 0.5], ['Bolt of dyed cloth', 2]]],
  ['Bladesmith’s rack', 'a journeyman smith on the road', [['Dagger', 2], ['Hunting knife', 1], ['Handaxe', 5], ['Whetstone', 0.01], ['Spearhead', 0.5]]],
  ['Pie stand', 'a baker with a hand-cart', [['Meat pie', 0.04], ['Apple tart', 0.02], ['Loaf of dark bread', 0.02], ['Honey cake', 0.05]]],
  ['Curio table', 'a sharp-eyed curio dealer', [['Old coin (foreign)', 1], ['Carved bone dice', 0.5], ['Brass spyglass (cracked)', 15], ['Lucky rabbit’s foot', 0.2], ['Music box', 10]]],
  ['Leatherworker’s bench', 'a leatherworker', [['Belt pouch', 0.5], ['Waterskin', 0.2], ['Leather gloves', 0.5], ['Saddlebags', 4], ['Boots, mended', 1]]],
  ['Fishmonger’s barrels', 'a fishmonger from the coast', [['Salted herring (dozen)', 0.1], ['Smoked eel', 0.2], ['Dried cod', 0.15], ['Barrel of oysters', 2]]],
  ['Candle and lamp stall', 'a chandler’s cousin', [['Candles (10)', 0.1], ['Lamp oil (flask)', 0.1], ['Tinderbox', 0.5], ['Beeswax candle', 0.05]]],
  ['Toy and trinket stall', 'a woodcarver', [['Wooden soldier', 0.1], ['Spinning top', 0.05], ['Carved whistle', 0.05], ['Painted mask', 0.3]]],
  ['Livestock pen', 'a drover', [['Chicken', 0.02], ['Goat', 1], ['Pig', 3], ['Mule', 8], ['Riding horse', 75]]],
];

// The stalls are up from dawn till late afternoon (minutes of the day).
export const STALLS_OPEN = 6 * 60, STALLS_SHUT = 17 * 60;

// How many stalls by the town's size.
const COUNT = { Hamlet: 2, Village: 3, Town: 4, City: 5, Metropolis: 6, Fortress: 2, Outpost: 2 };

// → [{ name, keeper, goods: [{ name, cp, gp, price (text) }] }], or [] with no seed.
export function marketStalls(seed, size = 'Town') {
  if (!seed) return [];
  const rng = makeRng(`stalls:${seed}`);
  const pool = STALLS.slice(), out = [];
  for (let k = Math.min(COUNT[size] || 4, pool.length); k > 0; k--) {
    const [name, keeper, goods] = pool.splice(rng.int(pool.length), 1)[0];
    // A seeded shuffle (Fisher–Yates), so the server and every browser pick the same goods.
    const mixed = goods.slice();
    for (let i = mixed.length - 1; i > 0; i--) { const j = rng.int(i + 1); [mixed[i], mixed[j]] = [mixed[j], mixed[i]]; }
    const some = mixed.slice(0, rng.range(2, Math.min(4, goods.length)));
    // Market prices: a stall haggles a little, so each price wanders up or down by up to a fifth.
    // Whole coins: copper under a gold piece, silver up to a hundred gold, gold above, so the price shown is the price paid.
    out.push({ name, keeper, goods: some.map(([g, gp]) => { const raw = Math.max(1, Math.round(gp * (0.8 + rng.next() * 0.4) * 100)), cp = raw >= 10000 ? Math.round(raw / 100) * 100 : raw >= 100 ? Math.round(raw / 10) * 10 : raw;
      return { name: g, cp, gp: cp / 100, price: coinText(cp) }; }) });
  }
  return out;
}

// The stalls as plain text, one stall a line: "Spice cart (a spice trader from the south): Pepper (1 oz) 2 sp, …".
export const stallsText = (stalls) => stalls.map((s) => `${s.name} (${s.keeper}): ${s.goods.map((g) => `${g.name} ${g.price}`).join(', ')}`).join('\n');
