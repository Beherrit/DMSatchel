// The relationship grid: every faction, guild and house against every other. GMs click a cell to set how two
// powers stand; it writes the same connections the relationship web reads. Route: #world/powers
import { el, toast, setKids } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, getEntry, link, patchEntry, notice, byName } from './world-store.js';
import { KINDS } from './world-schema.js';
import { RELATIONS, between, setBetween, tally, tensions } from './relations.js';

const KIND_CHOICES = ['faction', 'guild', 'clan', 'deity', 'settlement'];
let shown = new Set(['faction', 'guild', 'clan']);

export function viewPowers(rerender) {
  const gm = isGm();
  const opts = { withSecret: gm };
  const powers = worldEntries().filter((e) => shown.has(e.kind)).sort((a, b) => KIND_CHOICES.indexOf(a.kind) - KIND_CHOICES.indexOf(b.kind) || byName(a, b));
  const editor = el('div', { class: 'rel-editor', role: 'region', 'aria-live': 'polite' });
  const counts = tally(powers, opts);

  const chips = el('div', { class: 'type-chips', role: 'group', 'aria-label': 'Which kinds to show' }, KIND_CHOICES.map((k) => el('button', {
    type: 'button', class: 'chip-btn small', 'aria-pressed': String(shown.has(k)),
    onclick: () => { if (shown.has(k)) shown.delete(k); else shown.add(k); if (!shown.size) shown.add('faction'); rerender(); },
  }, KINDS[k].plural)));

  async function set(a, b, key) {
    const { aLinks, bLinks } = setBetween(a, b, key);
    try {
      if (JSON.stringify(aLinks) !== JSON.stringify(a.links || [])) await patchEntry(getEntry(a.id), { links: aLinks });
      if (JSON.stringify(bLinks) !== JSON.stringify(b.links || [])) await patchEntry(getEntry(b.id), { links: bLinks });
      const rel = RELATIONS.find((r) => r.key === key);
      toast(rel ? `${a.name}: ${rel.name.toLowerCase()}${rel.mutual ? ` with ${b.name}` : ` ${b.name}`}` : `Cleared ${a.name} and ${b.name}`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); }
  }

  function edit(a, b) {
    const cur = between(a, b, opts);
    setKids(editor, el('div', { class: 'card rel-edit-card' },
      el('div', { class: 'entry-head' }, el('h3', {}, link(a), ' and ', link(b)), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Close', onclick: () => setKids(editor) }, '✕')),
      el('p', { class: 'muted small' }, cur ? `Now: ${getEntry(cur.from).name} ${cur.rel.label} ${getEntry(cur.to).name}.` : 'No relationship recorded.'),
      el('div', { class: 'btnrow rel-choices' },
        RELATIONS.map((r) => el('button', {
          type: 'button', class: `btn small rel-btn rel-${r.key}`, 'aria-pressed': String(cur?.rel.key === r.key && cur.from === a.id),
          onclick: () => set(a, b, r.key),
        }, el('span', { class: 'rel-mark', 'aria-hidden': 'true' }, r.mark), r.mutual ? ` ${r.name}` : ` ${a.name} ${r.label} ${b.name}`)),
        RELATIONS.filter((r) => !r.mutual).map((r) => el('button', { type: 'button', class: `btn small rel-btn rel-${r.key}`, 'aria-pressed': String(cur?.rel.key === r.key && cur.from === b.id), onclick: () => set(b, a, r.key) },
          el('span', { class: 'rel-mark', 'aria-hidden': 'true' }, r.mark), ` ${b.name} ${r.label} ${a.name}`)),
        cur ? el('button', { type: 'button', class: 'btn small ghost', onclick: () => set(a, b, null) }, 'No relationship') : null)));
    editor.querySelector('.rel-choices button')?.focus();
  }

  const cell = (a, b) => {
    if (a === b) return el('td', { class: 'rel-self', 'aria-hidden': 'true' });
    const r = between(a, b, opts);
    // Directional ones read from the row: → means the row serves the column, ← the other way round.
    const mark = !r ? '' : r.rel.mutual ? r.rel.mark : r.from === a.id ? '→' : '←';
    const label = r ? `${getEntry(r.from).name} ${r.rel.label} ${getEntry(r.to).name}` : `${a.name} and ${b.name}: no relationship`;
    const inner = el('span', { class: 'rel-mark' }, mark);
    return el('td', { class: r ? `rel rel-${r.rel.key}${r.secret ? ' rel-secret' : ''}` : 'rel' },
      gm ? el('button', { type: 'button', class: 'rel-cell', title: label, 'aria-label': label, onclick: () => edit(a, b) }, inner) : el('span', { class: 'rel-cell', title: label, 'aria-label': label, role: 'img' }, inner));
  };

  const short = (n) => (n.length > 18 ? `${n.slice(0, 17)}…` : n);
  const grid = powers.length > 1 ? el('div', { class: 'rel-wrap' }, el('table', { class: 'rel-grid' },
    el('thead', {}, el('tr', {}, el('th', { scope: 'col', class: 'corner' }, el('span', { class: 'sr-only' }, 'Power')), powers.map((p) => el('th', { scope: 'col', class: 'col-head', title: p.name }, el('span', {}, short(p.name)))))),
    el('tbody', {}, powers.map((a) => el('tr', {}, el('th', { scope: 'row', class: 'row-head' }, link(a, short(a.name))), powers.map((b) => cell(a, b)))))))
    : notice('Not enough powers yet', 'Add at least two factions, guilds or houses to compare them.');

  const trouble = tensions(powers, opts);
  const summary = powers.length > 1 ? el('section', { class: 'card' }, el('h3', {}, 'At a glance'),
    el('ul', { class: 'plain rel-summary' }, powers.map((p) => {
      const c = counts.get(p.id);
      const bits = [[c.ally, 'ally', 'allies'], [c.trade, 'trade partner', 'trade partners'], [c.rival, 'rival', 'rivals'], [c.enemy, 'enemy', 'enemies'], [c.war, 'war', 'wars'], [c.serves, 'service tie', 'service ties'], [gm ? c.secret : 0, 'secret tie', 'secret ties']].filter(([n]) => n);
      return el('li', {}, link(p), el('span', { class: 'muted small' }, bits.length ? ` ${bits.map(([n, one, many]) => `${n} ${n === 1 ? one : many}`).join(', ')}` : ' no ties yet'));
    })),
    trouble.length ? [el('h4', {}, 'Tensions'), el('ul', { class: 'plain' }, trouble.map((t) => el('li', { class: 'small' }, '⚠ ', link(t.power), ' is allied with both ', link(t.a), ' and ', link(t.b), `, who are ${t.rel.key === 'war' ? 'at war' : 'enemies'}.`)))] : null) : null;

  return el('div', { class: 'w-view powers-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Who stands where'),
      el('p', {}, gm ? 'Every power against every other. Click a square to set how two of them stand; it updates their connections and the relationship web.' : 'How the world’s powers stand with one another, as far as anyone knows.')),
    chips,
    el('div', { class: 'rel-legend' }, RELATIONS.filter((r) => gm || !r.secret).map((r) => el('span', { class: `rel-key rel-${r.key}` }, el('span', { class: 'rel-mark' }, r.mark), ` ${r.name}`)),
      el('span', { class: 'muted small' }, '→ / ← : the row serves the column, or the column serves the row')),
    editor, grid, summary);
}
