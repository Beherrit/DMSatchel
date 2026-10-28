// Suggest an edit: players propose changes to an entry they can see but not edit; GMs see the difference and accept
// or decline. Pure helpers shared by the page and the server.

// The fields a player may propose changes to: shown on the form, and not hidden JSON, pictures, GM-only or the
// structured blocks (stat blocks, spells, shop stock, sheets) that have their own editors.
const STRUCTURED = new Set(['stats', 'spells', 'level', 'stock', 'market', 'encounters', 'sheet']);
export const suggestableFields = (fields) => fields.filter(([k, , type, , o]) => !['hidden', 'image'].includes(type) && !o?.gmOnly && !o?.gmSecret && !STRUCTURED.has(k));

const clip = (v, n) => String(v ?? '').replace(/\r/g, '').slice(0, n);

// What a player proposes, cleaned against the entry as it is now: only parts that actually change are kept.
// → { summary?, body?, fields? } (empty object when nothing changes)
export function cleanProposal(entry, input, fields) {
  const p = {};
  if (input?.summary !== undefined && clip(input.summary, 4000).trim() !== String(entry.summary || '').trim()) p.summary = clip(input.summary, 4000).trim();
  if (input?.body !== undefined && clip(input.body, 40000).trim() !== String(entry.body || '').trim()) p.body = clip(input.body, 40000).trim();
  const allowed = new Set(suggestableFields(fields).map(([k]) => k));
  const f = {};
  for (const [k, v] of Object.entries(input?.fields || {})) {
    if (!allowed.has(k)) continue;
    const val = clip(v, 4000).trim();
    if (val !== String(entry.fields?.[k] || '').trim()) f[k] = val;
  }
  if (Object.keys(f).length) p.fields = f;
  return p;
}

// The entry with the proposal applied (a field set to '' is cleared).
export function applyProposal(entry, p) {
  const fields = { ...(entry.fields || {}) };
  for (const [k, v] of Object.entries(p.fields || {})) { if (v) fields[k] = v; else delete fields[k]; }
  return { ...entry, ...(p.summary !== undefined ? { summary: p.summary } : {}), ...(p.body !== undefined ? { body: p.body } : {}), fields };
}
