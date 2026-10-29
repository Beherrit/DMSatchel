// Tag colours: GMs give a tag one of eight colours (the same validated categorical palette as Who holds what), and
// its chips everywhere show it as a coloured edge; the text stays in ink. Kept per world as { tag: slot }. Pure, so
// it can be tested.

export const TAG_COLORS = ['Blue', 'Orange', 'Green', 'Gold', 'Pink', 'Deep green', 'Purple', 'Red'];
const MAX = 100;

const cleanTagName = (t) => String(t || '').trim().replace(/^#+/, '').toLowerCase().slice(0, 40);

// { tag, color: 0–7 or null } → { map } or { error }; null takes the colour off.
export function applyTagColor(raw, tag, color) {
  const map = Object.fromEntries(Object.entries(raw && typeof raw === 'object' ? raw : {}).filter(([k, v]) => k && Number.isInteger(v) && v >= 0 && v < TAG_COLORS.length));
  const t = cleanTagName(tag);
  if (!t) return { error: 'Which tag?' };
  if (color === null || color === undefined || color === '') { delete map[t]; return { map }; }
  const c = Number(color);
  if (!Number.isInteger(c) || c < 0 || c >= TAG_COLORS.length) return { error: 'Pick one of the colours.' };
  if (!(t in map) && Object.keys(map).length >= MAX) return { error: 'That’s a lot of coloured tags already.' };
  map[t] = c;
  return { map };
}

// The colour slot for a tag, or -1.
export const tagSlot = (map, tag) => (map && Number.isInteger(map[cleanTagName(tag)]) ? map[cleanTagName(tag)] : -1);
