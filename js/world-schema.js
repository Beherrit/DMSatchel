// What the shared world can hold. Used by the browser and by the API (for validation).

// The Character Forge's numbers for a class from your library (see libraryClasses in library.js).
export const ARMOR_WORN = ['No armor', 'Leather', 'Studded leather', 'Leather and shield', 'Chain shirt and shield', 'Chain mail', 'Chain mail and shield', 'Unarmored (Dex + Con)', 'Unarmored (Dex + Wis)'];
export const CASTING = ['None', 'Full caster', 'Half caster', 'Third caster', 'Pact magic'];
export const SPELL_LISTS = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const CLASS_FIELDS = [['die', 'Hit die', 'select', ['d6', 'd8', 'd10', 'd12']], ['primary', 'Main ability', 'select', ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha']],
  ['saves', 'Saving throws'], ['skills', 'Skills to choose from'], ['skillCount', 'How many skills'], ['armorProf', 'Armor training'], ['weaponProf', 'Weapon proficiencies'],
  ['wears', 'Armor worn', 'select', ARMOR_WORN], ['weapon', 'Main weapon'], ['caster', 'Spellcasting', 'select', CASTING],
  ['spellAbility', 'Spellcasting ability', 'select', ['Int', 'Wis', 'Cha']], ['spellsLike', 'Spell list like', 'select', SPELL_LISTS], ['gear', 'Starting gear'], ['sublevel', 'Subclass at level']];

// Some fields only apply to some categories (a species's speed, a class's hit die): [key, label, type, options, {only}].
export const fieldApplies = (f, fields) => !f[4]?.only || f[4].only.includes(fields?.category);

export const DOWNTIME_ACTIVITIES = ['Training', 'Crafting', 'Carousing', 'Research', 'Working a job', 'Recuperating', 'Religious service', 'Building contacts',
  'Scheming', 'Crime', 'Pit fighting', 'Selling loot', 'Buying a magic item', 'Other'];

export const KINDS = {
  region: {
    label: 'Region', plural: 'Regions', blurb: 'Kingdoms, provinces, wilds and seas.',
    fields: [['ruler', 'Ruled by'], ['climate', 'Climate & terrain'], ['population', 'Peoples'], ['resources', 'Known for', 'long'], ['dangers', 'Dangers', 'long'], ['encounters', 'Encounter table', 'long']],
  },
  area: {
    label: 'Area', plural: 'Areas & Districts', blurb: 'Forests, valleys, coasts, city districts and wild lands inside a region.',
    fields: [['type', 'Type', 'select', ['Forest', 'Hills', 'Mountains', 'Valley', 'Coast', 'Island', 'Swamp', 'Desert', 'Plains', 'Underdark', 'City district', 'Borderland', 'Other']], ['terrain', 'Terrain & climate'], ['controlled_by', 'Controlled by'], ['features', 'Notable features', 'long'], ['dangers', 'Dangers & encounters', 'long'], ['resources', 'Resources', 'long'], ['encounters', 'Encounter table', 'long']],
  },
  settlement: {
    label: 'Settlement', plural: 'Settlements', blurb: 'Cities, towns, villages and outposts.',
    fields: [['size', 'Size', 'select', ['Hamlet', 'Village', 'Town', 'City', 'Metropolis', 'Fortress', 'Outpost']], ['population', 'Population'], ['ruler', 'Led by'], ['government', 'Government'], ['known_for', 'Known for', 'long'], ['trouble', 'Current trouble', 'long'], ['landmarks', 'Landmarks', 'long'], ['economy', 'Trade & economy', 'long'], ['defenses', 'Defenses', 'long'], ['peoples', 'Peoples & culture', 'long'], ['market', 'Market conditions', 'long'], ['encounters', 'Encounter table', 'long']],
  },
  location: {
    label: 'Location', plural: 'Locations', blurb: 'Dungeons, ruins, taverns, shops and landmarks.',
    fields: [['type', 'Type', 'select', ['Dungeon', 'Ruin', 'Tavern', 'Shop', 'Temple', 'Landmark', 'Lair', 'Castle', 'Wilderness', 'Room', 'Other']], ['owner', 'Owner or occupant'], ['shop_type', 'Shop type'], ['features', 'Notable features', 'long'], ['dangers', 'Dangers', 'long'], ['treasure', 'Treasure', 'long'], ['stock', 'Stock & prices', 'long'], ['encounters', 'Encounter table', 'long']],
  },
  faction: {
    label: 'Faction', plural: 'Factions', blurb: 'Political powers, cults, armies and secret societies.',
    fields: [['type', 'Type', 'select', ['Political', 'Military', 'Religious', 'Criminal', 'Mercantile', 'Arcane', 'Secret society', 'Rebel', 'Noble house', 'Other']], ['leader', 'Leader'], ['headquarters', 'Headquarters'], ['alignment', 'Outlook'], ['goals', 'Goals', 'long'], ['methods', 'Methods', 'long'], ['resources', 'Resources', 'long'], ['symbol', 'Symbol'], ['motto', 'Motto'], ['ranks', 'Ranks', 'long'], ['joining', 'How to join', 'long']],
  },
  guild: {
    label: 'Guild', plural: 'Guilds', blurb: 'Trades, crafts and professional brotherhoods.',
    fields: [['trade', 'Trade'], ['leader', 'Guildmaster'], ['hall', 'Guildhall'], ['services', 'Services offered', 'long'], ['dues', 'Dues & benefits', 'long'], ['ranks', 'Ranks', 'long'], ['symbol', 'Mark or sigil']],
  },
  clan: {
    label: 'Clan / House', plural: 'Clans & Houses', blurb: 'Families, noble houses, tribes and dwarven clans.',
    fields: [['ancestry', 'People'], ['head', 'Head of the family'], ['seat', 'Seat'], ['heraldry', 'Heraldry'], ['motto', 'Motto'], ['traditions', 'Traditions', 'long'], ['feuds', 'Feuds & alliances', 'long']],
  },
  npc: {
    label: 'NPC', plural: 'NPCs', blurb: 'People the party can meet.',
    fields: [['ancestry', 'Ancestry'], ['role', 'Role or job'], ['status', 'Status', 'select', ['Alive', 'Dead', 'Missing', 'Unknown', 'Undead']], ['appearance', 'Appearance', 'long'], ['personality', 'Personality', 'long'], ['voice', 'Voice & mannerisms'], ['wants', 'Wants', 'long'], ['level', 'Class & level'], ['stats', 'Stat block', 'long'], ['spells', 'Spellcasting', 'long']],
  },
  character: {
    label: 'Player Character', plural: 'Player Characters', blurb: 'The heroes, past and present.',
    fields: [['player', 'Player'], ['species', 'Species'], ['class', 'Class'], ['level', 'Level'], ['background', 'Background'], ['status', 'Status', 'select', ['Active', 'Retired', 'Dead', 'Missing']], ['sheet', 'Sheet & backstory', 'long'],
      // Kept out of forms: the Character Forge recipe (rebuilds the full sheet) and the live play state.
      ['forge', 'Forge recipe', 'hidden'], ['play', 'Play state', 'hidden'], ['known', 'What they know', 'hidden'],
      // How NPCs and powers feel about this character (see attitudes.js); only GMs set it.
      ['attitudes', 'Attitudes', 'hidden', null, { gmOnly: true }],
      // The player's goals for the character (see goals.js); secret ones only the player and the GMs see.
      ['goals', 'Goals', 'hidden'],
      // What the player hopes the character finds or earns (see wishes.js); only the player and the GMs see it.
      ['wishes', 'Wish list', 'hidden']],
  },
  deity: {
    label: 'Deity', plural: 'Deities & Powers', blurb: 'Gods, patrons, demon lords and old powers.',
    fields: [['domains', 'Domains'], ['alignment', 'Alignment'], ['symbol', 'Holy symbol'], ['worshippers', 'Worshippers'], ['tenets', 'Tenets', 'long'], ['holy_days', 'Holy days & rites', 'long']],
  },
  item: {
    label: 'Item', plural: 'Items & Artifacts', blurb: 'Relics, magic items and things worth fighting over.',
    fields: [['rarity', 'Rarity', 'select', ['Mundane', 'Common', 'Uncommon', 'Rare', 'Very rare', 'Legendary', 'Artifact']], ['type', 'Type'], ['attunement', 'Attunement'], ['value', 'Value'], ['holder', 'Current holder'], ['properties', 'Properties', 'long'], ['history', 'History', 'long'], ['source', 'Source book'], ['link', 'D&D Beyond link']],
  },
  event: {
    label: 'Event', plural: 'History & Events', blurb: 'The timeline: wars, founding dates, campaign sessions.',
    fields: [['date', 'Date (in world)'], ['sort', 'Sort year (number)'], ['era', 'Era'], ['participants', 'Who was involved', 'long'], ['outcome', 'Outcome', 'long']],
  },
  session: {
    label: 'Session', plural: 'Session Log', blurb: 'What happened at the table, who ran it and who played.',
    fields: [['number', 'Session number'], ['played_on', 'Played on (real date)'], ['world_date', 'In-world date'], ['gm', 'GM'], ['players', 'Players & characters', 'long'], ['xp', 'XP or milestone'], ['loot', 'Loot handed out', 'long'], ['next', 'Next time', 'long'],
      // Who came, XP each and whether it was a milestone (see advancement.js); GMs set it on the session page.
      ['attendance', 'Attendance', 'hidden', null, { gmOnly: true }]],
  },
  journal: {
    label: 'Journal', plural: 'Journals & Notes', blurb: 'Diaries, session notes, letters and theories, by players and GMs.',
    fields: [['kind', 'Kind', 'select', ['Diary', 'Session notes', 'Letter', 'Theory', 'Rumor heard', 'Party notes', 'Other']], ['character', 'Written by (character)'], ['date', 'Date (in world)']],
  },
  downtime: {
    label: 'Downtime', plural: 'Downtime', blurb: 'What characters do between sessions, and how it turned out.',
    // The player writes what they do (the summary); a GM writes the outcome. GM-only fields are kept by the server
    // whatever a player sends.
    fields: [['character', 'Character', 'hidden'], ['activity', 'Activity', 'select', DOWNTIME_ACTIVITIES], ['days', 'Days spent'], ['cost', 'Cost'],
      ['outcome', 'Outcome (from the GM)', 'long', null, { gmOnly: true }], ['resolved', 'Resolved on', 'hidden', null, { gmOnly: true }]],
  },
  table: {
    label: 'Roll table', plural: 'Roll Tables', blurb: 'Your own random tables: tavern patrons, strange weather, what’s in the barrel.',
    // One result per line; "3x …" or "1-4: …" for weights, {2d6} for dice, {a|b} for a choice, [[Another table]] to roll it.
    fields: [['rows', 'Results, one per line', 'long'], ['category', 'Category']],
  },
  encounter: {
    label: 'Encounter', plural: 'Encounters', blurb: 'Fights and meetings saved for later, waiting where the party will find them.',
    // The rolled encounter itself is kept as JSON (enc); the rest is for the GM to describe when and how it happens.
    fields: [['difficulty', 'Difficulty', 'select', ['Low', 'Moderate', 'High']], ['when', 'When it happens', 'long'], ['tactics', 'Tactics', 'long'], ['enc', 'Encounter', 'hidden']],
  },
  handout: {
    label: 'Handout', plural: 'Handouts', blurb: 'Letters, maps, notes and clues the GMs hand to the players.',
    fields: [['from', 'From (who wrote or gave it)'], ['found', 'Where or when it was found'], ['text', 'Text of the handout', 'long']],
  },
  creature: {
    label: 'Creature', plural: 'Bestiary', blurb: 'Monsters from your books, in short: what they are and what they do.',
    fields: [['cr', 'Challenge rating'], ['type', 'Type', 'select', ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead']],
      ['size', 'Size', 'select', ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']], ['terrain', 'Where it’s found'], ['ac', 'Armor class'], ['hp', 'Hit points'], ['speed', 'Speed'],
      ['abilities', 'What it does', 'long'], ['tactics', 'How it fights', 'long'], ['source', 'Source book'], ['link', 'D&D Beyond link']],
  },
  rule: {
    label: 'Rules option', plural: 'Classes, Species & Feats', blurb: 'Classes, subclasses, species, backgrounds, feats and spells from your books, in short.',
    fields: [['category', 'Category', 'select', ['Class', 'Subclass', 'Species', 'Background', 'Feat', 'Spell', 'Other']],
      ['class', 'Class', 'text', null, { only: ['Subclass', 'Spell'] }], ['level', 'Level', 'text', null, { only: ['Subclass', 'Spell', 'Feat'] }],
      ['features', 'What it gives', 'long'], ['source', 'Source book'], ['link', 'D&D Beyond link'],
      // Species only: the numbers the Character Forge needs, and an SRD species to borrow names, age and height from.
      ...[['size', 'Size', 'select', ['Small', 'Medium', 'Small or Medium', 'Large']], ['speed', 'Speed'], ['darkvision', 'Darkvision'],
        ['like', 'Similar to', 'select', ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']]].map(([k, l, t = 'text', o = null]) => [k, l, t, o, { only: ['Species'] }]),
      // Classes only: enough for the Character Forge to build one. Features go in "What it gives", one level per line.
      ...CLASS_FIELDS.map(([k, l, t = 'text', o = null]) => [k, l, t, o, { only: k === 'gear' ? ['Class', 'Background'] : ['Class'] }]),
      // Backgrounds and feats: what the Forge needs to roll them.
      ...[['abilities', 'Ability scores'], ['bgSkills', 'Skills'], ['tool', 'Tool proficiency'], ['feat', 'Origin feat']].map(([k, l]) => [k, l, 'text', null, { only: ['Background'] }]),
      ['featType', 'Kind of feat', 'select', ['Origin', 'General', 'Fighting Style', 'Epic Boon'], { only: ['Feat'] }]],
  },
  rumor: {
    label: 'Rumor', plural: 'Rumors', blurb: 'Gossip that starts in one town and spreads, changing as it goes.',
    // The truth lives in the GM-only secret text ("Truth: False."), so players never see it.
    fields: [['source', 'Started by'], ['spread', 'Where it has spread', 'hidden']],
  },
  quest: {
    label: 'Quest', plural: 'Quests & Plots', blurb: 'Adventures, rumors and running plot threads.',
    fields: [['status', 'Status', 'select', ['Rumor', 'Available', 'Active', 'Completed', 'Failed', 'Abandoned']], ['patron', 'Patron'], ['gm', 'Run by (GM)'], ['reward', 'Reward'], ['stakes', 'What’s at stake', 'long'], ['outline', 'Outline', 'long'],
      // The checklist of steps (see objectives.js); GMs keep it, and secret steps never reach players.
      ['objectives', 'Objectives', 'hidden', null, { gmOnly: true }],
      // When its reward went into the party treasury (see world-reward.js).
      ['reward_paid', 'Reward paid', 'hidden', null, { gmOnly: true }]],
  },
  lore: {
    label: 'Lore', plural: 'Lore & Rules', blurb: 'Myths, cultures, languages, calendars and house rules.',
    fields: [['category', 'Category', 'select', ['History', 'Myth', 'Culture', 'Language', 'Calendar', 'Cosmology', 'Magic', 'House rule', 'Other']], ['source', 'Who knows this']],
  },
};

// Every kind can have a picture: an uploaded image (/api/images?id=…) or an https:// link.
for (const k of Object.values(KINDS)) k.fields.push(['image', 'Picture', 'image']);
// …and a small gallery of more pictures (see gallery.js), added and arranged on the entry's page.
for (const k of Object.values(KINDS)) k.fields.push(['gallery', 'More pictures', 'hidden']);
export const isImageRef = (v) => /^\/api\/images\?id=[a-f0-9]{16}$/.test(v) || /^https:\/\/[^\s"'<>]{4,1000}$/.test(v);

export const KIND_ORDER = ['region', 'area', 'settlement', 'location', 'faction', 'guild', 'clan', 'npc', 'character', 'deity', 'item', 'event', 'session', 'journal', 'downtime', 'handout', 'quest', 'rumor', 'lore', 'creature', 'rule', 'table', 'encounter'];

// Kinds a player can create and edit as their own; anything else a player adds is a suggestion for the GMs.
export const PLAYER_KINDS = ['character', 'journal', 'downtime', 'table'];
// Fields only a GM can set (a downtime outcome); the server keeps their old values when a player saves.
export const gmOnlyFields = (kind) => (KINDS[kind]?.fields || []).filter((f) => f[4]?.gmOnly).map(([k]) => k);

// Kinds the party can have a reputation with.
export const STANDING_KINDS = ['faction', 'guild', 'clan', 'deity', 'settlement', 'area', 'npc'];
export const STANDING_LEVELS = [[-5, 'Sworn enemies'], [-4, 'Hostile'], [-3, 'Hostile'], [-2, 'Unfriendly'], [-1, 'Wary'], [0, 'Neutral'], [1, 'Friendly'], [2, 'Friendly'], [3, 'Trusted'], [4, 'Allied'], [5, 'Champions']];
export const standingLabel = (v) => (STANDING_LEVELS.find(([n]) => n === Math.max(-5, Math.min(5, Math.round(v)))) || [0, 'Neutral'])[1];

// Kinds that are places and can hold people, quests and other places.
export const PLACE_KINDS = ['region', 'area', 'settlement', 'location'];
// Which kinds may sit inside which place (for "Located in" pickers and quick-add buttons).
export const CHILD_PLACES = { region: ['area', 'settlement', 'location'], area: ['settlement', 'location', 'area'], settlement: ['location', 'area'], location: ['location'] };
// The map marker a new pin gets from its entry.
export function pinIconFor(e) {
  if (!e) return 'poi';
  if (e.kind === 'region') return 'region';
  if (e.kind === 'area') return 'area';
  if (e.kind === 'settlement') return ['City', 'Metropolis'].includes(e.fields?.size) ? 'city' : e.fields?.size === 'Fortress' || e.fields?.size === 'Outpost' ? 'camp' : 'town';
  if (e.kind === 'location') return { Dungeon: 'dungeon', Ruin: 'dungeon', Lair: 'danger', Temple: 'temple', Castle: 'city', Tavern: 'town', Shop: 'town' }[e.fields?.type] || 'poi';
  if (e.kind === 'deity') return 'temple';
  return 'poi';
}

export const LINK_LABELS = ['member of', 'leads', 'ally of', 'enemy of', 'rival of', 'serves', 'worships', 'located in', 'headquartered in', 'owns', 'created', 'related to', 'parent of', 'child of', 'married to', 'sibling of', 'trades with', 'at war with', 'secretly works for', 'wants', 'guards', 'childhood friend of', 'owes a debt to', 'saved the life of', 'sworn to protect', 'in love with', 'mentor of', 'keeps a secret from', 'distrusts', 'old comrade of'];

export const LIMITS = { name: 200, summary: 4000, body: 40000, secret: 20000, field: 4000, tags: 30, tag: 40, links: 100 };

export const isKind = (k) => Object.prototype.hasOwnProperty.call(KINDS, k);
