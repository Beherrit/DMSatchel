// Character goals: what a player wants for their character, short term and long term, stored on the character as
// JSON. A goal can be kept from the rest of the party (only its player and the GMs see it). GMs and the player mark
// goals advanced or done. Pure, shared by the page and the server.

export const TERMS = [['short', 'Short term'], ['long', 'Long term']];
export const STATES = [['open', 'Open'], ['advanced', 'Advanced'], ['done', 'Done']];

const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return Array.isArray(v) ? v : []; } catch { return []; } };

export const readGoals = (c) => parse(c?.fields?.goals)
  .filter((g) => g && typeof g.text === 'string' && g.text.trim())
  .map((g) => ({ id: String(g.id || ''), text: g.text.slice(0, 300), term: g.term === 'long' ? 'long' : 'short',
    state: STATES.some(([s]) => s === g.state) ? g.state : 'open', secret: Boolean(g.secret), ...(g.at ? { at: String(g.at) } : {}) }));

// What the rest of the party may see.
export const goalsForOthers = (raw) => JSON.stringify(parse(raw).filter((g) => g && !g.secret));

const newId = () => `g${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
export const addGoal = (list, text, term = 'short', secret = false) =>
  [...list, { id: newId(), text: String(text).trim().slice(0, 300), term: term === 'long' ? 'long' : 'short', state: 'open', secret: Boolean(secret) }];
export const setGoal = (list, id, patch, now = new Date().toISOString()) =>
  list.map((g) => (g.id === id ? { ...g, ...patch, ...(patch.state && patch.state !== g.state ? { at: now } : {}) } : g));
export const removeGoal = (list, id) => list.filter((g) => g.id !== id);

// Open and advanced goals, short ones first (the ones to bring into the next session).
export const activeGoals = (list) => list.filter((g) => g.state !== 'done').sort((a, b) => (a.term === b.term ? 0 : a.term === 'short' ? -1 : 1));
