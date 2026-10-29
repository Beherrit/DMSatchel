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

const ORD = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const sign = (n) => (n >= 0 ? `+${n}` : String(n));

// A caster's spells on one card: save DC and attack, slots to tick (boxes), and the spells by level.
// sb: a Forge spellbook ({ cls, level, dc, attack, slots | pact, cantrips, byLevel }).
export function spellListCard(name, sb) {
  const slots = sb.pact ? [[`${ORD[sb.pact[1]]} (pact)`, sb.pact[0]]] : (sb.slots || []).map((n, i) => [ORD[i + 1], n]).filter(([, n]) => n);
  const lines = [sb.cantrips?.length ? `Cantrips: ${sb.cantrips.join(', ')}` : '', ...Object.entries(sb.byLevel || {}).sort((a, b) => a[0] - b[0]).map(([l, n]) => `${ORD[l]}: ${n.join(', ')}`)].filter(Boolean);
  return { title: `${name}: spells`, sub: `${sb.cls} ${sb.level} · save DC ${sb.dc} · spell attack ${sign(sb.attack)}`, slots, text: lines.join('\n'), foot: '' };
}

// A spell from the world's library (a rule entry, category Spell): its level, classes and what it does.
export function librarySpellCard(e) {
  const f = e.fields || {};
  const lvl = String(f.level ?? '').trim();
  const level = lvl === '0' ? 'Cantrip' : /^\d$/.test(lvl) ? `${ORD[Number(lvl)]}-level spell` : 'Spell';
  return { title: e.name, sub: [level, f.class].filter(Boolean).join(' · '), text: cardText(f.features || e.body || e.summary || '', 700), foot: f.source || '' };
}
