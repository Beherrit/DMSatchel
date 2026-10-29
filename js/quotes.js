// The quote wall: memorable lines from the table, with who said them and in which session. Pure, so the server
// and tests share it.

export const QUOTE_MAX = 500;

// → { text, said_by, session_id } or { error }.
export function cleanQuote(q) {
  const text = String(q?.text ?? '').replace(/\s+/g, ' ').trim().replace(/^["“”']+|["“”']+$/g, '').trim();
  if (!text) return { error: 'Write the line first.' };
  if (text.length > QUOTE_MAX) return { error: `Keep it under ${QUOTE_MAX} characters.` };
  return { text, said_by: String(q?.said_by ?? '').replace(/\s+/g, ' ').trim().slice(0, 80), session_id: q?.session_id ? String(q.session_id).slice(0, 40) : null };
}

// Who said what, most quoted first: → [[name, count]] (names compared ignoring case; a capitalised spelling wins).
export function quotedMost(quotes) {
  const by = new Map();
  for (const q of quotes || []) {
    const k = String(q.said_by || '').trim().toLowerCase();
    if (!k) continue;
    const cur = by.get(k) || [q.said_by.trim(), 0];
    if (/^[a-z]/.test(cur[0]) && /^[A-Z]/.test(q.said_by.trim())) cur[0] = q.said_by.trim();
    cur[1]++; by.set(k, cur);
  }
  return [...by.values()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
