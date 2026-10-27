// Relationships between powers (factions, guilds, houses…), read from and written to entry connections, so the
// grid, the relationship web and entry pages all agree. Pure functions over entry lists, for testing.

// key, connection label, short mark, grid label, whether it reads the same both ways
export const RELATIONS = [
  { key: 'ally', label: 'ally of', mark: '✚', name: 'Allied', mutual: true },
  { key: 'trade', label: 'trades with', mark: '⇄', name: 'Trading partners', mutual: true },
  { key: 'rival', label: 'rival of', mark: '≠', name: 'Rivals', mutual: true },
  { key: 'enemy', label: 'enemy of', mark: '✖', name: 'Enemies', mutual: true },
  { key: 'war', label: 'at war with', mark: '⚔', name: 'At war', mutual: true },
  { key: 'serves', label: 'serves', mark: '→', name: 'Serves', mutual: false },
  { key: 'secret', label: 'secretly works for', mark: '⋯', name: 'Secretly works for', mutual: false, secret: true },
];
const BY_LABEL = new Map(RELATIONS.map((r) => [r.label, r]));
export const relationByKey = (k) => RELATIONS.find((r) => r.key === k) || null;

// How a and b relate: {rel, from, to} or null. A connection either way counts; the first one found wins,
// with secret ones only when `withSecret` (GMs).
export function between(a, b, { withSecret = true } = {}) {
  for (const [x, y] of [[a, b], [b, a]]) {
    for (const l of x.links || []) {
      if (l.id !== y.id) continue;
      const rel = BY_LABEL.get(String(l.label || '').toLowerCase());
      if (!rel || ((rel.secret || l.secret) && !withSecret)) continue;
      return { rel, from: x.id, to: y.id, secret: Boolean(l.secret || rel.secret) };
    }
  }
  return null;
}

// New link lists for a and b after setting how a relates to b (null clears it). Other connections are kept.
export function setBetween(a, b, key) {
  const strip = (x, y) => (x.links || []).filter((l) => !(l.id === y.id && BY_LABEL.has(String(l.label || '').toLowerCase())));
  const aLinks = strip(a, b), bLinks = strip(b, a);
  const rel = key && relationByKey(key);
  if (rel) aLinks.push({ id: b.id, label: rel.label, secret: Boolean(rel.secret) });
  return { aLinks, bLinks };
}

// Counts per power: how many allies, enemies (enemy or war) and so on.
export function tally(powers, opts) {
  const out = new Map(powers.map((p) => [p.id, { ally: 0, trade: 0, rival: 0, enemy: 0, war: 0, serves: 0, secret: 0 }]));
  for (let i = 0; i < powers.length; i++) for (let j = i + 1; j < powers.length; j++) {
    const r = between(powers[i], powers[j], opts);
    if (!r) continue;
    out.get(powers[i].id)[r.rel.key]++; out.get(powers[j].id)[r.rel.key]++;
  }
  return out;
}

// Trouble brewing: a power allied with two powers who are enemies or at war with each other.
export function tensions(powers, opts) {
  const out = [];
  for (const p of powers) {
    const friends = powers.filter((q) => q !== p && between(p, q, opts)?.rel.key === 'ally');
    for (let i = 0; i < friends.length; i++) for (let j = i + 1; j < friends.length; j++) {
      const r = between(friends[i], friends[j], opts);
      if (r && ['enemy', 'war'].includes(r.rel.key)) out.push({ power: p, a: friends[i], b: friends[j], rel: r.rel });
    }
  }
  return out;
}
