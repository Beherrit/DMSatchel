// Roll a detail: one field of an entry filled from the app's tables (an NPC's looks, voice, manner and wants; a
// settlement's trouble; what a place looks and sounds like). Pure given an rng, so it can be tested.
import { NPC, TOWN, TAVERN, ENV } from './tables.js';

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
// A sentence: capitalised, with a full stop unless it already ends in one.
const say = (t) => { const c = cap(t); return /[.!?…”"]$/.test(c) ? c : `${c}.`; };
const two = (rng, list) => { const a = rng.pick(list); let b = rng.pick(list); for (let i = 0; b === a && i < 5; i++) b = rng.pick(list); return [a, b]; };

// Which sensory table suits a place, from its type (a location's or an area's).
const SCENE = { Tavern: 'Tavern', Shop: 'City street', Dungeon: 'Dungeon', Ruin: 'Dungeon', Lair: 'Cave', Castle: 'Castle', Temple: 'Temple',
  Forest: 'Forest', Hills: 'Mountain', Mountains: 'Mountain', Coast: 'Coast', Island: 'Coast', Swamp: 'Swamp', Underdark: 'Cave', 'City district': 'City street' };
const scene = (rng, type) => { const env = ENV[SCENE[type]]; return env ? `${cap(rng.pick(env.see))}; ${rng.pick(env.hear)}; ${rng.pick(env.smell)}.` : null; };

// kind → field → (rng, fields) → text (or null when nothing suits).
const ROLLERS = {
  npc: {
    appearance: (rng) => say(rng.pick(NPC.look)),
    personality: (rng) => `${say(rng.pick(NPC.personality))} ${say(rng.pick(NPC.mannerism))}`,
    voice: (rng) => say(rng.pick(NPC.voice)),
    wants: (rng) => say(rng.pick(NPC.want)),
    secret: (rng) => say(rng.pick(NPC.secret)),
  },
  settlement: {
    known_for: (rng) => say(rng.pick(TOWN.known)),
    trouble: (rng) => say(rng.pick(TOWN.problem)),
    ruler: (rng) => cap(rng.pick(TOWN.leader)),
    landmarks: (rng) => two(rng, TOWN.spots).map((s) => `- ${cap(s)}`).join('\n'),
  },
  location: {
    features: (rng, f) => (f?.type === 'Tavern' ? `${say(rng.pick(TAVERN.vibe))} ${scene(rng, 'Tavern')}` : scene(rng, f?.type)),
  },
  area: {
    features: (rng, f) => scene(rng, f?.type),
  },
};

// Is there a table for this field at all (a place's features also need a type that suits)?
export const hasRoller = (kind, key) => Boolean(ROLLERS[kind]?.[key]);

// Can this field be rolled for this kind (given the entry's other fields, e.g. a location's type)?
export const canRoll = (kind, key, fields = {}) => {
  const fn = ROLLERS[kind]?.[key];
  if (!fn) return false;
  return key !== 'features' || Boolean(SCENE[fields?.type]);
};

export const rollDetail = (kind, key, rng, fields = {}) => (canRoll(kind, key, fields) ? ROLLERS[kind][key](rng, fields) : null);
