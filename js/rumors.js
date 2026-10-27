// The rumor mill. A rumor starts in one town and, each time the GM lets rumors spread, may travel to towns that
// are linked to it or sit in the same area or region, changing a little with every retelling.
// Works on plain lists of entries so it can be tested without the page.

const HEDGES = ['Folk in {from} swear that', 'A peddler from {from} said', 'My cousin heard in {from} that', 'They’re saying in {from} that', 'Word from {from} is that', 'Some drunk from {from} claimed'];
const TWISTS = [', and the town guard is in on it', ', though nobody who went to look has come back', ', and there’s a reward for proof', ', but it happened twice, not once', ', and it was cursed', ', and a noble family wants it kept quiet',
  ', and someone saw a cloaked stranger the night before', ', and the temple won’t talk about it', ', and it’s worse than it sounds'];
const BIGGER = { a: 'a dozen', one: 'three', two: 'a score of', few: 'hundreds of', small: 'huge', little: 'great', old: 'ancient', strange: 'monstrous', lost: 'stolen', missing: 'dead', sick: 'dying' };

// A retelling: exaggerate, swap a name, or add a detail. Always says where it came from.
export function retell(text, { rng, from = 'the next town', names = [] }) {
  let t = String(text).replace(/^(Folk in|A peddler from|My cousin heard in|They’re saying in|Word from|Some drunk from) .+? (?:swear that|said|that|is that|claimed) /, '');
  const roll = rng.next();
  if (roll < 0.3) {
    t = t.replace(/\b(\d+)\b/, (n) => String(Number(n) * (2 + rng.int(4))));
    const k = Object.keys(BIGGER).find((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
    if (k) t = t.replace(new RegExp(`\\b${k}\\b`, 'i'), BIGGER[k]);
  } else if (roll < 0.55 && names.length) {
    const present = names.filter((n) => t.includes(n));
    if (present.length) { const a = rng.pick(present); const others = names.filter((n) => n !== a); if (others.length) t = t.replace(a, rng.pick(others)); }
    else t = t.replace(/\.?$/, rng.pick(TWISTS) + '.');
  } else if (roll < 0.8) t = t.replace(/\.?$/, rng.pick(TWISTS) + '.');
  const hedge = rng.pick(HEDGES).replace('{from}', from);
  return `${hedge} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
}

const isTown = (e) => e?.kind === 'settlement';

// Towns a rumor in `town` can reach, with the chance it gets there in one spread.
export function neighbors(town, entries) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const out = new Map();
  const add = (e, p) => { if (isTown(e) && e.id !== town.id) out.set(e.id, Math.max(out.get(e.id) || 0, p)); };
  for (const l of town.links || []) add(byId.get(l.id), 0.6);
  for (const e of entries) if ((e.links || []).some((l) => l.id === town.id)) add(e, 0.6);
  if (town.parent_id) for (const e of entries) if (e.parent_id === town.parent_id) add(e, 0.5);
  // The region or area the town sits in: anything inside it, at any depth.
  let top = byId.get(town.parent_id), guard = 0;
  while (top?.parent_id && byId.get(top.parent_id) && guard++ < 8) top = byId.get(top.parent_id);
  if (top) {
    const inside = new Set([top.id]); let grew = true;
    while (grew) { grew = false; for (const e of entries) if (e.parent_id && inside.has(e.parent_id) && !inside.has(e.id)) { inside.add(e.id); grew = true; } }
    for (const e of entries) if (inside.has(e.id)) add(e, 0.25);
  }
  return out;
}

export const spreadOf = (r) => { try { return JSON.parse(r.fields?.spread || '{}') || {}; } catch { return {}; } };

// Where a rumor is known: its home town and everywhere it has spread, with the version told there.
export function reach(r) {
  const out = r.parent_id ? { [r.parent_id]: { text: r.summary || r.name, hops: 0 } } : {};
  return { ...out, ...spreadOf(r) };
}

// One round of spreading. Returns [{rumor, spread}] for rumors that reached somewhere new.
export function spreadRumors(entries, rng) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const names = entries.filter((e) => e.kind === 'npc').map((e) => e.name).slice(0, 400);
  const changes = [];
  for (const r of entries.filter((e) => e.kind === 'rumor')) {
    const known = reach(r);
    const next = { ...spreadOf(r) };
    let moved = false;
    for (const [townId, v] of Object.entries(known)) {
      const town = byId.get(townId); if (!town) continue;
      for (const [nid, p] of neighbors(town, entries)) {
        if (known[nid] || next[nid] || !rng.chance(p * (v.hops > 3 ? 0.5 : 1))) continue;
        next[nid] = { text: rng.chance(0.7) ? retell(v.text, { rng, from: town.name, names }) : v.text, hops: (v.hops || 0) + 1, from: townId };
        moved = true;
      }
    }
    if (moved) changes.push({ rumor: r, spread: next });
  }
  return changes;
}

// The truth about a rumor, kept in the GM-only secret text as a first line "Truth: …".
export const truthOf = (r) => (String(r.secret || '').match(/^Truth:\s*([^\n.]+)/) || [])[1] || null;
