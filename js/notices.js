// Notices from the GMs: short messages ("No game this Friday") on the world's front page and as a banner for every
// member until they dismiss it or it runs out. Stored on the world, newest first. Pure, shared by page and server.

export const MAX_NOTICES = 10;
const newId = () => Math.random().toString(36).slice(2, 10);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));

export function readNotices(list) {
  return (Array.isArray(list) ? list : []).filter((n) => n && n.id && n.text).slice(0, MAX_NOTICES);
}

// op: { add: { text, until } } | { remove: id }
export function applyNotice(list, op, who, now = new Date().toISOString()) {
  const cur = readNotices(list);
  if (op?.remove) return { list: cur.filter((n) => n.id !== op.remove) };
  const text = String(op?.add?.text ?? '').replace(/\r/g, '').trim().slice(0, 500);
  if (!text) return { error: 'Write the notice first.' };
  const until = isDate(op.add.until) ? op.add.until : null;
  if (until && until < now.slice(0, 10)) return { error: 'That date has already passed.' };
  return { list: [{ id: newId(), text, by: who, at: now, ...(until ? { until } : {}) }, ...cur].slice(0, MAX_NOTICES) };
}

// Still showing: no end date, or it ends today or later.
export const activeNotices = (list, today = new Date().toISOString().slice(0, 10)) => readNotices(list).filter((n) => !n.until || n.until >= today);
