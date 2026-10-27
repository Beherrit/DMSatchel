// What the shared world can hold. Used by the browser and by the API (for validation).

export const KINDS = {
  region: {
    label: 'Region', plural: 'Regions', blurb: 'Kingdoms, provinces, wilds and seas.',
    fields: [['ruler', 'Ruled by'], ['climate', 'Climate & terrain'], ['population', 'Peoples'], ['resources', 'Known for', 'long'], ['dangers', 'Dangers', 'long']],
  },
  settlement: {
    label: 'Settlement', plural: 'Settlements', blurb: 'Cities, towns, villages and outposts.',
    fields: [['size', 'Size', 'select', ['Hamlet', 'Village', 'Town', 'City', 'Metropolis', 'Fortress', 'Outpost']], ['population', 'Population'], ['ruler', 'Led by'], ['government', 'Government'], ['known_for', 'Known for', 'long'], ['trouble', 'Current trouble', 'long'], ['landmarks', 'Landmarks', 'long']],
  },
  location: {
    label: 'Location', plural: 'Locations', blurb: 'Dungeons, ruins, taverns, shops and landmarks.',
    fields: [['type', 'Type', 'select', ['Dungeon', 'Ruin', 'Tavern', 'Shop', 'Temple', 'Landmark', 'Lair', 'Castle', 'Wilderness', 'Other']], ['owner', 'Owner or occupant'], ['features', 'Notable features', 'long'], ['dangers', 'Dangers', 'long'], ['treasure', 'Treasure', 'long']],
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
    fields: [['ancestry', 'Ancestry'], ['role', 'Role or job'], ['status', 'Status', 'select', ['Alive', 'Dead', 'Missing', 'Unknown', 'Undead']], ['appearance', 'Appearance', 'long'], ['personality', 'Personality', 'long'], ['voice', 'Voice & mannerisms'], ['wants', 'Wants', 'long']],
  },
  character: {
    label: 'Player Character', plural: 'Player Characters', blurb: 'The heroes, past and present.',
    fields: [['player', 'Player'], ['species', 'Species'], ['class', 'Class'], ['level', 'Level'], ['background', 'Background'], ['status', 'Status', 'select', ['Active', 'Retired', 'Dead', 'Missing']], ['sheet', 'Sheet & backstory', 'long']],
  },
  deity: {
    label: 'Deity', plural: 'Deities & Powers', blurb: 'Gods, patrons, demon lords and old powers.',
    fields: [['domains', 'Domains'], ['alignment', 'Alignment'], ['symbol', 'Holy symbol'], ['worshippers', 'Worshippers'], ['tenets', 'Tenets', 'long'], ['holy_days', 'Holy days & rites', 'long']],
  },
  item: {
    label: 'Item', plural: 'Items & Artifacts', blurb: 'Relics, magic items and things worth fighting over.',
    fields: [['rarity', 'Rarity', 'select', ['Mundane', 'Common', 'Uncommon', 'Rare', 'Very rare', 'Legendary', 'Artifact']], ['type', 'Type'], ['holder', 'Current holder'], ['properties', 'Properties', 'long'], ['history', 'History', 'long']],
  },
  event: {
    label: 'Event', plural: 'History & Events', blurb: 'The timeline: wars, founding dates, campaign sessions.',
    fields: [['date', 'Date (in world)'], ['sort', 'Sort year (number)'], ['era', 'Era'], ['participants', 'Who was involved', 'long'], ['outcome', 'Outcome', 'long']],
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

export const KIND_ORDER = ['region', 'settlement', 'location', 'faction', 'guild', 'clan', 'npc', 'character', 'deity', 'item', 'event', 'quest', 'lore'];

export const LINK_LABELS = ['member of', 'leads', 'ally of', 'enemy of', 'rival of', 'serves', 'worships', 'located in', 'headquartered in', 'owns', 'created', 'related to', 'parent of', 'child of', 'married to', 'trades with', 'at war with', 'secretly works for', 'wants', 'guards'];

export const LIMITS = { name: 200, summary: 4000, body: 40000, secret: 20000, field: 4000, tags: 30, tag: 40, links: 100 };

export const isKind = (k) => Object.prototype.hasOwnProperty.call(KINDS, k);
