// A world's own fields: GMs add extra fields to a kind of entry ("Deity" on NPCs, "Danger level" on locations).
// Stored on the world as { kind: [{ key, label, type, options, gmOnly }] }; values live in entry.fields under keys
// that start with x_ so they can never clash with a built-in field. Pure, shared by the page and the server.
import { KINDS } from './world-schema.js';

export const CUSTOM_TYPES = [['text', 'Short text'], ['long', 'Long text'], ['select', 'A choice from a list']];
export const MAX_PER_KIND = 12;
export const isCustomKey = (k) => /^x_[a-z0-9_]{1,40}$/.test(k);

const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'field';

// Clean one kind's list. Keys stay as they were (so values survive a rename); new fields get a key from their label.
export function cleanCustomList(kind, list) {
  if (!KINDS[kind]) return { error: 'Unknown kind of entry.' };
  if (!Array.isArray(list)) return { error: 'Send a list of fields.' };
  const builtIn = new Set(KINDS[kind].fields.map(([k, l]) => l.toLowerCase()));
  const out = [], keys = new Set(), labels = new Set();
  for (const f of list.slice(0, MAX_PER_KIND + 1)) {
    const label = String(f?.label || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!label) continue;
    if (labels.has(label.toLowerCase())) return { error: `There are two fields called “${label}”.` };
    if (builtIn.has(label.toLowerCase())) return { error: `${KINDS[kind].plural} already have a “${label}” field.` };
    const type = CUSTOM_TYPES.some(([t]) => t === f.type) ? f.type : 'text';
    const options = type === 'select' ? [...new Set((Array.isArray(f.options) ? f.options : String(f.options || '').split(','))
      .map((o) => String(o).trim().slice(0, 60)).filter(Boolean))].slice(0, 30) : null;
    if (type === 'select' && options.length < 2) return { error: `Give “${label}” at least two choices.` };
    let key = isCustomKey(f.key) ? f.key : `x_${slug(label)}`;
    for (let n = 2; keys.has(key); n++) key = `x_${slug(label)}_${n}`;
    keys.add(key); labels.add(label.toLowerCase());
    out.push({ key, label, type, ...(options ? { options } : {}), ...(f.gmOnly ? { gmOnly: true } : {}) });
  }
  if (out.length > MAX_PER_KIND) return { error: `Up to ${MAX_PER_KIND} fields per kind.` };
  return { list: out };
}

// The whole map, cleaned (for reading what's stored).
export function readCustom(custom) {
  const out = {};
  for (const [kind, list] of Object.entries(custom && typeof custom === 'object' ? custom : {})) {
    const r = cleanCustomList(kind, list);
    if (r.list?.length) out[kind] = r.list;
  }
  return out;
}

// What players are told about: fields the GMs keep to themselves are left out.
export const customForPlayers = (custom) => Object.fromEntries(Object.entries(readCustom(custom))
  .map(([k, l]) => [k, l.filter((f) => !f.gmOnly)]).filter(([, l]) => l.length));

// A kind's fields as the schema writes them, the world's own appended after the built-in ones.
export function fieldsWith(kind, custom) {
  const extra = (custom?.[kind] || []).map((f) => [f.key, f.label, f.type, f.options || null, { custom: true, ...(f.gmOnly ? { gmSecret: true } : {}) }]);
  return [...(KINDS[kind]?.fields || []), ...extra];
}

export const customKeys = (kind, custom) => new Set((custom?.[kind] || []).map((f) => f.key));
export const secretCustomKeys = (kind, custom) => (custom?.[kind] || []).filter((f) => f.gmOnly).map((f) => f.key);
