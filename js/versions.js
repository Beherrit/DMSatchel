// Entry versions: each create, edit or import saves a snapshot of the entry as it was afterwards. These helpers say
// what changed between two snapshots and build the entry to save when a GM restores one. Pure, so they can be tested.
import { KINDS } from './world-schema.js';

// Live state that keeps changing at the table; a restore never rolls it back.
export const LIVE_FIELDS = ['play', 'known', 'spread', 'attendance', 'attitudes'];

// A world's own fields (x_…) aren't in the schema; their key reads well enough without the prefix.
const label = (kind, k) => KINDS[kind]?.fields.find(([key]) => key === k)?.[1] || (k.startsWith('x_') ? k.slice(2).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : k);
const same = (a, b) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '');

// [{ key, label, before, after }] for the parts that differ (before = older snapshot).
export function diffVersions(before, after) {
  if (!after) return [];
  const b = before || {}, out = [];
  const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
  for (const [k, l] of [['name', 'Name'], ['kind', 'Type'], ['summary', 'Summary'], ['body', 'Description'], ['secret', 'GM secret'], ['tags', 'Tags'], ['parent_id', 'Located in'], ['links', 'Connections'], ['visibility', 'Who can see it']]) {
    if (!same(b[k], after[k]) && !(empty(b[k]) && empty(after[k]))) out.push({ key: k, label: l, before: b[k], after: after[k] });
  }
  const keys = new Set([...Object.keys(b.fields || {}), ...Object.keys(after.fields || {})]);
  for (const k of keys) if (!LIVE_FIELDS.includes(k) && !same(b.fields?.[k], after.fields?.[k])) out.push({ key: `fields.${k}`, label: label(after.kind || b.kind, k), before: b.fields?.[k], after: after.fields?.[k] });
  return out;
}

// The entry to save to put `current` back as it was in `snapshot`, keeping live state and the version number.
export function restoreFrom(current, snapshot) {
  const keep = Object.fromEntries(LIVE_FIELDS.filter((k) => current.fields?.[k] != null).map((k) => [k, current.fields[k]]));
  const fields = { ...Object.fromEntries(Object.entries(snapshot.fields || {}).filter(([k]) => !LIVE_FIELDS.includes(k))), ...keep };
  return {
    ...current, kind: snapshot.kind || current.kind, name: snapshot.name ?? current.name, summary: snapshot.summary ?? '', body: snapshot.body ?? '',
    secret: snapshot.secret ?? current.secret ?? '', tags: snapshot.tags || [], links: snapshot.links || [], parent_id: snapshot.parent_id ?? null,
    visibility: current.visibility, fields,
  };
}

// A short line for a changed value.
export const brief = (v, n = 80) => { const s = Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? x.label || x.id : x)).join(', ') : String(v ?? ''); return s.length > n ? `${s.slice(0, n - 1)}…` : s || '(empty)'; };
