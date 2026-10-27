// What the shared world can hold. Used by the browser and by the API (for validation).

export const KINDS = {
  region: {
    label: 'Region', plural: 'Regions', blurb: 'Kingdoms, provinces, wilds and seas.',
    fields: [['ruler', 'Ruled by'], ['climate', 'Climate & terrain'], ['population', 'Peoples'], ['resources', 'Known for', 'long'], ['dangers', 'Dangers', 'long']],
  },
  area: {
    label: 'Area', plural: 'Areas & Districts', blurb: 'Forests, valleys, coasts, city districts and wild lands inside a region.',
    fields: [['type', 'Type', 'select', ['Forest', 'Hills', 'Mountains', 'Valley', 'Coast', 'Island', 'Swamp', 'Desert', 'Plains', 'Underdark', 'City district', 'Borderland', 'Other']], ['terrain', 'Terrain & climate'], ['controlled_by', 'Controlled by'], ['features', 'Notable features', 'long'], ['dangers', 'Dangers & encounters', 'long'], ['resources', 'Resources', 'long']],
  },
  settlement: {
    label: 'Settlement', plural: 'Settlements', blurb: 'Cities, towns, villages and outposts.',
    fields: [['size', 'Size', 'select', ['Hamlet', 'Village', 'Town', 'City', 'Metropolis', 'Fortress', 'Outpost']], ['population', 'Population'], ['ruler', 'Led by'], ['government', 'Government'], ['known_for', 'Known for', 'long'], ['trouble', 'Current trouble', 'long'], ['landmarks', 'Landmarks', 'long'], ['economy', 'Trade & economy', 'long'], ['defenses', 'Defenses', 'long'], ['peoples', 'Peoples & culture', 'long'], ['market', 'Market conditions', 'long']],
  },
  location: {
    label: 'Location', plural: 'Locations', blurb: 'Dungeons, ruins, taverns, shops and landmarks.',
    fields: [['type', 'Type', 'select', ['Dungeon', 'Ruin', 'Tavern', 'Shop', 'Temple', 'Landmark', 'Lair', 'Castle', 'Wilderness', 'Other']], ['owner', 'Owner or occupant'], ['shop_type', 'Shop type'], ['features', 'Notable features', 'long'], ['dangers', 'Dangers', 'long'], ['treasure', 'Treasure', 'long'], ['stock', 'Stock & prices', 'long']],
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
      ['forge', 'Forge recipe', 'hidden'], ['play', 'Play state', 'hidden']],
  },
  deity: {
    label: 'Deity', plural: 'Deities & Powers', blurb: 'Gods, patrons, demon lords and old powers.',
    fields: [['domains', 'Domains'], ['alignment', 'Alignment'], ['symbol', 'Holy symbol'], ['worshippers', 'Worshippers'], ['tenets', 'Tenets', 'long'], ['holy_days', 'Holy days & rites', 'long']],
  },
  item: {
    label: 'Item', plural: 'Items & Artifacts', blurb: 'Relics, magic items and things worth fighting over.',
    fields: [['rarity', 'Rarity', 'select', ['Mundane', 'Common', 'Uncommon', 'Rare', 'Very rare', 'Legendary', 'Artifact']], ['type', 'Type'], ['attunement', 'Attunement'], ['value', 'Value'], ['holder', 'Current holder'], ['properties', 'Properties', 'long'], ['history', 'History', 'long']],
  },
  event: {
    label: 'Event', plural: 'History & Events', blurb: 'The timeline: wars, founding dates, campaign sessions.',
    fields: [['date', 'Date (in world)'], ['sort', 'Sort year (number)'], ['era', 'Era'], ['participants', 'Who was involved', 'long'], ['outcome', 'Outcome', 'long']],
  },
  session: {
    label: 'Session', plural: 'Session Log', blurb: 'What happened at the table, who ran it and who played.',
    fields: [['number', 'Session number'], ['played_on', 'Played on (real date)'], ['world_date', 'In-world date'], ['gm', 'GM'], ['players', 'Players & characters', 'long'], ['xp', 'XP or milestone'], ['loot', 'Loot handed out', 'long'], ['next', 'Next time', 'long']],
  },
  journal: {
    label: 'Journal', plural: 'Journals & Notes', blurb: 'Diaries, session notes, letters and theories, by players and GMs.',
    fields: [['kind', 'Kind', 'select', ['Diary', 'Session notes', 'Letter', 'Theory', 'Rumor heard', 'Party notes', 'Other']], ['character', 'Written by (character)'], ['date', 'Date (in world)']],
  },
  handout: {
    label: 'Handout', plural: 'Handouts', blurb: 'Letters, maps, notes and clues the GMs hand to the players.',
    fields: [['from', 'From (who wrote or gave it)'], ['found', 'Where or when it was found'], ['text', 'Text of the handout', 'long']],
  },
  quest: {
    label: 'Quest', plural: 'Quests & Plots', blurb: 'Adventures, rumors and running plot threads.',
    fields: [['status', 'Status', 'select', ['Rumor', 'Available', 'Active', 'Completed', 'Failed', 'Abandoned']], ['patron', 'Patron'], ['gm', 'Run by (GM)'], ['reward', 'Reward'], ['stakes', 'What’s at stake', 'long'], ['outline', 'Outline', 'long']],
  },
  lore: {
    label: 'Lore', plural: 'Lore & Rules', blurb: 'Myths, cultures, languages, calendars and house rules.',
    fields: [['category', 'Category', 'select', ['History', 'Myth', 'Culture', 'Language', 'Calendar', 'Cosmology', 'Magic', 'House rule', 'Other']], ['source', 'Who knows this']],
  },
};

// Every kind can have a picture: an uploaded image (/api/images?id=…) or an https:// link.
for (const k of Object.values(KINDS)) k.fields.push(['image', 'Picture', 'image']);
export const isImageRef = (v) => /^\/api\/images\?id=[a-f0-9]{16}$/.test(v) || /^https:\/\/[^\s"'<>]{4,1000}$/.test(v);

export const KIND_ORDER = ['region', 'area', 'settlement', 'location', 'faction', 'guild', 'clan', 'npc', 'character', 'deity', 'item', 'event', 'session', 'journal', 'handout', 'quest', 'lore'];

// Kinds a player can create and edit as their own; anything else a player adds is a suggestion for the GMs.
export const PLAYER_KINDS = ['character', 'journal'];

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

export const LINK_LABELS = ['member of', 'leads', 'ally of', 'enemy of', 'rival of', 'serves', 'worships', 'located in', 'headquartered in', 'owns', 'created', 'related to', 'parent of', 'child of', 'married to', 'trades with', 'at war with', 'secretly works for', 'wants', 'guards'];

export const LIMITS = { name: 200, summary: 4000, body: 40000, secret: 20000, field: 4000, tags: 30, tag: 40, links: 100 };

export const isKind = (k) => Object.prototype.hasOwnProperty.call(KINDS, k);
