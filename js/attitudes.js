// How NPCs and powers feel about each player character: stored on the character (GMs set it), read both ways.
export const ATTITUDES = ['Devoted', 'Friendly', 'Indifferent', 'Wary', 'Hostile'];
export const ATTITUDE_KINDS = ['npc', 'faction', 'guild', 'clan', 'deity', 'settlement'];

const parse = (s) => { try { const o = s ? JSON.parse(s) : {}; return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; } };

// { targetId: { a, note } } for one character, keeping only known attitudes.
export function readAttitudes(character) {
  const out = {};
  for (const [id, v] of Object.entries(parse(character?.fields?.attitudes))) if (ATTITUDES.includes(v?.a)) out[id] = { a: v.a, note: String(v.note || '').slice(0, 300) };
  return out;
}

// A new map with one attitude set (or removed with a null attitude), as the string to store.
export function withAttitude(character, targetId, a, note = '') {
  const m = readAttitudes(character);
  if (ATTITUDES.includes(a)) m[targetId] = { a, note: String(note || '').slice(0, 300) }; else delete m[targetId];
  return JSON.stringify(m);
}

// Every character's attitude from one NPC or power: [{ character, a, note }], friendliest first.
export function towards(entries, targetId) {
  return entries.filter((e) => e.kind === 'character').map((c) => ({ character: c, ...readAttitudes(c)[targetId] })).filter((x) => x.a)
    .sort((x, y) => ATTITUDES.indexOf(x.a) - ATTITUDES.indexOf(y.a) || x.character.name.localeCompare(y.character.name));
}

// Tone for styling: good, neutral or bad.
export const tone = (a) => (['Devoted', 'Friendly'].includes(a) ? 'good' : a === 'Indifferent' ? 'neutral' : 'bad');
