// Notes pinned to the next session ("give Pip the letter"): one-off reminders the GMs jot between sessions, shown at
// the top of session prep and on the printable sheet, ticked off when done. Kept in the world's session prep as
// prep.reminders: [{ id, text, done }]. Pure, shared with the server.

export const REMINDER_MAX = 50;
const clip = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
const read = (raw) => (Array.isArray(raw) ? raw : []).filter((r) => r && r.id && clip(r.text)).slice(0, REMINDER_MAX)
  .map((r) => ({ id: String(r.id).slice(0, 20), text: clip(r.text), done: Boolean(r.done) }));

export const readReminders = read;
export const openReminders = (raw) => read(raw).filter((r) => !r.done);

// op: { add: text } | { done: id, on } | { remove: id } | { clear_done: true } → { list } or { error }.
export function applyReminder(raw, op, newId = () => `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`) {
  const list = read(raw);
  if (op?.add !== undefined) {
    const text = clip(op.add);
    if (!text) return { error: 'Write the note first.' };
    if (list.length >= REMINDER_MAX) return { error: 'That’s a lot of notes: clear the done ones first.' };
    return { list: [...list, { id: newId(), text, done: false }] };
  }
  if (op?.done !== undefined) {
    if (!list.some((r) => r.id === op.done)) return { error: 'That note was removed.' };
    return { list: list.map((r) => (r.id === op.done ? { ...r, done: op.on !== false } : r)) };
  }
  if (op?.remove !== undefined) return { list: list.filter((r) => r.id !== op.remove) };
  if (op?.clear_done) return { list: list.filter((r) => !r.done) };
  return { error: 'Nothing to change.' };
}
