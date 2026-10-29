// Cards to hand across the table: magic items and spells, poker-card size, nine to a page. What goes on a card is
// decided here (pure, so it can be tested); only text players may see is used, never a GM secret.
import { stripMarks } from './rich.js';

// Trim to about `max` characters, ending at a sentence (or a word) rather than mid-way.
export function cardText(text, max = 520) {
  const s = stripMarks(text).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return stop > max * 0.6 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

// An item entry → { title, sub, text, foot, image }.
export function itemCard(e) {
  const f = e.fields || {};
  const a = String(f.attunement || '').trim();
  const att = !a || /^(no|none|-)$/i.test(a) ? '' : /^(yes|y|true|required)$/i.test(a) ? 'requires attunement' : /attun/i.test(a) ? a : `requires attunement ${a}`;
  return {
    title: e.name,
    sub: [f.type, f.rarity && f.rarity !== 'Mundane' ? f.rarity.toLowerCase() : '', att].filter(Boolean).join(' · '),
    text: cardText(f.properties || e.body || e.summary || ''),
    foot: [f.value, f.source].filter(Boolean).join(' · '),
    image: f.image || null,
  };
}

// Which items a list of names (the treasury's "items held") refers to: exact names, ignoring case and "a/an/the".
export function itemsNamed(entries, names) {
  const norm = (s) => String(s).toLowerCase().replace(/^(a|an|the)\s+/, '').trim();
  const want = new Set((names || []).map(norm));
  return (entries || []).filter((e) => e.kind === 'item' && want.has(norm(e.name)));
}
