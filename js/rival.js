// A rival party: another band of adventurers chasing the same jobs, as a guild (the company) and four people, each
// with a class and level near the party's, a manner, and the grudge the company holds. Pure, so it can be tested:
// rng from rng.js makeRng.
import { personName, ANCESTRY_WEIGHTS } from './names.js';

const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const ADJ = ['Gilded', 'Iron', 'Crimson', 'Silver', 'Last', 'Lucky', 'Black', 'Wandering', 'Bright', 'Grim', 'Howling', 'Seventh'];
const NOUN = ['Lanterns', 'Blades', 'Company', 'Hounds', 'Banner', 'Shields', 'Wolves', 'Ravens', 'Crowns', 'Oaths', 'Spurs', 'Thorns'];
const NAMES = ['The {Adj} {Noun}', 'The {Adj} {Noun}', '{Leader}’s {Noun}', 'The {Town} {Noun}'];
const GRUDGES = [
  'the party took a job they had been promised',
  'the party got the credit for a monster they had worn down',
  'one of the party once left one of theirs behind',
  'the party outbid them for a patron’s favour',
  'a bard’s song made the party the heroes of a story that was theirs',
  'the party freed a prisoner they were paid to bring back',
  'they think the party is muscling in on their town',
  'there is no grudge yet, only a wager on who gets famous first',
];
const WANTS = [
  'a famous treasure the party is also after', 'a charter from the crown, and the land that comes with it', 'to be the first into a newly opened ruin',
  'a seat on the town council', 'enough gold to retire, and soon', 'revenge on a villain who wronged one of them', 'the patron who keeps hiring the party',
];
const MANNERS = [
  'all swagger, and brave with it', 'polite, patient and never forgets a slight', 'cheats at cards, and at everything else', 'kind to everyone but the party',
  'prays before every fight, loudly', 'counts every coin twice', 'quotes their own legend', 'quiet, watchful, takes notes', 'loves a good brawl, holds no grudges',
  'a born leader, and knows it', 'jumpy and suspicious of magic', 'collects trophies from every job',
];
const ROLES = { leader: 'leads the company', face: 'does the talking', muscle: 'the one in front', eyes: 'scouts and spies' };

// level: the party's level. → { company: guild draft, members: [npc drafts] } (members link to the company on save).
export function rivalParty(rng, { level = 3, place = null } = {}) {
  const pickOut = (list, n) => { const pool = [...list], out = []; while (out.length < n && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]); return out; };
  const classes = pickOut(CLASSES, 4), manners = pickOut(MANNERS, 4);
  const lv = Math.max(1, Math.min(20, Math.round(Number(level) || 1)));
  const members = Object.keys(ROLES).map((role, i) => {
    const ancestry = rng.pickW(ANCESTRY_WEIGHTS), cls = classes[i], l = Math.max(1, Math.min(20, lv + rng.int(3) - 1 + (role === 'leader' ? 1 : 0)));
    return {
      kind: 'npc', name: personName(rng, ancestry), parent_id: place?.id || null,
      summary: `${cls} ${l} of a rival company; ${ROLES[role]}. ${manners[i][0].toUpperCase()}${manners[i].slice(1)}.`,
      fields: { ancestry, role: `Adventurer (${cls.toLowerCase()})`, status: 'Alive', level: `${cls} ${l}`, personality: `${manners[i][0].toUpperCase()}${manners[i].slice(1)}.` },
      tags: ['rival'],
    };
  });
  const leader = members[0].name.split(' ')[0];
  const name = rng.pick(NAMES).replace('{Adj}', rng.pick(ADJ)).replace('{Noun}', rng.pick(NOUN)).replace('{Leader}', leader).replace('{Town}', place?.name || rng.pick(ADJ));
  const grudge = rng.pick(GRUDGES), want = rng.pick(WANTS);
  const company = {
    kind: 'guild', name, parent_id: place?.id || null,
    summary: `A rival adventuring company led by ${members[0].name}. They want ${want}.`,
    fields: { trade: 'Adventuring', leader: members[0].name, services: 'Monsters slain, ruins cleared, no questions asked' },
    body: `Members: ${members.map((m) => `[[${m.name}]] (${m.fields.level})`).join(', ')}.\n\nWhat they want: ${want}.`,
    secret: `Their grudge: ${grudge}.`,
    tags: ['rival'],
  };
  return { company, members, grudge, want };
}
