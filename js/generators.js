// Random drafts for the world builder: entries ready to save into a place.
// Each maker returns a plain entry draft { kind, name, summary, fields, body, secret, parent_id }.

import { makeRng } from './rng.js';
import { cap, fmt } from './dom.js';
import { personName, lastName, townName, tavernName, shopName, ANCESTRY_WEIGHTS } from './names.js';
import * as D from './tables.js';
import { npcStats } from './npc-stats.js';
import { generateShop, parseMarket, rollMarket, stockText } from './economy.js';

const r = makeRng(Date.now() ^ 0x5eed);
const aOrAn = (s) => (/^[aeiou]/i.test(s) && !/^(uni|one)/i.test(s) ? 'an ' : 'a ') + s;

// Roles that suit a place: [group weights, extra roles only found there].
const PLACE_ROLES = {
  Hamlet: [{ common: 6, trade: 2, faith: 1, shady: 1 }, ['village elder', 'goatherd', 'midwife', 'hedge-witch']],
  Village: [{ common: 5, trade: 3, faith: 1, shady: 1, authority: 1 }, ['reeve', 'miller', 'village priest', 'beekeeper']],
  Town: [{ common: 3, trade: 4, authority: 2, faith: 1, shady: 2 }, ['town watch sergeant', 'guild clerk', 'market warden']],
  City: [{ common: 2, trade: 4, authority: 3, faith: 2, shady: 3 }, ['noble courtier', 'city watch captain', 'banker', 'street preacher', 'fence']],
  Metropolis: [{ common: 2, trade: 4, authority: 3, faith: 2, shady: 3 }, ['senator', 'archmage’s apprentice', 'opera singer', 'spymaster’s agent']],
  Fortress: [{ authority: 5, trade: 2, common: 1, faith: 1 }, ['quartermaster', 'castellan', 'veteran knight', 'siege engineer']],
  Outpost: [{ authority: 3, common: 2, trade: 2, shady: 1 }, ['scout', 'trapper', 'outpost commander', 'supply runner']],
  Tavern: [{ common: 2, trade: 2, shady: 2 }, ['barkeep', 'serving hand', 'cook', 'bouncer', 'regular who never leaves', 'traveling bard']],
  Shop: [{ trade: 4, common: 1, shady: 1 }, ['shopkeeper', 'apprentice', 'loyal customer', 'rival merchant']],
  Temple: [{ faith: 5, common: 1 }, ['high priest', 'acolyte', 'temple guard', 'pilgrim', 'gravekeeper']],
  Castle: [{ authority: 5, trade: 1, faith: 1 }, ['lord of the castle', 'steward', 'court wizard', 'captain of the guard', 'servant']],
  Dungeon: [{ shady: 3, faith: 1 }, ['captured explorer', 'cultist', 'goblin turncoat', 'ghost of a former adventurer']],
  default: [{ common: 3, trade: 3, authority: 1, faith: 1, shady: 1 }, []],
};
const placeKey = (place) => place?.fields?.size || place?.fields?.type || 'default';

export function npcDraft(place, ancestry) {
  const [weights, extras] = PLACE_ROLES[placeKey(place)] || PLACE_ROLES.default;
  const job = extras.length && r.chance(0.35) ? r.pick(extras) : r.pick(D.ROLES[r.pickW(weights)]);
  const anc = ancestry || r.pickW(ANCESTRY_WEIGHTS);
  const n = Object.fromEntries(['look', 'personality', 'mannerism', 'voice', 'want', 'secret', 'attitude'].map((k) => [k, r.pick(D.NPC[k])]));
  const st = npcStats({ role: job, ancestry: anc }, `${Date.now()}-${r.int(1e9)}`);
  return {
    kind: 'npc', name: personName(r, anc), parent_id: place?.id || null,
    summary: `${cap(job)}${place ? ` in ${place.name}` : ''}. ${cap(n.personality)}.`,
    fields: { ancestry: anc, role: cap(job), status: 'Alive', appearance: cap(n.look), personality: `${cap(n.personality)}. ${cap(n.mannerism)}.`, voice: cap(n.voice), wants: cap(n.want), level: st.level, stats: st.stats, spells: st.spells },
    secret: `${cap(n.secret)}.`, body: `Attitude toward the party: ${n.attitude}.`,
  };
}

export function questDraft(place, tier = 0) {
  const q = {};
  for (const k of ['patron', 'item', 'person', 'place', 'dest', 'mystery', 'monster', 'antagonist', 'twist', 'complication']) q[k] = r.pick(D.Q[k]);
  const goal = D.Q.goal[r.int(D.Q.goal.length)](q);
  const [lo, hi] = D.REWARD_GP[tier];
  const gp = Math.round((lo + r.next() * (hi - lo)) / 10) * 10;
  const title = `${r.pick(['The ', 'The ', ''])}${r.pick(['Silent', 'Drowned', 'Gilded', 'Hollow', 'Ashen', 'Broken', 'Last', 'Crimson', 'Whispering', 'Forgotten', 'Missing', 'Bitter'])} ${r.pick(['Bell', 'Crown', 'Debt', 'Road', 'Lantern', 'Oath', 'Harvest', 'Tide', 'Door', 'Heir', 'Ledger', 'Well'])}`;
  return {
    kind: 'quest', name: title, parent_id: place?.id || null, summary: goal,
    fields: { status: 'Available', patron: cap(q.patron), reward: `${fmt(gp)} gp`, stakes: `Opposition: ${cap(q.antagonist)}. Complication: ${q.complication}` },
    secret: `Twist: ${q.twist}`, body: place ? `Posted on the board in [[${place.name}]].` : '',
  };
}

export function tavernDraft(place) {
  const a = r.pickW(ANCESTRY_WEIGHTS), owner = personName(r, a), quality = r.pick(D.TAVERN.quality);
  return {
    kind: 'location', name: tavernName(r), parent_id: place?.id || null,
    summary: `${quality[0]} tavern run by ${owner}. House special: ${r.pick(D.TAVERN.special)}.`,
    fields: { type: 'Tavern', owner: `${owner}, ${a.toLowerCase()}`, features: `${cap(r.pick(D.TAVERN.vibe))}. Prices: ${quality[1]}.` },
    body: `Overheard: ${r.pick(D.TABLES.rumor.items)}`,
  };
}

export function shopDraft(place) {
  const size = ['Hamlet', 'Village', 'Town', 'City', 'Metropolis', 'Fortress', 'Outpost'].includes(place?.fields?.size) ? place.fields.size : 'Town';
  const market = place?.fields?.market ? parseMarket(place.fields.market, size) : rollMarket(r, { size, economy: 'Stable' });
  const owner = personName(r, r.pickW(ANCESTRY_WEIGHTS));
  const sh = generateShop(r, { market, ownerName: owner, size });
  return { kind: 'location', name: sh.name, parent_id: place?.id || null, summary: `${sh.type} run by ${owner}. ${sh.attitude} with prices.`, fields: { type: 'Shop', shop_type: sh.type, owner, stock: stockText(sh) } };
}

export function settlementDraft(place) {
  const size = r.pick(D.TOWN.size);
  const sizeName = ['Hamlet', 'Village', 'Town', 'City'].includes(size[0]) ? size[0] : 'Town';
  return {
    kind: 'settlement', name: townName(r), parent_id: place?.id || null,
    summary: `${sizeName} known for ${r.pick(D.TOWN.known)}.`,
    fields: { size: sizeName, population: size[1], ruler: cap(r.pick(D.TOWN.leader)), trouble: cap(r.pick(D.TOWN.problem)), landmarks: cap(r.sample(D.TOWN.spots, 3).join('; ')) },
  };
}

const AREA_WORDS = { Forest: ['Wood', 'Forest', 'Weald', 'Thicket'], Hills: ['Hills', 'Downs', 'Fells'], Mountains: ['Peaks', 'Crags', 'Spine'], Valley: ['Vale', 'Dale', 'Hollow'], Coast: ['Coast', 'Shore', 'Strand'], Swamp: ['Fen', 'Mire', 'Bog'], Plains: ['Plain', 'Steppe', 'Fields'], Desert: ['Sands', 'Waste', 'Barrens'] };
export function areaDraft(place) {
  const type = r.pick(Object.keys(AREA_WORDS));
  const name = `${r.pick(['The ', ''])}${r.pick(['Ash', 'Black', 'Whisper', 'Thorn', 'Silver', 'Old', 'Grey', 'Red', 'Raven', 'Mist', 'Hollow', 'Wolf'])}${r.chance(0.5) ? '' : r.pick(['wood', 'water', 'stone', 'moor'])} ${r.pick(AREA_WORDS[type])}`.replace(/^The (\w+) /, (m) => m);
  const env = { Forest: 'Forest', Hills: 'Mountain', Mountains: 'Mountain', Valley: 'Forest', Coast: 'Coast', Swamp: 'Swamp', Plains: 'City street', Desert: 'Mountain' }[type];
  const e = D.ENV[env] || D.ENV.Forest;
  return {
    kind: 'area', name: name.trim(), parent_id: place?.id || null,
    summary: `${type === 'Plains' ? 'Open plains' : `A ${type.toLowerCase()} region`} where ${r.pick(e.see)}.`,
    fields: { type, features: `${cap(r.pick(e.see))}. ${cap(r.pick(e.hear))}.`, dangers: cap(r.pick(['wolves after dark', 'bandits on the old road', 'a territorial owlbear', 'sinkholes and old mine shafts', 'fey that steal names', 'restless dead near the barrows', 'sudden storms', 'a hungry young dragon'])) },
  };
}

export function orgDraft(place, type = 'guild') {
  const T = D.ORGS;
  const nameFrom = (tpl, extra = {}) => tpl.replace('{Adj}', r.pick(T.faction.adj)).replace('{Noun}', r.pick(T.faction.noun)).replace('{Surname}', extra.surname || lastName(r, 'Human')).replace('{Trade}', extra.trade || '').replace('{Town}', place?.name || townName(r));
  if (type === 'guild') {
    const trade = r.pick(T.guild.trades);
    return { kind: 'guild', name: nameFrom(r.pick(T.guild.names), { trade }), parent_id: place?.id || null, summary: `The guild of ${trade.toLowerCase()}${place ? ` in ${place.name}` : ''}.`,
      fields: { trade, leader: `${personName(r, r.pickW(ANCESTRY_WEIGHTS))}, ${r.pick(T.guild.leaders)}`, services: cap(r.pick(T.guild.services)), dues: cap(r.pick(T.guild.dues)), ranks: r.pick(T.faction.ranks) }, secret: r.pick(T.guild.quirks) };
  }
  if (type === 'clan') {
    const people = r.pick(T.clan.peoples); const surname = lastName(r, people).replace(/^(the |of )/i, '') || lastName(r, 'Human');
    return { kind: 'clan', name: nameFrom(r.pick(T.clan.names[people] || T.clan.names.other), { surname }), parent_id: place?.id || null, summary: `${people} family${place ? ` of ${place.name}` : ''}.`,
      fields: { ancestry: people, head: personName(r, people), seat: cap(r.pick(T.clan.seats)), heraldry: cap(r.pick(T.clan.heraldry)), motto: r.pick(T.clan.mottos), traditions: r.pick(T.clan.traditions), feuds: cap(r.pick(T.clan.feuds)) } };
  }
  const kind = r.pick(T.faction.types);
  return { kind: 'faction', name: nameFrom(r.pick(T.faction.names[kind])), parent_id: place?.id || null, summary: `${kind} faction that wants to ${r.pick(T.faction.goals)}.`,
    fields: { type: kind, leader: cap(r.pick(T.faction.leaders)), headquarters: place?.name || '', methods: cap(r.pick(T.faction.methods)), resources: cap(r.pick(T.faction.resources)), symbol: cap(r.pick(T.faction.symbols)), motto: r.pick(T.faction.mottos), ranks: r.pick(T.faction.ranks) },
    secret: r.pick(T.faction.secrets) };
}

export const randomTownName = () => townName(r);
export { aOrAn };
