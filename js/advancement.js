// Attendance, XP and milestones from the session log. Each session can record who came, XP for each, and whether
// it was a milestone; a milestone is owed to a character until their level passes the level they had then.

// XP needed for each level (index = level), from the 2024 rules.
export const XP_FOR_LEVEL = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
export const levelForXp = (xp) => { let l = 1; while (l < 20 && xp >= XP_FOR_LEVEL[l + 1]) l++; return l; };

const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return v && typeof v === 'object' ? v : null; } catch { return null; } };

// { chars: [{ id, xp, lvl }], milestone } for one session.
export function readAttendance(session) {
  const a = parse(session?.fields?.attendance) || {};
  return { chars: (Array.isArray(a.chars) ? a.chars : []).filter((c) => c && c.id).map((c) => ({ id: String(c.id), xp: Math.max(0, Math.round(Number(c.xp) || 0)), lvl: Math.max(1, Math.min(20, Number(c.lvl) || 1)) })), milestone: Boolean(a.milestone) };
}

// Split total XP evenly between attendees (whole numbers; the first few get the remainder).
export function splitXp(total, ids) {
  const n = ids.length, each = n ? Math.floor(Math.max(0, total) / n) : 0, extra = n ? Math.max(0, total) - each * n : 0;
  return ids.map((id, i) => ({ id, xp: each + (i < extra ? 1 : 0) }));
}

const levelOf = (c) => Math.max(1, Math.min(20, parseInt(c.fields?.level, 10) || 1));

// Per character: sessions attended, XP, the level that XP reaches, milestones still owed, and the level they're due.
export function advancement(entries) {
  const sessions = entries.filter((e) => e.kind === 'session');
  const out = new Map();
  for (const c of entries.filter((e) => e.kind === 'character')) out.set(c.id, { character: c, level: levelOf(c), sessions: 0, xp: 0, milestones: 0, owed: 0 });
  for (const s of sessions) {
    const a = readAttendance(s);
    for (const x of a.chars) {
      const r = out.get(x.id); if (!r) continue;
      r.sessions++; r.xp += x.xp;
      if (a.milestone) { r.milestones++; if (x.lvl >= r.level) r.owed++; }
    }
  }
  for (const r of out.values()) {
    r.xpLevel = r.xp ? levelForXp(r.xp) : null;
    r.due = Math.min(20, Math.max(r.level + r.owed, r.xpLevel || 0));
    r.next = r.xp && r.xpLevel < 20 ? XP_FOR_LEVEL[r.xpLevel + 1] : null;
  }
  return [...out.values()];
}
