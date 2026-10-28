// Spotlight: which player characters have had the least attention lately, from the last few session logs. A
// character counts as in the spotlight in a session when the log names them ([[Name]], their full name, or their
// first name); sessions they missed (per attendance) don't count against them. Pure, so it can be tested.
import { readAttendance } from './advancement.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const COMMON = new Set(['the', 'sir', 'lady', 'lord', 'old', 'young', 'brother', 'sister', 'captain', 'master']);

// Names a log might use for a character: the full name, and the first word when it's distinctive enough.
export function namesFor(name) {
  const full = String(name || '').trim();
  const first = full.split(/\s+/)[0];
  return [...new Set([full, first.length >= 3 && !COMMON.has(first.toLowerCase()) ? first : null].filter(Boolean))];
}

export function mentionsIn(text, name) {
  const t = String(text || '');
  return namesFor(name).some((n) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(n)}($|[^\\p{L}\\p{N}])`, 'iu').test(t));
}

const logText = (s) => [s.summary, s.body, s.fields?.next, s.fields?.loot].filter(Boolean).join('\n');

// → [{ character, attended, featured, last, share }] least attention first; looks at the last `recent` sessions.
export function spotlight(entries, recent = 4) {
  const sessions = entries.filter((e) => e.kind === 'session')
    .sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)));
  const look = sessions.slice(0, recent);
  const all = sessions;
  return entries.filter(ACTIVE).map((c) => {
    let attended = 0, featured = 0;
    for (const s of look) {
      const att = readAttendance(s).chars;
      const there = !att.length || att.some((x) => x.id === c.id);
      const named = mentionsIn(logText(s), c.name);
      if (there || named) attended++;
      if (named) featured++;
    }
    const lastS = all.find((s) => mentionsIn(logText(s), c.name));
    return { character: c, attended, featured, last: lastS ? lastS.fields?.number || lastS.name : null, share: attended ? featured / attended : 1 };
  }).sort((a, b) => a.share - b.share || (a.featured - b.featured) || String(a.character.name).localeCompare(String(b.character.name)));
}
