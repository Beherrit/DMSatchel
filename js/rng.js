// Seeded random numbers. Every generator takes an rng so rolls can be repeated from a seed.

export function hashString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    int: (n) => Math.floor(next() * n),
    range: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    pickW(obj) {
      const entries = Array.isArray(obj) ? obj.map((e) => [e, e.weight ?? 1]) : Object.entries(obj);
      let r = next() * entries.reduce((t, [, w]) => t + w, 0);
      for (const [k, w] of entries) if ((r -= w) < 0) return k;
      return entries[entries.length - 1][0];
    },
    shuffle(list) {
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
    sample: (list, n) => rng.shuffle(list).slice(0, n),
    dice(n, sides) { let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(next() * sides); return t; },
  };
  return rng;
}

export const randomSeed = () => Math.random().toString(36).slice(2, 10);

// A child stream for one part of a generation, so rerolling one part leaves the others alone.
export const subRng = (seed, part) => makeRng(`${seed}:${part}`);
