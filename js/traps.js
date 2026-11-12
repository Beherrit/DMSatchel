// Traps on a place: a list the GMs keep ([{ id, text, state }]), each armed, found, disarmed or sprung. Players only
// ever receive the ones no longer hidden (found, disarmed or sprung). Pure, shared by the page and the server.

export const TRAP_STATES = ['armed', 'found', 'disarmed', 'sprung'];
const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return Array.isArray(v) ? v : []; } catch { return []; } };

export const readTraps = (place) => parse(place?.fields?.traps).filter((t) => t && typeof t.text === 'string' && t.text.trim())
  .map((t) => ({ id: String(t.id || ''), text: t.text.slice(0, 300), state: TRAP_STATES.includes(t.state) ? t.state : 'armed' })).slice(0, 40);

const newId = () => `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
export const addTrap = (list, text) => [...list, { id: newId(), text: String(text).trim().slice(0, 300), state: 'armed' }];
export const setTrap = (list, id, state) => list.map((t) => (t.id === id && TRAP_STATES.includes(state) ? { ...t, state } : t));
export const removeTrap = (list, id) => list.filter((t) => t.id !== id);

// What players may see: the traps no longer hidden.
export const trapsForPlayers = (raw) => JSON.stringify(parse(raw).filter((t) => t && ['found', 'disarmed', 'sprung'].includes(t.state)));
export const armedCount = (list) => list.filter((t) => t.state === 'armed').length;
