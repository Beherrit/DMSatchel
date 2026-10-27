// Random encounters, weather and travel. Creature names and challenge ratings come from the System Reference
// Documents (5.1 and 5.2, CC BY 4.0); the terrain lists, activities and weather tables are original to this app.
import { makeRng } from './rng.js';

export const TERRAINS = ['arctic', 'coast', 'desert', 'forest', 'grassland', 'hill', 'mountain', 'swamp', 'underdark', 'urban', 'underwater'];
export const TERRAIN_LABEL = { arctic: 'Arctic', coast: 'Coast', desert: 'Desert', forest: 'Forest', grassland: 'Grassland', hill: 'Hills', mountain: 'Mountains', swamp: 'Swamp', underdark: 'Underdark', urban: 'Urban', underwater: 'Underwater' };

const T = (s) => s.split(' ');
// [name, CR, type, terrains]
export const CREATURES = [
  // beasts
  ['Wolf', 0.25, 'beast', T('forest grassland hill')], ['Dire Wolf', 1, 'beast', T('forest hill')], ['Black Bear', 0.5, 'beast', T('forest')],
  ['Brown Bear', 1, 'beast', T('forest hill')], ['Polar Bear', 2, 'beast', T('arctic')], ['Boar', 0.25, 'beast', T('forest grassland')],
  ['Giant Boar', 2, 'beast', T('forest grassland')], ['Elk', 0.25, 'beast', T('forest grassland')], ['Giant Eagle', 1, 'beast', T('mountain hill coast')],
  ['Giant Spider', 1, 'beast', T('forest underdark swamp')], ['Giant Wolf Spider', 0.25, 'beast', T('forest desert hill underdark')],
  ['Swarm of Bats', 0.25, 'beast', T('underdark forest')], ['Swarm of Rats', 0.25, 'beast', T('urban underdark')], ['Swarm of Insects', 0.5, 'beast', T('swamp forest desert')],
  ['Giant Rat', 0.125, 'beast', T('urban underdark')], ['Crocodile', 0.5, 'beast', T('swamp coast')], ['Giant Crocodile', 5, 'beast', T('swamp')],
  ['Constrictor Snake', 0.25, 'beast', T('swamp forest')], ['Giant Constrictor Snake', 2, 'beast', T('swamp forest')], ['Poisonous Snake', 0.125, 'beast', T('desert swamp forest grassland')],
  ['Giant Poisonous Snake', 0.25, 'beast', T('desert swamp forest')], ['Giant Scorpion', 3, 'beast', T('desert')], ['Giant Lizard', 0.25, 'beast', T('desert underdark swamp')],
  ['Lion', 1, 'beast', T('grassland desert hill')], ['Tiger', 1, 'beast', T('forest grassland')], ['Panther', 0.25, 'beast', T('forest grassland hill')],
  ['Mammoth', 6, 'beast', T('arctic')], ['Elephant', 4, 'beast', T('grassland')], ['Rhinoceros', 2, 'beast', T('grassland')],
  ['Saber-Toothed Tiger', 2, 'beast', T('arctic mountain')], ['Giant Goat', 0.5, 'beast', T('mountain hill')], ['Giant Shark', 5, 'beast', T('underwater coast')],
  ['Hunter Shark', 2, 'beast', T('underwater coast')], ['Reef Shark', 0.5, 'beast', T('underwater coast')], ['Killer Whale', 3, 'beast', T('underwater arctic')],
  ['Giant Octopus', 1, 'beast', T('underwater coast')], ['Giant Crab', 0.125, 'beast', T('coast')], ['Giant Vulture', 1, 'beast', T('desert grassland')],
  ['Giant Hyena', 1, 'beast', T('grassland desert')], ['Hyena', 0, 'beast', T('grassland desert')], ['Ape', 0.5, 'beast', T('forest')], ['Giant Ape', 7, 'beast', T('forest mountain')],
  ['Giant Toad', 1, 'beast', T('swamp')], ['Giant Frog', 0.25, 'beast', T('swamp')], ['Mastiff', 0.125, 'beast', T('urban')], ['Giant Owl', 0.25, 'beast', T('forest arctic')],
  ['Giant Badger', 0.25, 'beast', T('forest grassland')], ['Cave Bear', 2, 'beast', T('arctic underdark mountain')], ['Giant Elk', 2, 'beast', T('forest grassland hill')],
  ['Swarm of Quippers', 1, 'beast', T('underwater swamp')], ['Plesiosaurus', 2, 'beast', T('underwater coast')], ['Tyrannosaurus Rex', 8, 'beast', T('grassland forest')],
  ['Triceratops', 5, 'beast', T('grassland')], ['Allosaurus', 2, 'beast', T('grassland')], ['Giant Wasp', 0.5, 'beast', T('forest grassland')], ['Giant Centipede', 0.25, 'beast', T('underdark desert urban')],
  // people
  ['Bandit', 0.125, 'humanoid', T('forest grassland hill urban desert coast')], ['Bandit Captain', 2, 'humanoid', T('forest grassland hill urban desert coast')],
  ['Thug', 0.5, 'humanoid', T('urban')], ['Spy', 1, 'humanoid', T('urban')], ['Guard', 0.125, 'humanoid', T('urban')], ['Veteran', 3, 'humanoid', T('urban grassland hill')],
  ['Knight', 3, 'humanoid', T('urban grassland')], ['Mage', 6, 'humanoid', T('urban')], ['Priest', 2, 'humanoid', T('urban')], ['Acolyte', 0.25, 'humanoid', T('urban')],
  ['Cultist', 0.125, 'humanoid', T('urban underdark swamp forest')], ['Cult Fanatic', 2, 'humanoid', T('urban underdark swamp forest')], ['Scout', 0.5, 'humanoid', T('forest hill mountain grassland arctic')],
  ['Berserker', 2, 'humanoid', T('arctic hill mountain forest')], ['Druid', 2, 'humanoid', T('forest swamp')], ['Gladiator', 5, 'humanoid', T('urban')], ['Assassin', 8, 'humanoid', T('urban')],
  ['Noble', 0.125, 'humanoid', T('urban')], ['Tribal Warrior', 0.125, 'humanoid', T('arctic desert forest grassland hill mountain swamp coast')],
  ['Goblin', 0.25, 'humanoid', T('forest hill grassland underdark')], ['Hobgoblin', 0.5, 'humanoid', T('forest hill grassland mountain')], ['Bugbear', 1, 'humanoid', T('forest hill underdark')],
  ['Orc', 0.5, 'humanoid', T('hill mountain grassland arctic forest')], ['Gnoll', 0.5, 'humanoid', T('grassland desert hill')], ['Kobold', 0.125, 'humanoid', T('hill mountain underdark forest')],
  ['Lizardfolk', 0.5, 'humanoid', T('swamp coast')], ['Sahuagin', 0.5, 'humanoid', T('underwater coast')], ['Merfolk', 0.125, 'humanoid', T('underwater coast')],
  ['Troglodyte', 0.25, 'humanoid', T('underdark')], ['Duergar', 1, 'humanoid', T('underdark')], ['Drow', 0.25, 'humanoid', T('underdark')], ['Gnoll Pack Lord', 2, 'humanoid', T('grassland desert')],
  ['Hobgoblin Captain', 3, 'humanoid', T('hill grassland mountain')], ['Goblin Boss', 1, 'humanoid', T('forest hill underdark')], ['Orc War Chief', 4, 'humanoid', T('hill mountain arctic')],
  ['Wererat', 2, 'humanoid', T('urban underdark')], ['Werewolf', 3, 'humanoid', T('forest hill')], ['Wereboar', 4, 'humanoid', T('forest grassland')], ['Weretiger', 4, 'humanoid', T('forest grassland')], ['Werebear', 5, 'humanoid', T('forest arctic')],
  // undead
  ['Skeleton', 0.25, 'undead', T('underdark urban desert swamp')], ['Zombie', 0.25, 'undead', T('swamp urban underdark')], ['Ghoul', 1, 'undead', T('swamp urban underdark')],
  ['Ghast', 2, 'undead', T('swamp urban underdark')], ['Shadow', 0.5, 'undead', T('underdark urban')], ['Specter', 1, 'undead', T('underdark urban')], ['Wight', 3, 'undead', T('hill swamp arctic underdark')],
  ['Wraith', 5, 'undead', T('underdark urban swamp')], ['Mummy', 3, 'undead', T('desert')], ['Mummy Lord', 15, 'undead', T('desert')], ['Vampire Spawn', 5, 'undead', T('urban')],
  ['Vampire', 13, 'undead', T('urban')], ['Banshee', 4, 'undead', T('forest swamp')], ['Ghost', 4, 'undead', T('urban swamp')], ['Will-o’-Wisp', 2, 'undead', T('swamp forest')],
  ['Ogre Zombie', 2, 'undead', T('hill swamp')], ['Minotaur Skeleton', 2, 'undead', T('underdark')], ['Lich', 21, 'undead', T('underdark urban')],
  // giants and monstrosities
  ['Ogre', 2, 'giant', T('hill mountain forest swamp grassland')], ['Hill Giant', 5, 'giant', T('hill grassland')], ['Stone Giant', 7, 'giant', T('mountain hill underdark')],
  ['Frost Giant', 8, 'giant', T('arctic mountain')], ['Fire Giant', 9, 'giant', T('mountain underdark')], ['Cloud Giant', 9, 'giant', T('mountain')], ['Storm Giant', 13, 'giant', T('coast underwater mountain')],
  ['Ettin', 4, 'giant', T('hill mountain underdark')], ['Troll', 5, 'giant', T('forest hill mountain swamp arctic')], ['Owlbear', 3, 'monstrosity', T('forest')], ['Griffon', 2, 'monstrosity', T('hill mountain grassland')],
  ['Hippogriff', 1, 'monstrosity', T('hill mountain grassland')], ['Manticore', 3, 'monstrosity', T('hill mountain desert')], ['Chimera', 6, 'monstrosity', T('hill mountain grassland')],
  ['Basilisk', 3, 'monstrosity', T('mountain underdark desert')], ['Cockatrice', 0.5, 'monstrosity', T('grassland desert')], ['Gorgon', 5, 'monstrosity', T('grassland hill')],
  ['Medusa', 6, 'monstrosity', T('desert hill')], ['Harpy', 1, 'monstrosity', T('coast hill mountain')], ['Hydra', 8, 'monstrosity', T('swamp coast')], ['Roc', 11, 'monstrosity', T('mountain coast desert')],
  ['Purple Worm', 15, 'monstrosity', T('underdark desert')], ['Remorhaz', 11, 'monstrosity', T('arctic')], ['Bulette', 5, 'monstrosity', T('grassland hill')], ['Ankheg', 2, 'monstrosity', T('grassland forest')],
  ['Carrion Crawler', 2, 'monstrosity', T('underdark urban')], ['Mimic', 2, 'monstrosity', T('underdark urban')], ['Grick', 2, 'monstrosity', T('underdark forest')],
  ['Umber Hulk', 5, 'monstrosity', T('underdark')], ['Phase Spider', 3, 'monstrosity', T('forest underdark')], ['Ettercap', 2, 'monstrosity', T('forest')], ['Worg', 0.5, 'monstrosity', T('forest hill grassland')],
  ['Winter Wolf', 3, 'monstrosity', T('arctic')], ['Darkmantle', 0.5, 'monstrosity', T('underdark')], ['Rust Monster', 0.5, 'monstrosity', T('underdark')], ['Lamia', 4, 'monstrosity', T('desert')],
  ['Minotaur', 3, 'monstrosity', T('underdark hill')], ['Doppelganger', 3, 'monstrosity', T('urban')], ['Merrow', 2, 'monstrosity', T('underwater coast')], ['Kraken', 23, 'monstrosity', T('underwater')],
  ['Behir', 11, 'monstrosity', T('underdark mountain')], ['Drider', 6, 'monstrosity', T('underdark')], ['Wyvern', 6, 'dragon', T('hill mountain')],
  // oozes, aberrations, plants, fey, fiends, elementals, constructs
  ['Gelatinous Cube', 2, 'ooze', T('underdark')], ['Black Pudding', 4, 'ooze', T('underdark')], ['Ochre Jelly', 2, 'ooze', T('underdark swamp')], ['Gray Ooze', 0.5, 'ooze', T('underdark swamp')],
  ['Otyugh', 5, 'aberration', T('underdark urban swamp')], ['Gibbering Mouther', 2, 'aberration', T('underdark')], ['Chuul', 4, 'aberration', T('underdark swamp underwater')],
  ['Cloaker', 8, 'aberration', T('underdark')], ['Aboleth', 10, 'aberration', T('underdark underwater')], ['Roper', 5, 'monstrosity', T('underdark')],
  ['Shambling Mound', 5, 'plant', T('swamp forest')], ['Treant', 9, 'plant', T('forest')], ['Awakened Tree', 2, 'plant', T('forest')], ['Twig Blight', 0.125, 'plant', T('forest')],
  ['Dryad', 1, 'fey', T('forest')], ['Satyr', 0.5, 'fey', T('forest grassland')], ['Pixie', 0.25, 'fey', T('forest')], ['Sprite', 0.25, 'fey', T('forest swamp')], ['Green Hag', 3, 'fey', T('forest swamp')],
  ['Sea Hag', 2, 'fey', T('coast underwater')], ['Night Hag', 5, 'fiend', T('swamp urban')], ['Blink Dog', 0.25, 'fey', T('forest grassland')], ['Unicorn', 5, 'celestial', T('forest')], ['Pegasus', 2, 'celestial', T('grassland hill mountain')],
  ['Centaur', 2, 'monstrosity', T('forest grassland')], ['Imp', 1, 'fiend', T('urban underdark')], ['Quasit', 1, 'fiend', T('urban underdark swamp')], ['Hell Hound', 3, 'fiend', T('underdark mountain')],
  ['Nightmare', 3, 'fiend', T('grassland underdark')], ['Bearded Devil', 3, 'fiend', T('underdark')], ['Barbed Devil', 5, 'fiend', T('underdark')], ['Vrock', 6, 'fiend', T('underdark swamp')],
  ['Hezrou', 8, 'fiend', T('underdark swamp')], ['Glabrezu', 9, 'fiend', T('underdark')], ['Succubus', 4, 'fiend', T('urban')], ['Balor', 19, 'fiend', T('underdark')],
  ['Ice Mephit', 0.5, 'elemental', T('arctic mountain')], ['Dust Mephit', 0.5, 'elemental', T('desert')], ['Magma Mephit', 0.5, 'elemental', T('mountain underdark')], ['Mud Mephit', 0.25, 'elemental', T('swamp')],
  ['Steam Mephit', 0.25, 'elemental', T('swamp coast')], ['Fire Elemental', 5, 'elemental', T('desert mountain')], ['Earth Elemental', 5, 'elemental', T('mountain underdark')],
  ['Air Elemental', 5, 'elemental', T('mountain desert coast')], ['Water Elemental', 5, 'elemental', T('underwater coast swamp')], ['Salamander', 5, 'elemental', T('desert mountain underdark')],
  ['Xorn', 5, 'elemental', T('underdark')], ['Djinni', 11, 'elemental', T('desert')], ['Efreeti', 11, 'elemental', T('desert')], ['Gargoyle', 2, 'elemental', T('urban mountain')],
  ['Animated Armor', 1, 'construct', T('urban underdark')], ['Flying Sword', 0.25, 'construct', T('urban underdark')], ['Rug of Smothering', 2, 'construct', T('urban')],
  ['Flesh Golem', 5, 'construct', T('urban underdark')], ['Stone Golem', 10, 'construct', T('underdark urban')], ['Iron Golem', 16, 'construct', T('underdark urban')],
  // dragons
  ['White Dragon Wyrmling', 2, 'dragon', T('arctic')], ['Black Dragon Wyrmling', 2, 'dragon', T('swamp')], ['Green Dragon Wyrmling', 2, 'dragon', T('forest')], ['Blue Dragon Wyrmling', 3, 'dragon', T('desert coast')],
  ['Red Dragon Wyrmling', 4, 'dragon', T('mountain hill')], ['Brass Dragon Wyrmling', 1, 'dragon', T('desert')], ['Copper Dragon Wyrmling', 1, 'dragon', T('hill')], ['Bronze Dragon Wyrmling', 2, 'dragon', T('coast')],
  ['Silver Dragon Wyrmling', 2, 'dragon', T('mountain arctic')], ['Gold Dragon Wyrmling', 3, 'dragon', T('grassland forest')], ['Young White Dragon', 6, 'dragon', T('arctic')], ['Young Black Dragon', 7, 'dragon', T('swamp')],
  ['Young Green Dragon', 8, 'dragon', T('forest')], ['Young Blue Dragon', 9, 'dragon', T('desert coast')], ['Young Red Dragon', 10, 'dragon', T('mountain hill')], ['Adult White Dragon', 13, 'dragon', T('arctic')],
  ['Adult Black Dragon', 14, 'dragon', T('swamp')], ['Adult Green Dragon', 15, 'dragon', T('forest')], ['Adult Blue Dragon', 16, 'dragon', T('desert coast')], ['Adult Red Dragon', 17, 'dragon', T('mountain hill')],
  ['Ancient Red Dragon', 24, 'dragon', T('mountain')],
].map(([name, cr, type, terrains]) => ({ name, cr, type, terrains }));

const XP = { 0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000 };
export const xpFor = (cr) => XP[cr] ?? 0;
export const crText = (cr) => ({ 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' })[cr] || String(cr);

// XP budget per character by level (2024 rules): low, moderate, high difficulty.
const BUDGET = [null, [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
export const DIFFICULTIES = ['Low', 'Moderate', 'High'];
export function budget(level, size, difficulty = 'Moderate') {
  const row = BUDGET[Math.max(1, Math.min(20, level))];
  return row[Math.max(0, DIFFICULTIES.indexOf(difficulty))] * Math.max(1, size);
}

// What an area's type or description says about its terrain.
const WORDS = [['arctic', /arctic|tundra|snow|ice|glacier|frozen|polar|frost/i], ['coast', /coast|shore|beach|island|sea|harbou?r|port|cliffs?|bay/i], ['desert', /desert|dune|waste|sand|badlands|arid/i],
  ['forest', /forest|wood|jungle|grove|thicket|weald/i], ['grassland', /plain|grass|steppe|prairie|meadow|farm|field|savann?a|valley|borderland/i], ['hill', /hills?|downs|moor|highland/i],
  ['mountain', /mountain|peak|crag|alp|range|volcan/i], ['swamp', /swamp|marsh|bog|fen|mire|bayou/i], ['underdark', /underdark|cave|cavern|tunnel|dungeon|ruin|crypt|mine|lair/i],
  ['urban', /city|town|village|district|street|urban|sewer|castle|temple|tavern|shop/i], ['underwater', /underwater|reef|deep sea|ocean floor|sunken/i]];
export function terrainsFor(...texts) {
  const s = texts.filter(Boolean).join(' ');
  const hit = WORDS.filter(([, re]) => re.test(s)).map(([t]) => t);
  return hit.length ? hit : ['grassland', 'forest', 'hill'];
}

const ACTIVITY = ['hunting for food', 'guarding a lair or a hoard', 'on the move, heading somewhere in a hurry', 'lying in ambush near the trail', 'fighting among themselves over spoils',
  'resting, and not expecting company', 'fleeing something worse', 'wounded and desperate', 'following the party’s trail', 'searching for something they lost', 'gathered around a strange find',
  'marking territory', 'stalking another creature', 'driven here by hunger or a hard season', 'bound to the place by an old command'];
const SIGNS = ['tracks in the mud, a few hours old', 'a half-eaten carcass', 'smoke rising beyond the next rise', 'an abandoned camp with the fire still warm', 'broken weapons and a torn banner',
  'scratches gouged into a tree or wall', 'an eerie silence where birds should be singing', 'a smell carried on the wind', 'distant howls or cries', 'a trail of dropped coins'];
const NON_COMBAT = ['A merchant caravan, nervous about the road ahead', 'Pilgrims walking to a distant shrine', 'A lost child, or someone pretending to be one', 'A hermit who knows the land and wants something for it',
  'A patrol asking travelers questions', 'A broken-down cart and a stubborn mule', 'A shrine to a forgotten god, recently tended', 'A rival adventuring party, friendly for now',
  'A storm that forces the party to shelter', 'A collapsed bridge or blocked pass', 'A hunter selling fresh meat and rumors', 'A battlefield, long cold, picked over by scavengers',
  'Refugees fleeing trouble somewhere nearby', 'A traveling performer with a cart full of oddities', 'Ruins that weren’t on any map'];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

// One combat encounter for the party, fitted to the XP budget. Returns {groups:[{name, cr, count}], xp, budget, activity, sign}.
export function rollEncounter({ terrain = ['forest'], level = 3, size = 4, difficulty = 'Moderate', seed } = {}) {
  const rng = makeRng(seed ?? Math.random().toString(36).slice(2)).next;
  const want = budget(level, size, difficulty);
  const terrains = Array.isArray(terrain) ? terrain : [terrain];
  const pool = CREATURES.filter((c) => c.terrains.some((t) => terrains.includes(t)) && xpFor(c.cr) <= want);
  if (!pool.length) return null;
  const tries = [];
  for (let i = 0; i < 40; i++) {
    const lead = pick(rng, pool);
    const groups = [{ ...lead, count: 1 }];
    let xp = xpFor(lead.cr);
    const shape = rng();
    if (shape < 0.45) {
      // A pack of the same creature.
      const n = Math.max(1, Math.min(8, Math.floor(want / xpFor(lead.cr))));
      groups[0].count = Math.max(1, Math.min(n, 1 + Math.floor(rng() * n)));
      xp = groups[0].count * xpFor(lead.cr);
    } else if (shape < 0.85) {
      // A leader with followers of the same type, weaker than the leader.
      const minions = pool.filter((c) => c.type === lead.type && c.cr < lead.cr && c.name !== lead.name);
      const m = minions.length ? pick(rng, minions) : null;
      if (m) {
        const n = Math.min(8, Math.floor((want - xp) / xpFor(m.cr)));
        if (n > 0) { const k = 1 + Math.floor(rng() * n); groups.push({ ...m, count: k }); xp += k * xpFor(m.cr); }
      }
    }
    if (xp <= want) tries.push({ groups, xp, fit: xp / want });
  }
  if (!tries.length) return null;
  // Prefer encounters that use most of the budget without going over.
  tries.sort((a, b) => Math.abs(0.85 - a.fit) - Math.abs(0.85 - b.fit));
  const best = tries[Math.floor(rng() * Math.min(3, tries.length))];
  return { groups: best.groups.map(({ name, cr, type, count }) => ({ name, cr, type, count })), xp: best.xp, budget: want, difficulty, activity: pick(rng, ACTIVITY), sign: pick(rng, SIGNS) };
}

export const encounterLine = (enc) => `${enc.groups.map((g) => `${g.count > 1 ? `${g.count} × ` : ''}${g.name} (CR ${crText(g.cr)})`).join(' and ')}, ${enc.activity}`;

// A d8 or d12 table for an area: mostly fights fitted to the party, with a few meetings and sights mixed in.
export function encounterTable({ terrain, level = 3, size = 4, dice = 12, seed = 'table' } = {}) {
  const rng = makeRng(seed).next;
  const rows = [];
  for (let i = 0; i < dice; i++) {
    const kind = i % 4 === 3 ? 'meeting' : 'combat';
    if (kind === 'meeting') { rows.push(pick(rng, NON_COMBAT)); continue; }
    const difficulty = i < dice / 3 ? 'Low' : i < (dice * 2) / 3 ? 'Moderate' : 'High';
    const enc = rollEncounter({ terrain, level, size, difficulty, seed: `${seed}:${i}` });
    rows.push(enc ? `${encounterLine(enc)} (${difficulty.toLowerCase()})` : pick(rng, NON_COMBAT));
  }
  return rows;
}

export const tableText = (rows) => rows.map((r, i) => `${i + 1}. ${r}`).join('\n');

export function meeting(seed) { return pick(makeRng(seed ?? Math.random().toString(36).slice(2)).next, NON_COMBAT); }

// ---- weather -------------------------------------------------------------------------------------

export const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'];
// Season from where a month falls in the year (the first month is midwinter).
export const seasonOf = (month, months) => SEASONS[Math.floor((((month + 0.5) / months) * 4 + 0.5) % 4)];

const TEMPS = {
  arctic: [-30, -10, 0, -15], desert: [10, 25, 40, 25], swamp: [5, 15, 28, 15], coast: [5, 12, 22, 14], underdark: [12, 12, 12, 12], underwater: [8, 10, 14, 10],
  default: [-2, 12, 24, 12],
};
export function rollWeather({ terrain = ['grassland'], season = 'Summer', seed } = {}) {
  const rng = makeRng(seed ?? Math.random().toString(36).slice(2)).next;
  const t = (Array.isArray(terrain) ? terrain : [terrain]).find((x) => TEMPS[x]) || 'default';
  if (t === 'underdark') return { temp: 'Cool and still, as always underground', sky: 'No sky', wind: 'None', rules: [], line: 'Underground: cool, still air. No weather, only the dark.' };
  const base = TEMPS[t][SEASONS.indexOf(season)] + Math.round((rng() - 0.5) * 14);
  const r = rng();
  const wet = t === 'desert' ? r < 0.08 : t === 'swamp' || t === 'coast' ? r < 0.45 : r < 0.3;
  const heavy = wet && rng() < 0.3;
  const windR = rng();
  const wind = windR < 0.55 ? 'Calm or light' : windR < 0.85 ? 'Moderate' : 'Strong';
  const cold = base <= -18, hot = base >= 38;
  const sky = wet ? (base <= 0 ? (heavy ? 'Heavy snow' : 'Light snow') : heavy ? 'Heavy rain' : 'Light rain') : pick(rng, ['Clear', 'Clear', 'Scattered clouds', 'Overcast', t === 'coast' || t === 'swamp' ? 'Fog' : 'Hazy']);
  const rules = [];
  if (cold) rules.push('Extreme cold: without cold-weather gear, a DC 10 Constitution save each hour or gain a level of Exhaustion.');
  if (hot) rules.push('Extreme heat: without water, a Constitution save each hour (DC 5, +1 per hour) or gain a level of Exhaustion; heavy armor gives disadvantage.');
  if (heavy) rules.push(`${base <= 0 ? 'Heavy snow' : 'Heavy rain'}: the area is lightly obscured; disadvantage on Perception checks that rely on sight or hearing; fires go out.`);
  if (wind === 'Strong') rules.push('Strong wind: disadvantage on ranged weapon attacks; open flames go out; flying creatures may have to land.');
  if (sky === 'Fog') rules.push('Fog: the area beyond 30 feet or so is heavily obscured.');
  const line = `${sky}, ${base}°C (${Math.round(base * 9 / 5 + 32)}°F), wind ${wind.toLowerCase()}.`;
  return { temp: base, sky, wind, rules, line };
}

// ---- travel --------------------------------------------------------------------------------------

// 2024 travel pace: miles per hour and per day (8 hours).
export const PACES = { Fast: { hour: 4, day: 30 }, Normal: { hour: 3, day: 24 }, Slow: { hour: 2, day: 18 } };
export function travel(miles, { difficult = false } = {}) {
  const f = difficult ? 0.5 : 1;
  return Object.fromEntries(Object.entries(PACES).map(([k, p]) => [k, { days: miles / (p.day * f), hours: miles / (p.hour * f) }]));
}
export function travelText(miles, opts) {
  const t = travel(miles, opts);
  const fmt = ({ days, hours }) => (hours < 8 ? `${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? '' : 's'}` : `${days < 10 ? days.toFixed(1).replace(/\.0$/, '') : Math.round(days)} days`);
  return `${Math.round(miles)} miles: ${Object.entries(t).map(([k, v]) => `${k.toLowerCase()} ${fmt(v)}`).join(', ')}${opts?.difficult ? ' (difficult terrain)' : ''}`;
}
