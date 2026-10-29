// The GMs' prep checklist: their own steps before each session (print sheets, update the map). Ticks belong to one
// session (round = the next session's number), so they clear by themselves when a new session is logged.
// Kept in the world's session prep as { items: [{ id, text }], done: [ids], round }. Pure, shared with the server.

export const CHECK_MAX = 40;
const clip = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);

export function readChecklist(raw, round) {
  const items = (Array.isArray(raw?.items) ? raw.items : []).filter((x) => x && x.id && clip(x.text)).slice(0, CHECK_MAX).map((x) => ({ id: String(x.id).slice(0, 20), text: clip(x.text) }));
  const done = raw?.round === round && Array.isArray(raw?.done) ? raw.done.filter((id) => items.some((x) => x.id === id)) : [];
  return { items, done, round };
}

// op: { add: text } | { remove: id } | { done: id, on } | { order: [ids] } → { list } or { error }.
export function applyChecklist(raw, op, round, newId = () => `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`) {
  const cur = readChecklist(raw, round);
  if (op?.add !== undefined) {
    const text = clip(op.add);
    if (!text) return { error: 'Write the step first.' };
    if (cur.items.length >= CHECK_MAX) return { error: `Keep it to ${CHECK_MAX} steps.` };
    return { list: { ...cur, items: [...cur.items, { id: newId(), text }] } };
  }
  if (op?.remove !== undefined) return { list: { ...cur, items: cur.items.filter((x) => x.id !== op.remove), done: cur.done.filter((id) => id !== op.remove) } };
  if (op?.done !== undefined) {
    if (!cur.items.some((x) => x.id === op.done)) return { error: 'That step was removed.' };
    const done = cur.done.filter((id) => id !== op.done);
    return { list: { ...cur, done: op.on === false ? done : [...done, op.done] } };
  }
  if (Array.isArray(op?.order)) {
    const pos = new Map(op.order.map((id, i) => [id, i]));
    return { list: { ...cur, items: [...cur.items].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)) } };
  }
  return { error: 'Nothing to change.' };
}
