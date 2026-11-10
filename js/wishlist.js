// Wishlists: characters' wished-for items (fields.wishlist, one per line), matched loosely against goods for sale
// ("rope" finds "Rope (50 feet)", "a good lantern" finds "Hooded lantern": every word of the wish, give or take a plural). Pure.

const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9’' ]+/g, ' ').replace(/\b(a|an|the|some|good|new|fine)\b/g, ' ').replace(/\s+/g, ' ').trim()
  .split(' ').map((w) => (w.length > 3 ? w.replace(/([^s])s$/, '$1') : w)).join(' ');

export const wishesOf = (c) => String(c?.fields?.wishlist || '').split('\n').map((x) => x.replace(/^[-*•]\s*/, '').trim()).filter(Boolean).slice(0, 40);

// Does a good match a wish? Every word of the wish appears among the good's words.
export function wishMatches(wish, good) {
  const w = norm(wish).split(' ').filter(Boolean), g = new Set(norm(good).split(' '));
  return w.length > 0 && w.every((x) => g.has(x));
}

// Who wants this good: the characters whose wishlist matches it. → [character entries].
export const wantersOf = (characters, good) => (characters || []).filter((c) => wishesOf(c).some((w) => wishMatches(w, good)));
