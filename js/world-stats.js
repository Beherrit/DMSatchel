// The world in numbers: counts and fun facts from the entries someone can see. Pure, so it can be tested.
// idsIn(text) → the ids a text links ([[mentions]]), as an array or a Set.

const PLACES = ['region', 'area', 'settlement', 'location'];
const textOf = (e) => [e.summary, e.body, ...Object.values(e.fields || {}).filter((v) => typeof v === 'string')].join('\n');
const top = (map, n = 5) => [...map].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1] || String(a[0].name ?? a[0]).localeCompare(String(b[0].name ?? b[0]))).slice(0, n);
const words = (s) => (String(s || '').match(/[\p{L}\p{N}'’-]+/gu) || []).length;

export function worldStats(entries, idsIn = () => [], now = Date.now()) {
  const list = (entries || []).filter((e) => (e.status || 'live') === 'live');
  const byId = new Map(list.map((e) => [e.id, e]));
  const kinds = new Map();
  for (const e of list) kinds.set(e.kind, (kinds.get(e.kind) || 0) + 1);

  // Mentions and connections pointing at each entry (from other entries).
  const pointed = new Map();
  for (const e of list) {
    const to = new Set([...idsIn(textOf(e))].concat((e.links || []).map((l) => l.id)));
    to.delete(e.id);
    for (const id of to) if (byId.has(id)) pointed.set(byId.get(id), (pointed.get(byId.get(id)) || 0) + 1);
  }
  const npcs = new Map([...pointed].filter(([e]) => e.kind === 'npc'));

  // What's inside each place (anything whose chain of "located in" reaches it).
  const inside = new Map();
  for (const e of list) {
    let p = byId.get(e.parent_id), guard = 0;
    while (p && guard++ < 12) { if (PLACES.includes(p.kind)) inside.set(p, (inside.get(p) || 0) + 1); p = byId.get(p.parent_id); }
  }

  const writers = new Map();
  for (const e of list) if (e.created_by) writers.set(e.created_by, (writers.get(e.created_by) || 0) + 1);

  const sessions = list.filter((e) => e.kind === 'session').sort((a, b) => (parseFloat(a.fields?.number) || 0) - (parseFloat(b.fields?.number) || 0) || String(a.created_at).localeCompare(String(b.created_at)));
  const openQuests = list.filter((e) => e.kind === 'quest' && ['Active', 'Available'].includes(e.fields?.status) && e.created_at)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const longest = openQuests[0] ? { quest: openQuests[0], days: Math.max(0, Math.floor((now - Date.parse(openQuests[0].created_at)) / 86400000)) } : null;

  return {
    entries: list.length,
    kinds: [...kinds].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    words: list.reduce((t, e) => t + words(textOf(e)), 0),
    sessions: { count: sessions.length, first: sessions[0] || null, last: sessions.at(-1) || null },
    characters: list.filter((e) => e.kind === 'character').length,
    fallen: list.filter((e) => e.kind === 'character' && e.fields?.status === 'Dead').length,
    questsDone: list.filter((e) => e.kind === 'quest' && e.fields?.status === 'Completed').length,
    mentionedNpcs: top(npcs),
    mostConnected: top(pointed, 1)[0] || null,
    busiestPlaces: top(inside),
    writers: top(writers),
    longestQuest: longest,
  };
}
