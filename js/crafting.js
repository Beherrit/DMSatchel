// Crafting estimates for downtime, by the SRD 5.2 rules (CC BY 4.0) for crafting nonmagical items: the raw materials
// cost half the item's price, and the work takes its price in GP ÷ 10 days (rounded up, at least one); characters
// working together divide the days. Prices come from the SRD price list in economy.js. Pure.
import { GOODS } from './economy.js';

// (A leading "a", "an", "the" or "some" doesn't count, so a wish for "a longsword" finds the longsword.)
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/^(a|an|the|some) /, '');

// The good on the price list by name (exact, or the one it starts with). → { name, gp, category } or null.
export function findGood(name, goods = GOODS) {
  const n = norm(name);
  if (!n) return null;
  const hit = goods.find((g) => norm(g[0]) === n) || goods.find((g) => norm(g[0]).startsWith(n)) || goods.find((g) => n.startsWith(norm(g[0])));
  return hit ? { name: hit[0], gp: hit[1], category: hit[2] } : null;
}

// → { name, gp, materialsCp, days (for one crafter), daysEach (with helpers), helpers, tools } or null when it isn't listed.
export function craftEstimate(name, helpers = 1, goods = GOODS) {
  const g = findGood(name, goods);
  if (!g) return null;
  const n = Math.max(1, Math.min(20, Math.round(Number(helpers) || 1)));
  const days = Math.max(1, Math.ceil(g.gp / 10));
  return { name: g.name, gp: g.gp, materialsCp: Math.round(g.gp * 50), days, daysEach: Math.max(1, Math.ceil(days / n)), helpers: n, tools: toolsFor(g.name, g.category) };
}

// The right tools: which artisan's tools an item is usually made with (first matching rule wins). → a tool name, or ''.
const TOOL_RULES = [
  [/^(club|greatclub|quarterstaff|javelin|shortbow|longbow|arrows|light crossbow|hand crossbow|heavy crossbow|crossbow bolts|shield|lance|pike|spear|trident)\b/i, 'Woodcarver’s tools'],
  [/^(whip|sling|leather armor|studded leather|hide armor|saddlebags|riding saddle|military saddle|pack saddle|waterskin|backpack|barding \(leather\)|bit and bridle)\b/i, 'Leatherworker’s tools'],
  [/^(padded armor|bedroll|blanket|tent|sack|hempen rope|silk rope|common clothes|costume|fine clothes|traveler’s clothes|robes|winter cloak|canvas)\b/i, 'Weaver’s tools'],
  [/^(boots|climber’s kit)\b/i, 'Cobbler’s tools'],
  [/^(hooded lantern|bullseye lantern|lock|manacles|ball bearings|caltrops|hunting trap|signal whistle|music box|puzzle box)\b/i, 'Tinker’s tools'],
  [/^(spyglass|steel mirror|glass eye)\b/i, 'Glassblower’s tools'],
  [/^(acid|alchemist’s fire|perfume|soap|smokestick|tanglefoot bag|oil)\b/i, 'Alchemist’s supplies'],
  [/^(antitoxin|healer’s kit)\b/i, 'Herbalism kit'],
  [/^basic poison\b/i, 'Poisoner’s kit'],
  [/^(ink|map or scroll case|regional map|city map|book|paper|parchment|spellbook)\b/i, 'Calligrapher’s supplies'],
  [/^(arcane focus|holy symbol|silver ring|gold bracelet|gold locket|silver necklace)\b/i, 'Jeweler’s tools'],
  [/^(cart|wagon|carriage|sled|rowboat|keelboat|longship|sailing ship|galley)\b/i, 'Carpenter’s tools'],
  [/^(ale|bread|cheese|meat|meal|rations)\b/i, 'Cook’s utensils'],
];
export function toolsFor(name, category = '') {
  for (const [re, tool] of TOOL_RULES) if (re.test(String(name || ''))) return tool;
  return ['Weapons', 'Armor'].includes(category) ? 'Smith’s tools' : category === 'Instruments' ? 'Woodcarver’s tools' : '';
}

// Got the tools?: whether a pack (inventory text, one item a line) holds these tools ("Smith's tools", any case).
export function hasTools(inventory, tool) {
  const key = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
  const t = key(tool);
  return !!t && String(inventory || '').split('\n').some((l) => key(l).includes(t));
}

// What these tools could make: the goods on the price list usually made with them, cheapest first. → [{ name, gp }].
export const craftableWith = (tool, goods = GOODS) => goods.filter((g) => toolsFor(g[0], g[2]) === tool).map((g) => ({ name: g[0], gp: g[1] })).sort((a, b) => a.gp - b.gp || a.name.localeCompare(b.name));

// The artisan's tools a pack holds (from those the price list's goods need). → [tool names].
export function toolsInPack(inventory, goods = GOODS) {
  const all = [...new Set(goods.map((g) => toolsFor(g[0], g[2])).filter(Boolean))];
  return all.filter((t) => hasTools(inventory, t));
}
