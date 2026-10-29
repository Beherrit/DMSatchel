// Reactions: a quick emoji on table talk and quotes, with who reacted. Stored as { emoji: { personId: name } }.
// Pure, so the server and tests share it.

export const REACTIONS = ['👍', '😂', '😮', '❤️', '🎲'];
export const isReaction = (e) => REACTIONS.includes(e);

// What the page shows: → [{ emoji, count, names, mine }] in the fixed order, only ones someone used.
export function reactionsOut(raw, myId) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return REACTIONS.map((emoji) => {
    const who = r[emoji] && typeof r[emoji] === 'object' ? r[emoji] : {};
    const ids = Object.keys(who);
    return { emoji, count: ids.length, names: ids.map((k) => String(who[k] || 'Someone')), mine: ids.includes(String(myId)) };
  }).filter((x) => x.count);
}

// The same change the server makes in SQL, for the page's own copy: → new raw object.
export function toggleReaction(raw, emoji, id, name, on) {
  const r = { ...(raw && typeof raw === 'object' ? raw : {}) };
  const who = { ...(r[emoji] || {}) };
  if (on) who[String(id)] = name; else delete who[String(id)];
  if (Object.keys(who).length) r[emoji] = who; else delete r[emoji];
  return r;
}
