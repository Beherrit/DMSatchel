// Merge two entries for the same thing: one ("from") folds into the other ("into"). Pure helpers for the server.

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The surviving entry: its own text first, the other's added after; fields it lacks filled in; tags and
// connections joined (without pointing at itself or the merged-away entry).
export function mergedEntry(into, from) {
  const join = (a, b) => [String(a || '').trim(), String(b || '').trim()].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).join('\n\n');
  const fields = { ...(from.fields || {}) };
  for (const [k, v] of Object.entries(into.fields || {})) if (v != null && String(v).trim()) fields[k] = v;
  const links = relinkLinks([...(into.links || []), ...(from.links || [])], from.id, into.id, into.id);
  return {
    summary: String(into.summary || '').trim() || String(from.summary || '').trim(),
    body: join(into.body, from.body), secret: join(into.secret, from.secret), fields,
    tags: [...new Set([...(into.tags || []), ...(from.tags || [])])].slice(0, 30), links,
  };
}

// Connections that pointed at `fromId` now point at `intoId`; none at `selfId`; no repeats.
export function relinkLinks(links, fromId, intoId, selfId) {
  const seen = new Set();
  return (links || []).map((l) => (l.id === fromId ? { ...l, id: intoId } : l)).filter((l) => {
    if (l.id === selfId) return false;
    const k = `${l.id}|${String(l.label || '').toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// [[From Name]] and [[From Name|words]] become links to the surviving entry, reading as before.
export function relinkText(text, fromName, intoName) {
  if (!text || !fromName) return text;
  return String(text).replace(new RegExp(`\\[\\[\\s*${esc(fromName)}\\s*(?:\\|([^\\]]+))?\\]\\]`, 'gi'), (_, label) => {
    const shown = label || fromName;
    return shown.toLowerCase() === String(intoName).toLowerCase() ? `[[${intoName}]]` : `[[${intoName}|${shown}]]`;
  });
}
