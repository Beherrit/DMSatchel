// Quest objectives: a checklist of steps stored on the quest as JSON. GMs can keep a step secret until the party
// finds out about it; the server leaves secret steps out for players.

const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return Array.isArray(v) ? v : []; } catch { return []; } };

export const readObjectives = (quest) => parse(quest?.fields?.objectives)
  .filter((o) => o && typeof o.text === 'string' && o.text.trim())
  .map((o) => ({ id: String(o.id || ''), text: o.text.slice(0, 300), done: Boolean(o.done), secret: Boolean(o.secret) }));

// What players may see: everything but the secret steps.
export const forPlayers = (raw) => JSON.stringify(parse(raw).filter((o) => o && !o.secret));

export function progress(list) {
  const done = list.filter((o) => o.done).length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

const newId = () => `o${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
export const addObjective = (list, text, secret = false) => [...list, { id: newId(), text: String(text).trim().slice(0, 300), done: false, secret: Boolean(secret) }];
export const updateObjective = (list, id, patch) => list.map((o) => (o.id === id ? { ...o, ...patch } : o));
export const removeObjective = (list, id) => list.filter((o) => o.id !== id);
export const moveObjective = (list, id, by) => {
  const i = list.findIndex((o) => o.id === id), j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const out = [...list]; [out[i], out[j]] = [out[j], out[i]]; return out;
};
