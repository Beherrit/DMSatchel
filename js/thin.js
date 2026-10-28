// "What needs writing": thin spots in a world for GMs to fill in. Pure, so it can be tested.
import { PLACE_KINDS } from './world-schema.js';
import { readObjectives } from './objectives.js';

// Kinds that are records of play or reference, not things to flesh out.
const SKIP = new Set(['session', 'journal', 'downtime', 'rule', 'creature', 'table', 'encounter', 'character', 'handout']);

export function thinSpots(entries, now = Date.now()) {
  const live = entries.filter((e) => (e.status || 'live') === 'live' && !e.deleted);
  const childrenOf = new Map();
  for (const e of live) if (e.parent_id) { if (!childrenOf.has(e.parent_id)) childrenOf.set(e.parent_id, []); childrenOf.get(e.parent_id).push(e); }
  const inside = (id) => { const out = [], stack = [...(childrenOf.get(id) || [])]; while (stack.length) { const x = stack.pop(); out.push(x); stack.push(...(childrenOf.get(x.id) || [])); } return out; };
  const linkedTo = new Set(live.flatMap((e) => (e.links || []).map((l) => l.id)));
  const blank = (s) => !String(s || '').trim();
  return {
    undescribed: live.filter((e) => !SKIP.has(e.kind) && blank(e.summary) && blank(e.body)),
    emptyPlaces: live.filter((e) => ['settlement', 'location'].includes(e.kind) && !inside(e.id).some((x) => x.kind === 'npc')),
    flatNpcs: live.filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead' && blank(e.fields?.voice) && blank(e.fields?.wants)),
    questsNoSteps: live.filter((e) => e.kind === 'quest' && ['Active', 'Available'].includes(e.fields?.status) && !readObjectives(e).length),
    longHidden: live.filter((e) => e.visibility === 'gm' && !SKIP.has(e.kind) && now - Date.parse(e.created_at || 0) > 30 * 86400000),
    unconnected: live.filter((e) => !SKIP.has(e.kind) && !e.parent_id && !(e.links || []).length && !linkedTo.has(e.id) && !childrenOf.has(e.id) && e.kind !== 'region'),
  };
}
