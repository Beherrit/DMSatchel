// Tavern menu: a bill of fare for a tavern (drinks, dishes, the day's special and a bed for the night), priced to
// suit the town: SRD 5.1 food, drink and lodging prices, from a poor village alehouse to a fine city inn. Kept on
// the tavern as fields.menu (JSON). Pure, so it can be tested: rng from rng.js makeRng.

const QUALITY_BY_SIZE = { Hamlet: ['poor', 'modest'], Village: ['poor', 'modest'], Outpost: ['poor', 'modest'], Fortress: ['modest'], Town: ['modest', 'comfortable'], City: ['comfortable', 'wealthy'], Metropolis: ['comfortable', 'wealthy', 'aristocratic'] };
const QUALITIES = ['poor', 'modest', 'comfortable', 'wealthy', 'aristocratic'];
// Prices in copper, by quality: a dish, a mug of ale, a pitcher of wine, the common room, a private room.
const PRICE = {
  poor: { dish: 2, ale: 3, wine: 15, common: 7, room: 10 },
  modest: { dish: 10, ale: 4, wine: 20, common: 10, room: 50 },
  comfortable: { dish: 20, ale: 6, wine: 30, common: 20, room: 80 },
  wealthy: { dish: 30, ale: 10, wine: 50, common: 50, room: 200 },
  aristocratic: { dish: 70, ale: 20, wine: 100, common: 100, room: 400 },
};
const DISHES = {
  low: ['Barley porridge with salt pork', 'Pease pottage and a heel of bread', 'Turnip and onion stew', 'Black bread and dripping', 'Fried eels', 'Cabbage soup', 'Boiled mutton and greens'],
  mid: ['Mutton stew with dumplings', 'Roast chicken and leeks', 'Pork pie with pickles', 'Trout fried in butter', 'Rabbit pie', 'Cheese, apples and new bread', 'Sausages and mash', 'Beef and ale pudding'],
  high: ['Venison in red wine', 'Roast goose with chestnuts', 'Honey-glazed ham', 'Saffron rice with river crayfish', 'Spiced pears in cream', 'Pheasant with plums', 'Smoked salmon on rye'],
};
const BREWS = ['brown ale', 'pale ale', 'stout', 'cider', 'mead', 'small beer', 'perry', 'porter'];
const HOUSES = ['House', 'Miller’s', 'Old Bell', 'Black Dog', 'Saint’s', 'Harvest', 'Brewer’s', 'Night Watch'];
const SPECIAL_NOTES = ['caught this morning', 'the cook’s grandmother’s recipe', 'don’t ask what’s in it', 'a favourite of the town guard', 'while it lasts', 'the cook insists'];
const tierOf = (q) => (q === 'poor' ? 'low' : q === 'modest' || q === 'comfortable' ? 'mid' : 'high');

// → { quality, sections: [{ title, items: [{ name, cp }] }], special: { name, cp, note } }
export function rollMenu(rng, { size = 'Town', town = '' } = {}) {
  const quality = rng.pick(QUALITY_BY_SIZE[size] || QUALITY_BY_SIZE.Town);
  const p = PRICE[quality];
  const pickOut = (list, n) => { const pool = [...list], out = []; while (out.length < n && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]); return out; };
  // A little either way, rounded the way a landlord would chalk it up: whole silver from 2 sp, fives from 1 sp.
  const tidy = (cp) => (cp >= 20 ? Math.round(cp / 10) * 10 : cp >= 10 ? Math.round(cp / 5) * 5 : cp);
  const vary = (cp) => Math.max(1, tidy(Math.round(cp * (0.8 + rng.next() * 0.4))));
  const dishes = pickOut([...DISHES[tierOf(quality)], ...(quality === 'comfortable' ? pickOut(DISHES.high, 2) : [])], 4);
  const brews = pickOut(BREWS, 3).map((b, i) => `${i === 0 && town ? town : rng.pick(HOUSES)} ${b}`);
  const drinks = [...brews.map((name) => ({ name, cp: vary(p.ale) })), { name: quality === 'poor' ? 'Sour wine, by the cup' : 'House wine, by the pitcher', cp: quality === 'poor' ? Math.round(p.wine / 4) : p.wine }];
  if (['wealthy', 'aristocratic'].includes(quality)) drinks.push({ name: 'A bottle of fine wine', cp: 1000 });
  const special = dishes.pop();
  return {
    quality,
    sections: [
      { title: 'To drink', items: drinks },
      { title: 'To eat', items: dishes.map((name) => ({ name, cp: vary(p.dish) })) },
      { title: 'For the night', items: [{ name: 'A place in the common room', cp: p.common }, { name: 'A private room', cp: p.room }, { name: 'Stabling and feed, per horse', cp: 5 }] },
    ],
    special: { name: special, cp: vary(Math.round(p.dish * 1.5)), note: rng.pick(SPECIAL_NOTES) },
  };
}

// The stored text → a menu, or null if it isn't one.
export function readMenu(raw) {
  try {
    const m = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!m || !QUALITIES.includes(m.quality) || !Array.isArray(m.sections)) return null;
    const item = (x) => ({ name: String(x?.name || '').slice(0, 120), cp: Math.max(0, Math.round(Number(x?.cp) || 0)) });
    return {
      quality: m.quality,
      sections: m.sections.slice(0, 6).map((s) => ({ title: String(s?.title || '').slice(0, 60), items: (Array.isArray(s?.items) ? s.items : []).slice(0, 12).map(item).filter((x) => x.name) })),
      special: m.special?.name ? { ...item(m.special), note: String(m.special.note || '').slice(0, 120) } : null,
    };
  } catch { return null; }
}

// For reading out: one line per item.
export function menuText(m, coins) {
  const lines = [];
  if (m.special) lines.push(`Today: ${m.special.name}${m.special.note ? ` (${m.special.note})` : ''}, ${coins(m.special.cp)}`);
  for (const s of m.sections) { lines.push('', s.title); for (const x of s.items) lines.push(`${x.name}, ${coins(x.cp)}`); }
  return lines.join('\n');
}
