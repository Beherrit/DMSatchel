// Light formatting for long text: **bold**, *italic* (or _italic_), [[links]], "- " lists, "1. " lists, "## " small
// headings and "> " read-aloud boxes. Parsed into a small tree the page turns into elements (never HTML strings).
// Pure, so it can be tested.

// Inline: → [{ t: 'text', v } | { t: 'b', c: [...] } | { t: 'i', c: [...] } | { t: 'link', name, label }]
export function inline(text) {
  const out = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])|(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g;
  let at = 0, m;
  const s = String(text ?? '');
  while ((m = re.exec(s))) {
    if (m.index > at) out.push({ t: 'text', v: s.slice(at, m.index) });
    if (m[1] !== undefined) out.push({ t: 'link', name: m[1].trim(), label: (m[2] || m[1]).trim() });
    else if (m[3] !== undefined) out.push({ t: 'b', c: inline(m[3]) });
    else out.push({ t: 'i', c: inline(m[4] ?? m[5]) });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push({ t: 'text', v: s.slice(at) });
  return out;
}

// Blocks, split on blank lines: → [{ t: 'p', lines: [inline…] } | { t: 'ul' | 'ol', items: [inline…] } |
// { t: 'h', v: inline } | { t: 'quote', lines: [inline…] }]
export function blocks(text) {
  const out = [];
  for (const para of String(text ?? '').replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = para.split('\n').filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*>/.test(l))) { out.push({ t: 'quote', lines: lines.map((l) => inline(l.replace(/^\s*>\s?/, ''))) }); continue; }
    if (lines.length === 1 && /^#{1,4}\s+\S/.test(lines[0])) { out.push({ t: 'h', v: inline(lines[0].replace(/^#{1,4}\s+/, '')) }); continue; }
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) { out.push({ t: 'ul', items: lines.map((l) => inline(l.replace(/^\s*[-*•]\s+/, ''))) }); continue; }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) { out.push({ t: 'ol', items: lines.map((l) => inline(l.replace(/^\s*\d+[.)]\s+/, ''))) }); continue; }
    out.push({ t: 'p', lines: lines.map(inline) });
  }
  return out;
}

// The same text with the formatting marks taken out (for one-line summaries and print).
export const stripMarks = (text) => String(text ?? '')
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a)
  .replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, '$1').replace(/(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g, '$1')
  .replace(/^\s*>\s?/gm, '').replace(/^#{1,4}\s+/gm, '');
