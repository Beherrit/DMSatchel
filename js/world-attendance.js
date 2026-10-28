// Attendance and XP: on a session's page GMs record who came, XP each (or split a total) and whether it was a
// milestone; the party page adds it up and shows who's due a level.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, getEntry, patchEntry, link, byName } from './world-store.js';
import { readAttendance, splitXp, advancement } from './advancement.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const levelOf = (c) => Math.max(1, Math.min(20, parseInt(c?.fields?.level, 10) || 1));

export function attendanceSection(s, rerender) {
  if (s.kind !== 'session') return null;
  const a = readAttendance(s);
  if (!isGm()) {
    if (!a.chars.length) return null;
    return el('section', { class: 'card attendance' }, el('h3', {}, 'Who came'),
      el('ul', { class: 'plain att-list' }, a.chars.map((x) => getEntry(x.id)).filter(Boolean).map((c) => {
        const x = a.chars.find((y) => y.id === c.id);
        return el('li', {}, link(c), x.xp ? el('span', { class: 'muted small' }, ` ${x.xp.toLocaleString('en-US')} XP`) : null);
      })),
      a.milestone ? el('p', { class: 'small' }, 'A milestone: everyone here goes up a level.') : null);
  }
  // Everyone who came before, plus every active character, so a returning player can be ticked.
  const ids = new Set([...a.chars.map((x) => x.id), ...worldEntries().filter(ACTIVE).map((c) => c.id)]);
  const chars = [...ids].map(getEntry).filter(Boolean).sort(byName);
  // A session written with "Players & characters" names ticks those characters by default.
  const named = String(s.fields?.players || '').toLowerCase();
  const rows = chars.map((c) => {
    const had = a.chars.find((x) => x.id === c.id);
    const box = el('input', { type: 'checkbox', checked: had || (!a.chars.length && named.includes(c.name.toLowerCase())) || null, 'aria-label': `${c.name} came` });
    const xp = el('input', { type: 'number', min: 0, class: 'qty', value: had?.xp || '', placeholder: 'XP', 'aria-label': `XP for ${c.name}` });
    return { c, box, xp, row: el('li', {}, el('label', { class: 'check' }, box, ` ${c.name}`), xp, el('span', { class: 'muted small' }, `level ${levelOf(c)}`)) };
  });
  const total = el('input', { type: 'number', min: 0, class: 'qty', placeholder: 'Total XP', 'aria-label': 'Total XP to split' });
  const milestone = el('input', { type: 'checkbox', checked: a.milestone || null });
  const split = () => {
    const came = rows.filter((r) => r.box.checked);
    if (!came.length) { toast('Tick who came first'); return; }
    const shares = splitXp(Number(total.value) || 0, came.map((r) => r.c.id));
    for (const sh of shares) came.find((r) => r.c.id === sh.id).xp.value = sh.xp || '';
  };
  const save = async () => {
    const came = rows.filter((r) => r.box.checked);
    const prev = new Map(a.chars.map((x) => [x.id, x]));
    // Keep the level each character had when they first got this session's milestone, so re-saving doesn't move it.
    const chars = came.map((r) => ({ id: r.c.id, xp: Math.max(0, Math.round(Number(r.xp.value) || 0)), lvl: prev.get(r.c.id)?.lvl || levelOf(r.c) }));
    try {
      await patchEntry(getEntry(s.id) || s, { fields: { attendance: JSON.stringify({ chars, milestone: milestone.checked }) } });
      toast(`Saved: ${came.length} came${milestone.checked ? ', milestone' : ''}`); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  };
  return el('section', { class: 'card attendance' }, el('h3', {}, 'Attendance and XP'),
    rows.length ? el('ul', { class: 'plain attend-list' }, rows.map((r) => r.row)) : el('p', { class: 'muted small' }, 'No player characters yet.'),
    el('div', { class: 'controls' }, total, el('button', { class: 'btn small ghost', type: 'button', onclick: split }, 'Split between those who came'),
      el('label', { class: 'check' }, milestone, ' Milestone: everyone here goes up a level')),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'button', onclick: save }, 'Save attendance')));
}

// For the party page: sessions, XP and who's due a level.
export function advancementSection() {
  const rows = advancement(worldEntries()).filter((r) => ACTIVE(r.character) && (r.sessions || r.xp)).sort((x, y) => byName(x.character, y.character));
  if (!rows.length) return null;
  const anyXp = rows.some((r) => r.xp);
  return el('section', {}, el('h3', { class: 'section-title' }, 'Advancement'),
    el('div', { class: 'table-wrap' }, el('table', { class: 'adv-table' },
      el('thead', {}, el('tr', {}, ['Character', 'Sessions', ...(anyXp ? ['XP'] : []), 'Level', ''].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, rows.map((r) => el('tr', {}, el('td', {}, link(r.character)), el('td', { class: 'num' }, r.sessions),
        anyXp ? el('td', { class: 'num' }, r.xp ? `${r.xp.toLocaleString('en-US')}${r.next ? ` / ${r.next.toLocaleString('en-US')}` : ''}` : '—') : null,
        el('td', { class: 'num' }, r.level),
        el('td', {}, r.due > r.level ? el('a', { class: 'tag due-tag', href: `#world/e/${r.character.id}` }, `Level ${r.due} due`) : null)))))));
}
