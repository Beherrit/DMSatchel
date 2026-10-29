// "What needs writing": thin spots in a world for GMs to fill in. Pure, so it can be tested.
import { PLACE_KINDS } from './world-schema.js';
import { readObjectives } from './objectives.js';

// Kinds that are records of play or reference, not things to flesh out.
const SKIP = new Set(['session', 'journal', 'downtime', 'rule', 'creature', 'table', 'encounter', 'character', 'handout']);

// [[Names]] that point at no entry yet: → [{ name, from: [entries that mention it] }], most mentioned first.
// Names are compared ignoring case and spacing, the way links are followed.
export function missingLinks(entries) {
  const live = entries.filter((e) => (e.status || 'live') === 'live' && !e.deleted);
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const known = new Set(live.map((e) => norm(e.name)));
  const missing = new Map();
  for (const e of live) {
    const text = [e.summary, e.body, e.secret, ...Object.values(e.fields || {}).filter((v) => typeof v === 'string')].join('\n');
    for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
      const name = m[1].replace(/\s+/g, ' ').trim(), k = norm(name);
      if (!k || known.has(k)) continue;
      if (!missing.has(k)) missing.set(k, { name, from: [] });
      const x = missing.get(k);
      if (!x.from.includes(e)) x.from.push(e);
    }
  }
  return [...missing.values()].sort((a, b) => b.from.length - a.from.length || a.name.localeCompare(b.name));
}

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
