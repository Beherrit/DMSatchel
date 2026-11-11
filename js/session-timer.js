// Session lengths: how long a session ran, written as people write it ("3 h 40 min", "3h40", "2.5 hours", "200 min"),
// read back as minutes; the average; and when a break is due. Pure.

export const lengthText = (min) => { const m = Math.max(0, Math.round(Number(min) || 0)), h = Math.floor(m / 60); return h ? `${h} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`; };

// → minutes, or null when it doesn't read as a length.
export function parseLength(text) {
  const t = String(text || '').toLowerCase().replace(/,/g, '.').trim();
  if (!t) return null;
  let m = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\s*(?:(\d+)\s*(?:m|min|mins|minutes?)?)?$/.exec(t);
  if (m) return Math.round(Number(m[1]) * 60 + (Number(m[2]) || 0));
  m = /^(\d+)\s*(?:m|min|mins|minutes?)$/.exec(t);
  if (m) return Number(m[1]);
  m = /^(\d+):(\d\d)$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}

// The average of the lengths that read: → { minutes, count } or null.
export function averageLength(texts) {
  const ms = (texts || []).map(parseLength).filter((x) => x !== null && x > 0);
  return ms.length ? { minutes: Math.round(ms.reduce((a, b) => a + b, 0) / ms.length), count: ms.length } : null;
}

// Time for a break: every `every` minutes of play. → { due, next } (next: minutes of play at the next break).
export function breakDue(elapsed, every = 90, dismissedAt = 0) {
  const e = Math.max(0, Number(elapsed) || 0), last = Math.floor(e / every) * every;
  return { due: last > 0 && last > (Number(dismissedAt) || 0), next: last + every };
}
