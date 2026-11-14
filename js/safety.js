// Table safety: a quiet pause (anyone can ask the game to pause or move on; only the time is kept, never who) and
// check-ins (the GM asks how everyone's doing; answers are counted, apart from the list of who has answered, so no
// answer can be traced). Pure, shared by the page and the server.

export const MOODS = ['up', 'meh', 'down'];
export const MOOD_ICON = { up: '👍', meh: '😐', down: '👎' };

// Pauses: [{ at }], the last 20. Those since the GM last marked them seen: → { count, last }.
export const addPause = (list, at = new Date().toISOString()) => [...(Array.isArray(list) ? list : []), { at }].slice(-20);
export function unseenPauses(list, seenAt) {
  const since = String(seenAt || ''), l = (Array.isArray(list) ? list : []).filter((p) => p && String(p.at) > since);
  return { count: l.length, last: l.length ? l[l.length - 1].at : null };
}

// A check-in: { id, question, at, tally: { up, meh, down }, voted: [member ids] }.
export const newCheckin = (question, at = new Date().toISOString()) => ({ id: `c${Date.parse(at) || Date.now()}`, question: String(question || 'How’s everyone doing?').trim().slice(0, 140) || 'How’s everyone doing?', at, tally: { up: 0, meh: 0, down: 0 }, voted: [] });
export function answerCheckin(c, voter, mood) {
  if (!c || !MOODS.includes(mood)) return { error: 'Pick one.' };
  if ((c.voted || []).includes(voter)) return { error: 'You’ve already answered this one.' };
  return { checkin: { ...c, tally: { ...c.tally, [mood]: (Number(c.tally?.[mood]) || 0) + 1 }, voted: [...(c.voted || []), voter] } };
}
