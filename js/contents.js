// Contents for long entries: the "## " headings of a text, each with an id to jump to. Pure, so it can be tested.
import { blocks } from './rich.js';

const plain = (parts) => parts.map((x) => (x.t === 'text' ? x.v : x.t === 'link' ? x.label : plain(x.c))).join('');
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'part';

// Every heading in order: → [{ label, id }] (ids unique within the text; prefix keeps them apart from the page's).
export function headingsOf(text, prefix = 'sec') {
  const used = new Map();
  return blocks(text).filter((b) => b.t === 'h').map((b) => {
    const label = plain(b.v).trim(), base = `${prefix}-${slug(label)}`;
    const n = (used.get(base) || 0) + 1; used.set(base, n);
    return { label, id: n === 1 ? base : `${base}-${n}` };
  });
}

// A table of contents only pays off with a few parts.
export const contentsOf = (text, min = 3) => { const h = headingsOf(text); return h.length >= min ? h : []; };
