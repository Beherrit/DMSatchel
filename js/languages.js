// Languages: who speaks what. A "Languages" field (any separators: "Common, Elvish; Dwarvish and Draconic"), plus the
// languages a Forge character knows. Names match whatever their case or spacing. Pure.

export const splitLanguages = (text) => String(text || '').split(/[,;\n/]|\band\b/i).map((x) => x.trim().replace(/^[-*•]\s*/, '').replace(/\.$/, '')).filter((x) => x && x.length <= 40);
const key = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();

// An entry's languages: its field, and (for a character) its Forge sheet's. extra: more names (e.g. from the sheet).
export function languagesOf(entry, extra = []) {
  const seen = new Map();
  for (const l of [...splitLanguages(entry?.fields?.languages), ...(extra || [])]) if (!seen.has(key(l))) seen.set(key(l), l);
  return [...seen.values()];
}

// Who shares a language with someone: party is [{ who, languages }] → [{ who, shared: [names] }] (those who share any).
export function sharedWith(languages, party) {
  const mine = new Set((languages || []).map(key));
  return (party || []).map((p) => ({ who: p.who, shared: (p.languages || []).filter((l) => mine.has(key(l))) })).filter((p) => p.shared.length);
}

// The party's tongues: [{ who, languages }] → [{ language, speakers: [who] }], most spoken first.
export function tongues(party) {
  const by = new Map();
  for (const p of party || []) for (const l of p.languages || []) { const k = key(l), x = by.get(k) || { language: l, speakers: [] }; if (!x.speakers.includes(p.who)) x.speakers.push(p.who); by.set(k, x); }
  return [...by.values()].sort((a, b) => b.speakers.length - a.speakers.length || a.language.localeCompare(b.language));
}

export const speaks = (languages, name) => (languages || []).some((l) => key(l) === key(name));
