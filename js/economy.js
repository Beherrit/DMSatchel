// Shops and town economies: SRD equipment prices, shop types, market conditions (inflation, shortages,
// surpluses, embargoes) and the pricing that ties them together. Prices are in gold pieces.
import { randomItem, RARITIES } from './magic-items.js';

// [name, price in gp, category]
const G = (cat, rows) => rows.split(';').map((r) => { const [n, p] = r.split('='); return [n.trim(), parseFloat(p), cat]; });
export const GOODS = [
  ...G('Weapons', 'Club=0.1;Dagger=2;Greatclub=0.2;Handaxe=5;Javelin=0.5;Light hammer=2;Mace=5;Quarterstaff=0.2;Sickle=1;Spear=1;Light crossbow=25;Darts (10)=0.5;Shortbow=25;Sling=0.1;Battleaxe=10;Flail=10;Glaive=20;Greataxe=30;Greatsword=50;Halberd=20;Lance=10;Longsword=15;Maul=10;Morningstar=15;Pike=5;Rapier=25;Scimitar=25;Shortsword=10;Trident=5;War pick=5;Warhammer=15;Whip=2;Hand crossbow=75;Heavy crossbow=50;Longbow=50;Arrows (20)=1;Crossbow bolts (20)=1;Sling bullets (20)=0.04'),
  ...G('Armor', 'Padded armor=5;Leather armor=10;Studded leather=45;Hide armor=10;Chain shirt=50;Scale mail=50;Breastplate=400;Half plate=750;Ring mail=30;Chain mail=75;Splint armor=200;Plate armor=1500;Shield=10'),
  ...G('Adventuring gear', 'Backpack=2;Bedroll=1;Blanket=0.5;Candle=0.01;Chain (10 ft)=5;Climber’s kit=25;Crowbar=2;Grappling hook=2;Hammer=1;Healer’s kit=5;Hooded lantern=5;Bullseye lantern=10;Lock=10;Manacles=2;Steel mirror=5;Oil (flask)=0.1;Pitons (10)=0.5;Rations (1 day)=0.5;Hempen rope (50 ft)=1;Silk rope (50 ft)=10;Sack=0.01;Shovel=2;Signal whistle=0.05;Spyglass=1000;Tent (two-person)=2;Tinderbox=0.5;Torch=0.01;Waterskin=0.2;Ball bearings (bag)=1;Caltrops (bag)=1;Hunting trap=5;Fishing tackle=1;Ladder (10 ft)=0.1;Iron pot=2;Mess kit=0.2;Hourglass=25;Magnifying glass=100;Bell=1;Chalk=0.01;Vial=1;Flask=0.02'),
  ...G('Arcane & holy', 'Component pouch=25;Arcane focus (crystal)=10;Arcane focus (orb)=20;Arcane focus (wand)=10;Holy symbol (amulet)=5;Holy water (flask)=25;Spellbook (blank)=50;Druidic focus (sprig of mistletoe)=1'),
  ...G('Alchemy', 'Acid (vial)=25;Alchemist’s fire (flask)=50;Antitoxin (vial)=50;Basic poison (vial)=100;Perfume (vial)=5;Soap=0.02;Smokestick=20;Tanglefoot bag=50'),
  ...G('Tools', 'Alchemist’s supplies=50;Brewer’s supplies=20;Calligrapher’s supplies=10;Carpenter’s tools=8;Cartographer’s tools=15;Cobbler’s tools=5;Cook’s utensils=1;Glassblower’s tools=30;Jeweler’s tools=25;Leatherworker’s tools=5;Mason’s tools=10;Painter’s supplies=10;Potter’s tools=10;Smith’s tools=20;Tinker’s tools=50;Weaver’s tools=1;Woodcarver’s tools=1;Disguise kit=25;Forgery kit=15;Herbalism kit=5;Navigator’s tools=25;Poisoner’s kit=50;Thieves’ tools=25;Dice set=0.1;Playing cards=0.5'),
  ...G('Instruments', 'Bagpipes=30;Drum=6;Dulcimer=25;Flute=2;Horn=3;Lute=35;Lyre=30;Pan flute=12;Shawm=2;Viol=30'),
  ...G('Clothing', 'Common clothes=0.5;Costume=5;Fine clothes=15;Traveler’s clothes=2;Robes=1;Winter cloak=2;Boots (sturdy)=1'),
  ...G('Books & maps', 'Book (history or lore)=25;Ink (1 ounce)=10;Ink pen=0.02;Paper (one sheet)=0.2;Parchment (one sheet)=0.1;Map or scroll case=1;Regional map=5;City map=10;Sealing wax=0.5'),
  ...G('Food & drink', 'Ale (mug)=0.04;Ale (gallon)=0.2;Bread (loaf)=0.02;Cheese (hunk)=0.1;Meat (chunk)=0.3;Wine (common pitcher)=0.2;Wine (fine bottle)=10;Meal (poor)=0.06;Meal (modest)=0.3;Meal (comfortable)=0.5;Meal (wealthy)=0.8;Banquet (per person)=10'),
  ...G('Lodging & services', 'Inn stay (squalid)=0.07;Inn stay (poor)=0.1;Inn stay (modest)=0.5;Inn stay (comfortable)=0.8;Inn stay (wealthy)=2;Bath=0.05;Stabling (per day)=0.5;Hireling, untrained (per day)=0.2;Hireling, skilled (per day)=2;Messenger (per mile)=0.02;Coach fare (per mile)=0.03;Ship’s passage (per mile)=0.1'),
  ...G('Spellcasting', 'Spellcasting: cantrip=10;Spellcasting: 1st level=50;Spellcasting: 2nd level=100;Spellcasting: 3rd level=200;Spellcasting: 4th level=350;Spellcasting: 5th level=600;Cure Wounds=50;Lesser Restoration=120;Remove Curse=250;Raise Dead (plus 500 gp diamond)=1250;Identify=60'),
  ...G('Mounts & tack', 'Donkey or mule=8;Pony=30;Draft horse=50;Riding horse=75;Warhorse=400;Camel=50;Mastiff=25;Riding saddle=10;Military saddle=20;Pack saddle=5;Saddlebags=4;Bit and bridle=2;Feed (per day)=0.05;Barding (leather)=40;Cart=15;Wagon=35;Carriage=100;Sled=20'),
  ...G('Vessels', 'Rowboat=50;Keelboat=3000;Longship=10000;Sailing ship=10000;Galley=30000'),
  ...G('Trade goods', 'Wheat (1 lb)=0.01;Flour (1 lb)=0.02;Chicken=0.02;Salt (1 lb)=0.05;Iron (1 lb)=0.1;Canvas (1 sq yd)=0.1;Copper (1 lb)=0.5;Cotton cloth (1 sq yd)=0.5;Ginger (1 lb)=1;Goat=1;Cinnamon (1 lb)=2;Pepper (1 lb)=2;Sheep=2;Cloves (1 lb)=3;Pig=3;Silver (1 lb)=5;Linen (1 sq yd)=5;Silk (1 sq yd)=10;Cow=10;Saffron (1 lb)=15;Ox=15;Gold (1 lb)=50;Platinum (1 lb)=500'),
  ...G('Gems & jewelry', 'Azurite=10;Moss agate=10;Bloodstone=50;Moonstone=50;Amethyst=100;Pearl=100;Garnet=100;Aquamarine=500;Topaz=500;Emerald=1000;Black opal=1000;Diamond=5000;Silver ring=25;Gold bracelet=25;Gold locket=50;Silver necklace with gemstone pendant=250'),
  ...G('Curiosities', 'Music box=12;Mummified hand (probably fake)=5;Puzzle box=25;Glass eye=8;Tarot deck=3;Bottled ship=10;Stuffed owlbear cub=30;Map with one corner burned=8;Jar of coins from dead kingdoms=15;Mirror that fogs when lied to=40'),
];
export const CATEGORIES = [...new Set(GOODS.map((g) => g[2]))];

// What each shop sells: categories with a share of their goods stocked, plus magic chances.
export const SHOP_TYPES = {
  'General store': { cats: { 'Adventuring gear': 0.8, 'Clothing': 0.6, 'Food & drink': 0.3, 'Tools': 0.25, 'Books & maps': 0.3 }, names: ['Sundries', 'Provisions', 'General Goods', 'Supply'] },
  'Blacksmith': { cats: { 'Weapons': 0.5, 'Armor': 0.4, 'Adventuring gear': 0.15, 'Tools': 0.15 }, names: ['Forge', 'Smithy', 'Ironworks', 'Anvil'] },
  'Armorer': { cats: { 'Armor': 0.9, 'Weapons': 0.15 }, names: ['Armory', 'Plate & Mail', 'Shieldhall'] },
  'Weaponsmith': { cats: { 'Weapons': 0.9 }, names: ['Blades', 'Arms', 'Steelworks'] },
  'Bowyer & fletcher': { cats: { 'Weapons': 0.35 }, filter: /bow|arrow|bolt|sling|dart|javelin/i, names: ['Bows & Arrows', 'Fletchery', 'Archery'] },
  'Apothecary': { cats: { 'Alchemy': 0.6, 'Adventuring gear': 0.05 }, extra: ['Healer’s kit', 'Herbalism kit'], magic: { types: ['Potion'], chance: 0.6, count: [1, 4], max: 'u' }, names: ['Remedies', 'Tonics & Tinctures', 'Herbs', 'Apothecary'] },
  'Alchemist': { cats: { 'Alchemy': 1, 'Tools': 0.08 }, magic: { types: ['Potion'], chance: 0.8, count: [2, 5], max: 'r' }, names: ['Alchemicals', 'Retorts', 'Elixirs'] },
  'Magic shop': { cats: { 'Arcane & holy': 0.8, 'Books & maps': 0.3 }, magic: { types: null, chance: 1, count: [3, 8], max: 'v' }, names: ['Arcana', 'Wonders', 'Curios Arcane', 'Enchantments'] },
  'Temple': { cats: { 'Spellcasting': 0.7, 'Arcane & holy': 0.3 }, magic: { types: ['Potion', 'Scroll'], chance: 0.5, count: [1, 3], max: 'r' }, names: ['Temple Services', 'Sanctuary'] },
  'Tailor': { cats: { 'Clothing': 1 }, names: ['Fine Threads', 'Tailor', 'Cloaks & Coats'] },
  'Stables': { cats: { 'Mounts & tack': 0.85, 'Lodging & services': 0.1 }, names: ['Stables', 'Livery', 'Horse Fair'] },
  'Tavern & inn': { cats: { 'Food & drink': 0.9, 'Lodging & services': 0.6 }, names: ['Taproom', 'Inn'] },
  'Bookseller': { cats: { 'Books & maps': 1, 'Arcane & holy': 0.15 }, magic: { types: ['Scroll'], chance: 0.4, count: [1, 2], max: 'u' }, names: ['Books & Bindings', 'Scriptorium', 'Pages'] },
  'Jeweler': { cats: { 'Gems & jewelry': 0.8 }, magic: { types: ['Ring'], chance: 0.15, count: [1, 1], max: 'r' }, names: ['Gems', 'Jewels', 'Fine Settings'] },
  'Curiosity shop': { cats: { 'Curiosities': 0.8, 'Instruments': 0.2, 'Books & maps': 0.15 }, magic: { types: null, chance: 0.3, count: [1, 1], max: 'r', cursed: 0.3 }, names: ['Oddments', 'Curios', 'Treasures & Trinkets'] },
  'Trading post': { cats: { 'Trade goods': 0.7, 'Adventuring gear': 0.4, 'Food & drink': 0.2 }, names: ['Trading Post', 'Exchange', 'Wares'] },
  'Shipwright & chandler': { cats: { 'Vessels': 0.6, 'Adventuring gear': 0.2 }, extra: ['Navigator’s tools', 'Hempen rope (50 ft)', 'Silk rope (50 ft)', 'Spyglass'], names: ['Chandlery', 'Shipwright', 'Docks Supply'] },
  'Black market': { cats: { 'Alchemy': 0.5, 'Weapons': 0.2, 'Tools': 0.15 }, extra: ['Thieves’ tools', 'Poisoner’s kit', 'Forgery kit', 'Disguise kit'], markup: 1.4, magic: { types: null, chance: 0.6, count: [1, 3], max: 'v', cursed: 0.2 }, names: ['Back Room', 'Den', 'No Questions Asked'] },
};

// Town economies: inflation range, how well stocked shops are, how much magic gets through.
export const ECONOMIES = {
  Booming: { inflation: [8, 25], stock: 1.4, magic: 1.4, conditions: [0, 2], note: 'Coin flows freely; prices are high but shelves are full.' },
  Prosperous: { inflation: [0, 12], stock: 1.2, magic: 1.2, conditions: [0, 2], note: 'A healthy market town.' },
  Stable: { inflation: [-3, 6], stock: 1, magic: 1, conditions: [0, 1], note: 'Prices are what travelers expect.' },
  Struggling: { inflation: [-5, 20], stock: 0.7, magic: 0.6, conditions: [1, 2], note: 'Hard times; shops are half empty and prices jump around.' },
  Besieged: { inflation: [30, 80], stock: 0.45, magic: 0.5, conditions: [2, 3], note: 'War or siege: food and arms are precious.' },
  Destitute: { inflation: [-15, 5], stock: 0.4, magic: 0.2, conditions: [1, 2], note: 'Little money and less to buy.' },
};
const SIZE_STOCK = { Hamlet: 0.35, Village: 0.55, Town: 0.85, City: 1.1, Metropolis: 1.3, Fortress: 0.7, Outpost: 0.45 };
const SIZE_MAGIC = { Hamlet: 'c', Village: 'u', Town: 'r', City: 'v', Metropolis: 'l', Fortress: 'u', Outpost: 'u' };
const RANK = ['c', 'u', 'r', 'v', 'l'];

// Market conditions with the kinds of reasons that cause them.
export const CONDITION_REASONS = {
  shortage: {
    Weapons: ['The army requisitioned every blade in town.', 'The iron mine flooded and the smiths have no metal.', 'The smiths’ guild is on strike.'],
    Armor: ['The mine flooded; the armorers have nothing to hammer.', 'A border war bought up every coat of mail.'],
    'Food & drink': ['Blight ruined the harvest.', 'Bandits are raiding the grain carts.', 'A plague of rats got into the granaries.'],
    'Trade goods': ['A caravan was lost in the pass.', 'The river froze early and the barges stopped.', 'Pirates are taking ships at the river mouth.'],
    Alchemy: ['A fever has emptied the apothecary’s shelves.', 'The herb fields burned.'],
    'Mounts & tack': ['Horse fever swept the stables.', 'The cavalry bought every horse that could walk.'],
    'Adventuring gear': ['A gold rush emptied the shops of rope, picks and lanterns.', 'A caravan carrying supplies never arrived.'],
    'Arcane & holy': ['The temple bought up every holy symbol for a great procession.', 'The wizards’ college took all the components.'],
    Clothing: ['A royal wedding has every tailor booked for months.'],
    'Gems & jewelry': ['A noble house is buying every gem for a dowry.'],
  },
  surplus: {
    Weapons: ['A mercenary company disbanded and sold its gear.', 'Smiths made too much for a war that ended early.'],
    Armor: ['A garrison was disbanded and its armor sold off.'],
    'Food & drink': ['A bumper harvest; granaries are overflowing.', 'A festival is over and the brewers overstocked.'],
    'Trade goods': ['Three caravans arrived in the same week.', 'A new trade road opened.'],
    'Adventuring gear': ['A failed expedition sold off its supplies.'],
    'Gems & jewelry': ['Miners hit a rich vein of gemstones.'],
    'Curiosities': ['An old collector died and their heirs are selling everything.'],
    'Mounts & tack': ['A horse fair is in town.'],
    'Books & maps': ['A wizard’s library was auctioned off.'],
  },
  embargo: {
    Alchemy: ['The magistrate banned poisons and acids after a murder.'],
    'Arcane & holy': ['The church has outlawed foreign holy symbols.', 'The duke banned spell components after a fire.'],
    Weapons: ['The town guard forbids selling weapons to outsiders.'],
    'Spellcasting': ['A new law forbids spellcasting for hire.'],
  },
};
export const FESTIVALS = ['The Harvest Fair fills the streets: food and drink cost more, but everyone’s in a good mood.', 'A royal visit: fine clothes and jewelry are in demand.', 'The spring horse fair: mounts are plentiful and cheaper.', 'A saint’s day: temples offer blessings at half price.'];

export function rollMarket(rng, { economy, size = 'Town' } = {}) {
  const eco = economy && ECONOMIES[economy] ? economy : rng.pickW({ Booming: 2, Prosperous: 4, Stable: 6, Struggling: 3, Besieged: 1, Destitute: 1 });
  const E = ECONOMIES[eco];
  const inflation = rng.range(E.inflation[0], E.inflation[1]);
  const conditions = [];
  const n = rng.range(E.conditions[0], E.conditions[1]);
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const kind = eco === 'Besieged' ? rng.pickW({ shortage: 6, embargo: 1 }) : rng.pickW({ shortage: 5, surplus: 4, embargo: 1 });
    const cats = Object.keys(CONDITION_REASONS[kind]).filter((c) => !used.has(c));
    if (!cats.length) continue;
    const category = eco === 'Besieged' && kind === 'shortage' && !used.has('Food & drink') ? 'Food & drink' : rng.pick(cats);
    used.add(category);
    const factor = kind === 'shortage' ? rng.pick([1.5, 1.75, 2, 2.5, 3]) : kind === 'surplus' ? rng.pick([0.5, 0.6, 0.7, 0.8]) : 3;
    conditions.push({ kind, category, factor, reason: rng.pick(CONDITION_REASONS[kind][category]) });
  }
  const festival = rng.chance(0.12) ? rng.pick(FESTIVALS) : '';
  return { economy: eco, size, inflation, conditions, festival };
}

// Plain-text form saved on settlements, readable and editable by GMs.
export function marketText(m) {
  return [
    `Economy: ${m.economy}`, `Inflation: ${m.inflation >= 0 ? '+' : ''}${m.inflation}%`,
    ...m.conditions.map((c) => `${{ shortage: 'Shortage', surplus: 'Surplus', embargo: 'Embargo' }[c.kind]}: ${c.category} ×${c.factor} — ${c.reason}`),
    m.festival ? `Festival: ${m.festival}` : '',
  ].filter(Boolean).join('\n');
}

export function parseMarket(text, size = 'Town') {
  const m = { economy: 'Stable', size, inflation: 0, conditions: [], festival: '' };
  for (const line of String(text || '').split('\n')) {
    let x;
    if ((x = line.match(/^Economy:\s*(\w+)/))) m.economy = ECONOMIES[x[1]] ? x[1] : 'Stable';
    else if ((x = line.match(/^Inflation:\s*([+-−]?\d+)/))) m.inflation = parseInt(x[1].replace('−', '-'), 10);
    else if ((x = line.match(/^(Shortage|Surplus|Embargo):\s*([^×—]+?)\s*(?:×\s*([\d.]+))?\s*(?:—\s*(.*))?$/))) {
      const kind = x[1].toLowerCase();
      m.conditions.push({ kind, category: x[2].trim(), factor: x[3] ? parseFloat(x[3]) : kind === 'shortage' ? 2 : kind === 'surplus' ? 0.7 : 3, reason: x[4] || '' });
    } else if ((x = line.match(/^Festival:\s*(.*)$/))) m.festival = x[1];
  }
  return m;
}

export function fmtPrice(gp) {
  if (gp >= 100) return `${Math.round(gp).toLocaleString('en-US')} gp`;
  if (gp >= 1) { const g = Math.floor(gp), s = Math.round((gp - g) * 10); return s ? `${g} gp ${s} sp` : `${g} gp`; }
  if (gp >= 0.1) { const s = Math.floor(gp * 10), c = Math.round((gp * 10 - s) * 10); return c ? `${s} sp ${c} cp` : `${s} sp`; }
  return `${Math.max(1, Math.round(gp * 100))} cp`;
}
export function parsePrice(s) {
  let t = 0; for (const [, n, c] of String(s).matchAll(/([\d,.]+)\s*(pp|gp|sp|cp)/g)) t += parseFloat(n.replace(/,/g, '')) * { pp: 10, gp: 1, sp: 0.1, cp: 0.01 }[c];
  return t;
}

// Price and stock of one item under a market.
function priceFor(base, category, market, shop, rng) {
  let mult = 1 + market.inflation / 100;
  let note = '';
  const cond = market.conditions.find((c) => c.category === category);
  if (cond?.kind === 'shortage') { mult *= cond.factor; note = 'Shortage'; }
  if (cond?.kind === 'surplus') { mult *= cond.factor; note = 'Surplus'; }
  if (cond?.kind === 'embargo') { mult *= shop.black ? cond.factor : 1; note = shop.black ? 'Contraband' : 'Banned'; }
  if (market.festival && /Food|Lodging/.test(category) && /Harvest/.test(market.festival)) { mult *= 1.25; note ||= 'Festival'; }
  if (market.festival && /Mounts/.test(category) && /horse fair/.test(market.festival)) { mult *= 0.8; note ||= 'Horse fair'; }
  if (market.festival && /Spellcasting/.test(category) && /saint/.test(market.festival)) { mult *= 0.5; note ||= 'Saint’s day'; }
  mult *= shop.markup || 1;
  mult *= 0.95 + rng.next() * 0.1; // a little shop-to-shop variation
  return { price: base * mult, note, cond };
}

const ATTITUDES = [['Generous', 10, 0.6], ['Fair', 13, 0.5], ['Shrewd', 15, 0.45], ['Greedy', 18, 0.35], ['Desperate for coin', 11, 0.6]];

export function generateShop(rng, { type, market, ownerName, size } = {}) {
  const t = type && SHOP_TYPES[type] ? type : rng.pickW({ 'General store': 6, Blacksmith: 4, Apothecary: 3, 'Tavern & inn': 3, Tailor: 2, Stables: 2, 'Magic shop': 1, Alchemist: 1, Armorer: 1, Weaponsmith: 1, 'Bowyer & fletcher': 1, Bookseller: 1, Jeweler: 1, 'Curiosity shop': 2, 'Trading post': 2, Temple: 1, 'Shipwright & chandler': 1, 'Black market': 1 });
  const def = SHOP_TYPES[t];
  const sz = size || market?.size || 'Town';
  const mkt = market || rollMarket(rng, { size: sz });
  const eco = ECONOMIES[mkt.economy] || ECONOMIES.Stable;
  const shop = { black: t === 'Black market', markup: def.markup || 1 };
  const stockMult = (SIZE_STOCK[sz] || 0.85) * eco.stock;
  const items = [];
  for (const [cat, share] of Object.entries(def.cats)) {
    let pool = GOODS.filter((g) => g[2] === cat && (!def.filter || def.filter.test(g[0])));
    const want = Math.max(1, Math.round(pool.length * share * Math.min(1.2, 0.5 + stockMult / 2)));
    pool = rng.sample(pool, want);
    for (const [name, base, category] of pool) items.push({ name, base, category });
  }
  for (const name of def.extra || []) { const g = GOODS.find((x) => x[0] === name); if (g && !items.some((i) => i.name === name)) items.push({ name: g[0], base: g[1], category: g[2] }); }
  for (const it of items) {
    const { price, note, cond } = priceFor(it.base, it.category, mkt, shop, rng);
    const cheap = it.base < 1 ? rng.range(10, 40) : it.base < 20 ? rng.range(2, 12) : it.base < 200 ? rng.range(1, 4) : rng.range(0, 2);
    let qty = Math.round(cheap * stockMult);
    if (cond?.kind === 'shortage') qty = Math.floor(qty * (1 / cond.factor) * rng.next());
    if (cond?.kind === 'surplus') qty = Math.round(qty * 2 + 2);
    if (cond?.kind === 'embargo' && !shop.black) qty = 0;
    if (/Spellcasting|Lodging|Food|services/.test(it.category)) qty = cond?.kind === 'embargo' && !shop.black ? 0 : -1; // services: unlimited
    Object.assign(it, { price, note, qty });
  }
  // Magic stock, limited by town size, shop type and economy.
  const special = [];
  if (def.magic && rng.next() < def.magic.chance * eco.magic) {
    const maxRank = Math.min(RANK.indexOf(def.magic.max), RANK.indexOf(SIZE_MAGIC[sz] || 'r'));
    const count = rng.range(def.magic.count[0], def.magic.count[1]);
    for (let i = 0; i < count && maxRank >= 0; i++) {
      const rarity = RANK[rng.range(0, maxRank)];
      const type = def.magic.types ? rng.pick(def.magic.types) : undefined;
      const cursed = def.magic.cursed && rng.chance(def.magic.cursed);
      const it = (cursed && randomItem(rng, { cursed: true })) || randomItem(rng, { rarity, type, cursed: false }) || randomItem(rng, { rarity });
      if (!it || special.some((s) => s.name === it.name)) continue;
      const { price } = priceFor(it.value, 'Magic', mkt, shop, rng);
      special.push({ name: it.name, base: it.value, price, qty: 1, category: `Magic (${RARITIES[it.rarity]})`, note: it.cursed ? 'Cursed (the shopkeeper may not know)' : '', item: it });
    }
  }
  const [attitude, haggleDC, buyBack] = rng.pick(ATTITUDES);
  const embargoed = mkt.conditions.filter((c) => c.kind === 'embargo' && (def.cats[c.category] || items.some((i) => i.category === c.category))).map((c) => c.category);
  return {
    type: t, name: `${ownerName ? ownerName.split(' ')[0] + '’s ' : ''}${rng.pick(def.names)}`, owner: ownerName || '', attitude, haggleDC,
    buyBack: Math.round(buyBack * 100), market: mkt, items: items.sort((a, b) => a.category.localeCompare(b.category) || a.base - b.base), special,
    notes: embargoed.length && !shop.black ? `Won’t sell banned goods (${embargoed.join(', ')}). Ask around for the black market.` : shop.black ? 'Prices include the risk. Contraband available. Nothing is guaranteed.' : '',
  };
}

// Stock as editable text: category headers, then "Item | price | stock | note" lines.
export function stockText(shop) {
  const lines = [`Attitude: ${shop.attitude} · Haggle DC ${shop.haggleDC} · Buys at ${shop.buyBack}% of value`];
  let cat = '';
  for (const it of [...shop.items, ...shop.special]) {
    if (it.category !== cat) { cat = it.category; lines.push('', `## ${cat}`); }
    const qty = it.qty < 0 ? 'available' : it.qty === 0 ? 'out of stock' : `${it.qty} in stock`;
    const changed = Math.abs(it.price - it.base) / Math.max(it.base, 0.01) > 0.08 && fmtPrice(it.price) !== fmtPrice(it.base);
    lines.push(`${it.name} | ${fmtPrice(it.price)}${changed ? ` (usually ${fmtPrice(it.base)})` : ''} | ${qty}${it.note ? ` | ${it.note}` : ''}`);
  }
  if (shop.notes) lines.push('', shop.notes);
  return lines.join('\n');
}

// 12345 cp → "123 gp 4 sp 5 cp"
export function coinText(cp) {
  const neg = cp < 0; let n = Math.abs(Math.round(cp));
  const gp = Math.floor(n / 100); n -= gp * 100;
  const sp = Math.floor(n / 10); const c = n - sp * 10;
  const parts = [gp && `${gp.toLocaleString('en-US')} gp`, sp && `${sp} sp`, c && `${c} cp`].filter(Boolean);
  return `${neg ? '−' : ''}${parts.join(' ') || '0 gp'}`;
}

// "25 gp 3 sp", "12", "1,200" → copper pieces (a bare number means gold).
export function parseCoins(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return 0;
  if (/^[\d,.]+$/.test(t)) return Math.round(parseFloat(t.replace(/,/g, '')) * 100);
  return Math.round(parsePrice(t) * 100);
}
