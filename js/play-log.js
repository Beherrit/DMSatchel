// What happened to my coin?: changes made to a character's sheet from outside it (a split, a hand-out, living
// costs, rations, a purchase, a rest) leave a short line in play.log, newest last, the last 30 kept. Pure, so the
// page and the server share it.

export const LOG_MAX = 30;

export const readLog = (play) => (Array.isArray(play?.log) ? play.log.filter((x) => x && x.text) : []);

// Adds a line to play (in place) and returns play.
export function addLog(play, text, by = '', at = new Date().toISOString()) {
  const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!t) return play;
  play.log = [...readLog(play), { at: String(at).slice(0, 40), text: t, ...(by ? { by: String(by).slice(0, 80) } : {}) }].slice(-LOG_MAX);
  return play;
}
