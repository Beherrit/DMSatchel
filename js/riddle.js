// Riddles on handouts: the answer (GM-only; several accepted, separated by "|"), checked against a guess whatever its
// case, spacing, punctuation or a leading "a"/"an"/"the"; who has solved it; and the hints shown so far. Pure,
// shared by the page and the server.

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(a|an|the) /, '');

export const answersOf = (text) => String(text || '').split('|').map((x) => x.trim()).filter(Boolean);
export const isRight = (guess, answer) => { const g = norm(guess); return !!g && answersOf(answer).some((a) => norm(a) === g); };

// Who solved it: [{ name, at }], first solver first.
export const readSolved = (raw) => { try { const v = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(v) ? v.filter((x) => x && x.name).map((x) => ({ name: String(x.name).slice(0, 80), at: String(x.at || '').slice(0, 40) })) : []; } catch { return []; } };
export const addSolver = (raw, name, at = new Date().toISOString()) => { const list = readSolved(raw); return list.some((x) => x.name === name) ? list : [...list, { name: String(name).slice(0, 80), at }]; };

// Hints: one per line; the first `shown` of them are revealed.
export const hintsOf = (text) => String(text || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12);
export const shownHints = (text, shown) => hintsOf(text).slice(0, Math.max(0, Math.min(12, Math.round(Number(shown) || 0))));
