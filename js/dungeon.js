// Dungeons and lairs: a keyed, room-by-room site with a history, monsters fitted to the party, traps scaled by tier,
// treasure, and a simple flowchart map. Everything here is original text; creature names come from the SRD.
import { makeRng } from './rng.js';
import { rollEncounter, encounterLine } from './encounters.js';
import { randomItem } from './magic-items.js';

export const THEMES = {
  crypt: { label: 'Crypt or tomb', terrain: ['underdark', 'urban'], types: ['undead', 'construct'], builders: ['a noble house', 'a forgotten priesthood', 'a warlord’s grieving heirs'], purpose: 'to keep the dead at rest',
    rooms: ['Ossuary', 'Mourners’ hall', 'Embalming room', 'Sealed vault', 'Collapsed catacomb', 'Chapel of the dead', 'Gallery of effigies', 'Bone pit', 'Offering chamber', 'Guardian’s niche'] },
  bandits: { label: 'Bandit hideout', terrain: ['forest', 'hill'], types: ['humanoid', 'beast'], builders: ['smugglers', 'a deserted garrison', 'miners who struck nothing'], purpose: 'to hide goods and people from the law',
    rooms: ['Lookout post', 'Bunk room', 'Stolen-goods store', 'Mess hall', 'Captain’s quarters', 'Kennels', 'Prisoner pen', 'Hidden escape tunnel', 'Gambling den', 'Armory'] },
  temple: { label: 'Ruined temple', terrain: ['underdark', 'forest', 'desert'], types: ['undead', 'fiend', 'humanoid', 'monstrosity'], builders: ['a faith that fell from favor', 'a cult that called itself holy', 'pilgrims of a vanished god'], purpose: 'to worship something best left alone',
    rooms: ['Narthex', 'Nave of broken pews', 'Reliquary', 'Baptismal pool', 'Priests’ cells', 'Scriptorium', 'Bell tower stair', 'Inner sanctum', 'Crypt of the faithful', 'Sacrificial altar'] },
  warren: { label: 'Goblin or kobold warren', terrain: ['hill', 'underdark', 'forest'], types: ['humanoid', 'beast'], builders: ['dwarven prospectors', 'a burrowing beast', 'the warren’s own diggers'], purpose: 'to raid the farms below',
    rooms: ['Twisting entry tunnel', 'Trap-strewn crawlway', 'Fungus garden', 'Chieftain’s throne cave', 'Wolf pens', 'Midden', 'Shaman’s grotto', 'Hoard heap', 'Nursery cave', 'Watch ledge'] },
  tower: { label: 'Wizard’s tower', terrain: ['urban', 'underdark'], types: ['construct', 'elemental', 'fiend', 'humanoid'], builders: ['an ambitious wizard', 'a school of mages', 'a court enchanter'], purpose: 'to study what no college would allow',
    rooms: ['Warded foyer', 'Library', 'Alchemy lab', 'Summoning circle', 'Observatory', 'Menagerie', 'Apprentices’ quarters', 'Vault of curios', 'Scrying room', 'Master’s study'] },
  shrine: { label: 'Sunken shrine', terrain: ['coast', 'underwater', 'swamp'], types: ['humanoid', 'aberration', 'beast', 'undead'], builders: ['a sea-faring people', 'a drowned city’s priests', 'a coastal cult'], purpose: 'to bargain with the tides',
    rooms: ['Tidal entrance', 'Flooded hall', 'Coral-choked shrine', 'Air pocket', 'Pearl vault', 'Eel-infested cistern', 'Offering pool', 'Sea-gate', 'Barnacled stair', 'Drowned library'] },
  mine: { label: 'Abandoned mine', terrain: ['underdark', 'mountain'], types: ['monstrosity', 'ooze', 'undead', 'humanoid'], builders: ['a mining guild', 'dwarf clans', 'convict laborers'], purpose: 'to dig out a rich seam',
    rooms: ['Mine head', 'Cart tracks', 'Collapsed gallery', 'Foreman’s office', 'Flooded shaft', 'Crystal grotto', 'Ore crusher', 'Powder store', 'Deep seam', 'Strange chamber they broke into'] },
  lair: { label: 'Monster lair', terrain: ['mountain', 'forest', 'swamp', 'underdark'], types: ['dragon', 'monstrosity', 'giant', 'beast'], builders: ['no one: it formed naturally', 'an ancient people', 'the creature itself'], purpose: 'to shelter something big and hungry',
    rooms: ['Cave mouth', 'Bone-littered tunnel', 'Echoing gallery', 'Nest', 'Underground stream', 'Hoard cavern', 'Narrow squeeze', 'Sunlit sinkhole', 'Old campsite of a failed party', 'Deep pool'] },
  sewer: { label: 'Sewers and cellars', terrain: ['urban', 'underdark'], types: ['beast', 'ooze', 'humanoid', 'monstrosity'], builders: ['the city’s first engineers', 'a smugglers’ ring', 'an older city buried below this one'], purpose: 'to carry away what the city above wants forgotten',
    rooms: ['Grated outflow', 'Main channel', 'Sluice room', 'Thieves’ cache', 'Collapsed cellar', 'Old cistern', 'Rat king’s nest', 'Forgotten street below the street', 'Pump chamber', 'Secret meeting room'] },
};

const AFTER = ['war swept through and it was abandoned', 'a plague emptied it in a single season', 'its builders sealed it and fled', 'something woke in the deepest room', 'an earthquake split it open',
  'its last keeper died and no one came to replace them', 'thieves broke in and never left', 'a curse fell on it', 'the river shifted and half of it flooded', 'it was forgotten as the town above grew'];
const NOW = ['now {foe} have made it their home', 'now {foe} guard it for a new master', 'now {foe} squat in its ruins', 'now {foe} hunt in its halls', 'now {foe} search it for something'];
const NAME_A = ['Hollow', 'Sunken', 'Black', 'Silent', 'Broken', 'Drowned', 'Ashen', 'Weeping', 'Hidden', 'Crooked', 'Gilded', 'Forsaken', 'Thorned', 'Pale'];
const NAME_B = { crypt: ['Tomb', 'Crypt', 'Barrow', 'Ossuary'], bandits: ['Den', 'Hideout', 'Hold', 'Camp'], temple: ['Temple', 'Fane', 'Sanctum', 'Chapel'], warren: ['Warren', 'Burrows', 'Delve', 'Holes'],
  tower: ['Tower', 'Spire', 'Observatory', 'Athenaeum'], shrine: ['Shrine', 'Grotto', 'Sea-Hall', 'Reef Temple'], mine: ['Mine', 'Delving', 'Shafts', 'Dig'], lair: ['Lair', 'Caves', 'Hollow', 'Nest'], sewer: ['Sewers', 'Undercroft', 'Cisterns', 'Drains'] };
const SIZES = ['cramped (10 by 10 feet)', 'small (15 by 20 feet)', 'modest (20 by 30 feet)', 'long (15 by 40 feet)', 'wide (30 by 30 feet)', 'large (40 by 50 feet)', 'vast (60 feet across, ceiling lost in shadow)'];
const SENSES = ['Water drips somewhere out of sight.', 'The air is stale and smells of old smoke.', 'A cold draft comes from a crack in the far wall.', 'Every footstep echoes too long.',
  'Faint scratching sounds come from behind the walls.', 'The floor is slick with something that isn’t water.', 'Moss glows a dim green along the ceiling.', 'It’s warmer here than it should be.',
  'Old scorch marks streak the stone.', 'A sweet, rotten smell hangs in the air.', 'Dust lies thick and undisturbed, except for one set of tracks.', 'Faded murals cover the walls.'];
const FEATURES = ['a toppled statue whose face has been chiseled away', 'a dry fountain choked with coins of a forgotten kingdom', 'rows of empty iron cages', 'a great rusted chain hanging from the ceiling',
  'a mosaic floor showing a map of somewhere else', 'a ring of melted candles around a chalk circle', 'a rotted wooden bridge over a dark pit', 'a wall of niches, each holding a clay jar',
  'a carved door with no handle', 'a pool of perfectly still black water', 'shelves of crumbling books', 'a heap of broken weapons from an old battle', 'a narrow balcony overlooking the room below',
  'a pair of great bronze doors, one ajar', 'a collapsed section of ceiling and a shaft of daylight', 'an altar stained dark'];
const PUZZLES = ['Four levers, and a rhyme on the wall that says which order opens the door.', 'A floor of lettered tiles: only the ones spelling the builder’s name are safe.',
  'A statue holds out empty hands; it opens the way when given something it once owned.', 'Three doors, each with a guardian face; one always lies, one always tells the truth, one is silent.',
  'A pool reflects a different room; whatever is placed in the reflection appears in the real one.', 'Constellations on the ceiling; pressing the right stars on the wall unlocks a hidden stair.',
  'A locked door with a lock shaped like a key-holder’s hand, and a skeletal hand nearby that fits.', 'Scales that must balance a sacrifice against a coin, a feather or a heart-shaped stone.'];
const TRAPS = [
  ['Hidden pit', 'a false flagstone', 'a creature falls in and takes {dmg} bludgeoning damage', 'Dexterity'],
  ['Poison needle', 'opening a lock or a chest', 'a needle deals {small} piercing damage and the target must make a DC {dc} Constitution save or be Poisoned for 1 hour', 'Constitution'],
  ['Swinging blade', 'a tripwire across the doorway', 'a blade sweeps the passage: {dmg} slashing damage', 'Dexterity'],
  ['Collapsing ceiling', 'pulling a support beam or a loud noise', 'stone falls on the room: {dmg} bludgeoning damage, half on a success', 'Dexterity'],
  ['Fire glyph', 'touching or reading the carved symbol', 'flames burst out in a 10-foot radius: {dmg} fire damage, half on a success', 'Dexterity'],
  ['Poison gas', 'the door closing behind the party', 'the room fills with gas; each creature takes {dmg} poison damage, half on a success', 'Constitution'],
  ['Rolling sphere', 'a pressure plate at the end of the hall', 'a stone sphere rolls down the corridor: {dmg} bludgeoning damage and knocked Prone on a failure', 'Dexterity'],
  ['Arrow volley', 'a loose tile', 'darts fire from the walls: {small} piercing damage', 'Dexterity'],
  ['Falling net', 'stepping past the archway', 'a weighted net drops; a failed save means Restrained until a creature uses an action to escape (DC {dc} Strength or Dexterity)', 'Dexterity'],
  ['Flooding room', 'lifting the idol from its plinth', 'the doors seal and water fills the room over 4 rounds; the walls hide a release lever (DC {dc} Investigation)', 'Strength'],
];
const TIERS = [{ dc: 12, dmg: '2d10', small: '1d10', rarities: ['c', 'u'], coins: [30, 150] }, { dc: 14, dmg: '4d10', small: '2d10', rarities: ['u', 'r'], coins: [200, 1200] },
  { dc: 16, dmg: '10d10', small: '4d10', rarities: ['r', 'v'], coins: [1500, 8000] }, { dc: 18, dmg: '18d10', small: '10d10', rarities: ['v', 'l'], coins: [8000, 40000] }];
const tierOf = (level) => (level <= 4 ? 0 : level <= 10 ? 1 : level <= 16 ? 2 : 3);
const CONTAINERS = ['in an iron-bound chest', 'under a loose flagstone', 'in a rotted sack', 'on a corpse in a corner', 'in a hollow statue', 'scattered across the floor', 'in a locked strongbox', 'in a niche behind a tapestry'];
const EMPTY = ['Nothing lives here now, but something left in a hurry.', 'A quiet room: a good place to take a short rest, if the party bars the door.', 'Signs of an old fight, and nothing else.', 'Empty, apart from a scrawled warning on the wall.'];

// Room roles for a classic five-room shape, then a mix for bigger sites.
function roles(n, rng) {
  const base = ['guardian', 'puzzle', 'trap', 'boss', 'reward'];
  if (n <= 5) return base.slice(0, n);
  const mid = [];
  for (let i = 0; i < n - 3; i++) mid.push(rng.pickW({ fight: 3, trap: 2, empty: 2, treasure: 1.5, puzzle: 1, feature: 1.5 }));
  return ['guardian', ...mid, 'boss', 'reward'].slice(0, n);
}

function trap(rng, tier) {
  const [name, trigger, effect, save] = rng.pick(TRAPS);
  const t = TIERS[tier];
  const text = effect.replace('{dmg}', t.dmg).replace('{small}', t.small).replace(/\{dc\}/g, t.dc);
  return { name, line: `${name}: triggered by ${trigger}; ${text}${/save|DC/.test(effect) ? '' : ` (DC ${t.dc} ${save} save)`}. Spotted with a DC ${t.dc} Perception check; disarmed with DC ${t.dc} Thieves’ Tools or Sleight of Hand.` };
}

function treasure(rng, tier, big) {
  const t = TIERS[tier];
  const gp = Math.round((t.coins[0] + rng.next() * (t.coins[1] - t.coins[0])) * (big ? 3 : 1) / 10) * 10;
  const items = [];
  const n = big ? 1 + rng.int(2) : rng.chance(0.35) ? 1 : 0;
  for (let i = 0; i < n; i++) { const it = randomItem(rng, { rarity: rng.pick(t.rarities), cursed: rng.chance(0.12) ? true : undefined }); if (it) items.push(it); }
  return { gp, items, line: `${gp.toLocaleString('en-US')} gp in mixed coin ${rng.pick(CONTAINERS)}${items.length ? `; also ${items.map((i) => `${i.name}${i.cursed ? ' (cursed)' : ''}`).join(', ')}` : ''}.` };
}

export function generateDungeon({ theme = 'crypt', rooms = 8, level = 3, size = 4, seed = String(Math.random()) } = {}) {
  const rng = makeRng(seed);
  const th = THEMES[theme] || THEMES.crypt;
  const tier = tierOf(level);
  const name = `The ${rng.pick(NAME_A)} ${rng.pick(NAME_B[theme] || NAME_B.crypt)}`;
  const enc = (difficulty, i) => rollEncounter({ terrain: th.terrain, types: th.types, level, size, difficulty, seed: `${seed}:enc:${i}` });
  const bossEnc = enc('High', 'boss');
  const foe = bossEnc ? bossEnc.groups.map((g) => (g.count > 1 ? `${g.name.toLowerCase()}s` : `a ${g.name.toLowerCase()}`)).join(' and ') : 'scavengers';
  const history = `Built by ${rng.pick(th.builders)} ${th.purpose}. Then ${rng.pick(AFTER)}; ${rng.pick(NOW).replace('{foe}', foe)}.`;
  const names = rng.shuffle(th.rooms), senses = rng.shuffle(SENSES), features = rng.shuffle(FEATURES);
  const list = [];
  const plan = roles(Math.max(3, Math.min(14, rooms)), rng);
  plan.forEach((role, i) => {
    const r = { n: i + 1, role, name: names[i % names.length], size: rng.pick(SIZES), sense: senses[i % senses.length], feature: features[i % features.length], lines: [] };
    if (role === 'guardian' || role === 'fight') { const e = enc(role === 'guardian' ? 'Low' : rng.pick(['Low', 'Moderate', 'Moderate']), i); if (e) { r.encounter = e; r.lines.push(`Creatures: ${encounterLine(e)}.`); } }
    if (role === 'boss') { r.encounter = bossEnc; r.name = rng.pick(['Heart of the', 'Throne room of the', 'Deepest hall of the']) + ' ' + name.replace(/^The /, ''); if (bossEnc) r.lines.push(`Creatures: ${encounterLine(bossEnc)}. This is the site’s master: fight, bargain or sneak past.`); }
    if (role === 'trap') { r.trap = trap(rng, tier); r.lines.push(`Trap — ${r.trap.line}`); }
    if (role === 'puzzle') r.lines.push(`Puzzle: ${rng.pick(PUZZLES)}`);
    if (role === 'treasure' || role === 'reward') { r.treasure = treasure(rng, tier, role === 'reward'); r.lines.push(`Treasure: ${r.treasure.line}`); }
    if (role === 'reward' && rng.chance(0.5)) r.lines.push(`Twist: ${rng.pick(['the treasure is bait, and the real prize is a map to somewhere deeper', 'a prisoner is chained here and begs for help', 'a rival party arrives just as the chest opens', 'the vault’s true owner is still alive, and wants it back', 'the walls begin to close: the site is collapsing'])}.`);
    if (role === 'empty') r.lines.push(rng.pick(EMPTY));
    if (role === 'feature') r.lines.push(`Something to explore: ${r.feature}, hiding ${rng.pick(['a secret door', 'a clue to the puzzle ahead', 'a minor magic item', 'the diary of a previous explorer', 'nothing at all, but it looks important'])}.`);
    if (rng.chance(0.25) && role !== 'trap' && role !== 'boss') { r.trap = trap(rng, tier); r.lines.push(`Also a trap — ${r.trap.line}`); }
    list.push(r);
  });
  // Connections: a main path from the entrance to the boss and reward, with side rooms branching off it.
  const main = [0];
  for (let i = 1; i < list.length; i++) if (['boss', 'reward', 'guardian'].includes(list[i].role) || rng.chance(0.55)) main.push(i);
  const links = [];
  for (let i = 1; i < main.length; i++) links.push([main[i - 1], main[i]]);
  for (let i = 1; i < list.length; i++) if (!main.includes(i)) links.push([[...main].reverse().find((m) => m < i) ?? 0, i]);
  if (list.length > 6 && rng.chance(0.6)) { const a = rng.int(list.length - 2) + 1; const b = Math.min(list.length - 1, a + 2); if (!links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) links.push([a, b, 'secret']); }
  const exitsOf = (i) => links.filter(([a, b]) => a === i || b === i).map(([a, b, kind]) => ({ to: a === i ? b : a, kind }));
  for (let i = 0; i < list.length; i++) {
    const ex = exitsOf(i);
    list[i].exits = ex.map((x) => `${x.kind === 'secret' ? 'a secret door' : rng.pick(['a door', 'an archway', 'a passage', 'a stair', 'a narrow crawl'])} to ${x.to + 1}`);
  }
  // Layout for the map: the main path snakes across a grid; side rooms sit next to their parent.
  const pos = new Map(); const taken = new Set(); const key = (x, y) => `${x},${y}`;
  let x = 0, y = 0, dir = 1;
  for (const i of main) { pos.set(i, [x, y]); taken.add(key(x, y)); x += dir; if (x > 3 || x < 0) { dir = -dir; x += dir; y += 1; } }
  for (let i = 0; i < list.length; i++) {
    if (pos.has(i)) continue;
    const parent = links.find(([a, b]) => b === i)?.[0] ?? 0;
    const [px, py] = pos.get(parent) || [0, 0];
    // The nearest free cell to its parent, searching outward ring by ring.
    let spot = null;
    for (let r = 1; !spot; r++) {
      for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || py + dy < 0 || taken.has(key(px + dx, py + dy))) continue;
        spot = [px + dx, py + dy];
      }
    }
    pos.set(i, spot); taken.add(key(...spot));
  }
  return { seed, theme, label: th.label, name, level, size, history, rooms: list, links, pos: list.map((_, i) => pos.get(i)), tier };
}

export function dungeonText(d) {
  const L = [`${d.name} (${d.label.toLowerCase()}, for a level ${d.level} party of ${d.size})`, '', d.history, ''];
  for (const r of d.rooms) {
    L.push(`${r.n}. ${r.name}`, `A ${r.size} room. ${r.sense} There is ${r.feature}.`, ...r.lines, `Exits: ${r.exits.join(', ') || 'none'}.`, '');
  }
  return L.join('\n');
}

// A flowchart map of the rooms as SVG (also drawn onto a canvas to save as a world map).
export function dungeonSvg(d, { cell = 150, pad = 40 } = {}) {
  const xs = d.pos.map((p) => p[0]), ys = d.pos.map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const W = (Math.max(...xs) - minX + 1) * cell + pad * 2, H = (Math.max(...ys) - minY + 1) * cell + pad * 2;
  const c = (i) => [pad + (d.pos[i][0] - minX) * cell + cell / 2, pad + (d.pos[i][1] - minY) * cell + cell / 2];
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const lines = d.links.map(([a, b, kind]) => { const [x1, y1] = c(a), [x2, y2] = c(b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5b4a32" stroke-width="${kind === 'secret' ? 3 : 10}" ${kind === 'secret' ? 'stroke-dasharray="8 8"' : ''} stroke-linecap="round"/>`; });
  const rooms = d.rooms.map((r, i) => {
    const [x, y] = c(i); const w = cell * 0.62, h = cell * 0.5;
    const fill = r.role === 'boss' ? '#b85c4a' : r.role === 'reward' || r.role === 'treasure' ? '#c9a34a' : r.trap ? '#8c7aa8' : '#d9cba8';
    return `<g><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="#3a2f20" stroke-width="3"/><text x="${x}" y="${y + 9}" font-family="Georgia, serif" font-size="28" font-weight="700" text-anchor="middle" fill="#1e1810">${r.n}</text><text x="${x}" y="${y + h / 2 + 20}" font-family="Georgia, serif" font-size="14" text-anchor="middle" fill="#3a2f20" stroke="#efe6cf" stroke-width="5" stroke-linejoin="round" paint-order="stroke">${esc(r.name.length > 22 ? `${r.name.slice(0, 21)}…` : r.name)}</text></g>`;
  });
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#efe6cf"/>${lines.join('')}${rooms.join('')}</svg>`, width: W, height: H,
    centers: d.rooms.map((_, i) => { const [x, y] = c(i); return [x / W, y / H]; }) };
}

