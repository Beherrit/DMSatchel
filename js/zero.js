// Session zero: the world's primer (what kind of game, tone, house rules, safety tools, the table's lines and veils)
// and each person's private answers for the GMs (a topic checklist, their own lines and veils, anything else).
// A line is kept out of the game entirely; a veil can happen, but off screen. Pure, shared by the page and the server.

export const TOPICS = [
  'Blood and gore', 'Body horror', 'Torture', 'Harm to children', 'Harm to animals', 'Sexual content', 'Romance',
  'Slavery', 'Self-harm or suicide', 'Bigotry and slurs', 'Mental illness', 'Drugs and addiction', 'Religious themes',
  'Death of player characters', 'Spiders and insects', 'Being trapped or buried', 'Drowning', 'Fire', 'Real-world politics',
];
export const RATINGS = [['', 'Fine'], ['veil', 'Veil (off screen)'], ['line', 'Line (keep out)']];

const text = (v, n) => String(v ?? '').replace(/\r/g, '').slice(0, n);
const list = (v, n = 40) => [...new Set((Array.isArray(v) ? v : String(v ?? '').split('\n'))
  .map((s) => String(s).replace(/^\s*[-*•]\s*/, '').trim().slice(0, 160)).filter(Boolean))].slice(0, n);

export function cleanPrimer(p = {}) {
  return { pitch: text(p.pitch, 4000), tone: text(p.tone, 300).trim(), rules: text(p.rules, 12000), tools: text(p.tools, 4000),
    lines: list(p.lines), veils: list(p.veils) };
}
export const primerEmpty = (p) => !p || !['pitch', 'tone', 'rules', 'tools'].some((k) => String(p[k] || '').trim()) && !p.lines?.length && !p.veils?.length;

export function cleanAnswer(a = {}) {
  const ratings = {};
  for (const [t, r] of Object.entries(a.ratings && typeof a.ratings === 'object' ? a.ratings : {})) if (TOPICS.includes(t) && (r === 'line' || r === 'veil')) ratings[t] = r;
  return { ratings, lines: list(a.lines, 30), veils: list(a.veils, 30), note: text(a.note, 4000).trim(), anon: Boolean(a.anon) };
}
export const answerEmpty = (a) => !a || (!Object.keys(a.ratings || {}).length && !a.lines?.length && !a.veils?.length && !a.note);

// For the GMs: answers [{ name, answer }] (name null when anonymous) → per topic who wants a line or a veil, the
// free-text lines and veils, and notes; plus suggestions: what someone asked for that the primer doesn't have yet.
export function summarize(answers, primer = {}) {
  const topics = new Map(), lines = [], veils = [], notes = [];
  const who = (x) => x.name || 'Someone (anonymous)';
  for (const x of answers) {
    const a = x.answer;
    if (!a) continue;
    for (const [t, r] of Object.entries(a.ratings || {})) {
      const cur = topics.get(t) || { topic: t, line: [], veil: [] };
      cur[r].push(who(x)); topics.set(t, cur);
    }
    for (const l of a.lines || []) lines.push({ text: l, who: who(x) });
    for (const v of a.veils || []) veils.push({ text: v, who: who(x) });
    if (a.note) notes.push({ text: a.note, who: who(x) });
  }
  const has = (arr, t) => (arr || []).some((x) => x.toLowerCase() === t.toLowerCase());
  const ordered = [...topics.values()].sort((a, b) => b.line.length - a.line.length || b.veil.length - a.veil.length || TOPICS.indexOf(a.topic) - TOPICS.indexOf(b.topic));
  // The strictest answer wins: one line makes it a line.
  const suggest = { lines: [], veils: [] };
  for (const t of ordered) {
    if (t.line.length && !has(primer.lines, t.topic)) suggest.lines.push(t.topic);
    else if (!t.line.length && t.veil.length && !has(primer.lines, t.topic) && !has(primer.veils, t.topic)) suggest.veils.push(t.topic);
  }
  for (const l of lines) if (!has(primer.lines, l.text) && !has(suggest.lines, l.text)) suggest.lines.push(l.text);
  for (const v of veils) if (!has(primer.lines, v.text) && !has(primer.veils, v.text) && !has(suggest.lines, v.text) && !has(suggest.veils, v.text)) suggest.veils.push(v.text);
  return { topics: ordered, lines, veils, notes, suggest };
}
