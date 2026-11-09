// "What needs writing" (GMs): thin spots to fill in before the party gets there. Route: #world/todo
import { el, toast } from './dom.js';
import { isGm, api } from './api.js';
import { worldEntries, link, kindLabel, byName, getEntry, notice, patchEntry } from './world-store.js';
import { unlinkedIn, linkNames } from './unlinked.js';
import { sessionChecks } from './session-checks.js';
import { thinSpots, missingLinks } from './thin.js';
import { KINDS, KIND_ORDER } from './world-schema.js';
import { routineIssues } from './world-routine.js';

const GROUPS = [
  ['undescribed', 'No summary or description', 'A line or two each is enough to run them at the table.'],
  ['flatNpcs', 'NPCs without a voice or wants', 'How they sound and what they want makes them easy to play.'],
  ['emptyPlaces', 'Places with nobody in them', 'Towns and locations with no NPCs inside yet.'],
  ['questsNoSteps', 'Open quests with no objectives', 'A few steps make progress easy to see.'],
  ['unconnected', 'Not connected to anything', 'Not inside a place and with no connections, so nothing leads to them.'],
  ['longHidden', 'Hidden from players for over a month', 'Still secret, or ready to reveal?'],
];

// Make the missing place: a new location named as the routine has it ("the Mill" → "The Mill"), in the NPC's town
// (or wherever the NPC is), ready to fill in and save.
function makePlace(name, npc) {
  let at = npc.parent_id && getEntry(npc.parent_id);
  for (let p = at, i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.kind === 'settlement') { at = p; break; }
  const title = name.replace(/^(at|in) /i, '').replace(/^\w/, (c) => c.toUpperCase());
  window.dispatchEvent(new CustomEvent('world:draft', { detail: { kind: 'location', name: title, parent_id: at?.id || null } }));
}

// Session numbers in order: numbers skipped or used twice, and sessions with no number.
function numbersSection(chk) {
  if (!chk.missing.length && !chk.repeated.length && !chk.unnumbered.length) return null;
  return el('section', { class: 'card todo-group session-numbers' }, el('h3', {}, 'Session numbers out of order'),
    el('ul', { class: 'plain todo-list' },
      chk.missing.length ? el('li', {}, el('span', {}, `No session numbered ${chk.missing.slice(0, 12).join(', ')}${chk.missing.length > 12 ? '…' : ''}.`)) : null,
      chk.repeated.map((r) => el('li', {}, el('span', {}, `Number ${r.n} is used ${r.sessions.length} times: `, r.sessions.map((x, i) => [i ? ', ' : '', link(x)])))),
      chk.unnumbered.length ? el('li', {}, el('span', {}, 'No number: ', chk.unnumbered.map((x, i) => [i ? ', ' : '', link(x)]))) : null));
}

// Logs still to write: sessions with no log, or only a line.
function emptyLogsSection(chk) {
  if (!chk.empty.length) return null;
  return el('section', { class: 'card todo-group empty-logs' }, el('h3', {}, `Logs still to write (${chk.empty.length})`),
    el('p', { class: 'muted small' }, 'Sessions with no log yet, or only a line. A few sentences with [[Names]] keep last seen, who came up and the recap working.'),
    el('ul', { class: 'plain todo-list' }, chk.empty.slice(0, 20).map((x) => el('li', {}, link(x), el('span', { class: 'muted small' }, x.body?.trim() ? ' (only a line)' : ' (no log yet)'),
      el('a', { class: 'btn small ghost', href: `#world/edit/${x.id}` }, 'Write it')))));
}

// Names left unlinked: entries the session logs name as plain text, with a button to link them for the GM.
function unlinkedSection(notLinks = []) {
  // Not a name: entries the GMs marked never to be offered for linking are left out.
  const skip = new Set(notLinks);
  const all = worldEntries().filter((e) => !skip.has(e.id) || e.kind === 'session' || e.kind === 'journal');
  // Session logs first (newest first), then journal entries (newest first).
  // Logs, then journals, then quests and places (their descriptions), each group newest first; never an entry's own name.
  const ORDER = ['session', 'journal', 'quest', 'region', 'area', 'settlement', 'location'];
  const rank = (k) => (ORDER.indexOf(k) < 2 ? ORDER.indexOf(k) : 2);
  const rows = all.filter((e) => ORDER.includes(e.kind) && e.body && e.can_edit !== false).map((s) => ({ s, found: unlinkedIn(s.body, all.filter((x) => x.id !== s.id)) })).filter((x) => x.found.length)
    .sort((a, b) => rank(a.s.kind) - rank(b.s.kind) || (parseFloat(b.s.fields?.number) || 0) - (parseFloat(a.s.fields?.number) || 0) || String(b.s.created_at).localeCompare(String(a.s.created_at)));
  if (!rows.length) return null;
  const linkThem = async (s, found, btn) => {
    btn.disabled = true;
    try { await patchEntry(getEntry(s.id) || s, { body: linkNames((getEntry(s.id) || s).body, found.map((f) => f.entry)) }); toast(`Linked ${found.length} name${found.length === 1 ? '' : 's'} in ${s.name}`); window.dispatchEvent(new Event('world:rerender')); }
    catch (err) { toast(err.message, 'bad'); btn.disabled = false; }
  };
  return el('section', { class: 'card todo-group unlinked-names' }, el('h3', {}, `Names left unlinked (${rows.length})`),
    el('p', { class: 'muted small' }, 'Session logs, journal entries, quests and places that name entries without [[links]], so they don’t link through (and, in logs, don’t count for last seen, who came up or gone quiet).'),
    el('ul', { class: 'plain todo-list' }, rows.slice(0, 30).map(({ s, found }) => el('li', {}, el('span', {}, link(s), ': ',
      found.map((f, i) => [i ? ', ' : '', link(f.entry), f.count > 1 ? el('span', { class: 'muted' }, ` ×${f.count}`) : '',
        el('button', { class: 'reroll not-link', type: 'button', title: `Never offer to link “${f.entry.name}”`, 'aria-label': `Never offer to link ${f.entry.name}`, onclick: async () => {
          try { await api('settings', { method: 'PATCH', body: { not_link: f.entry.id } }); toast(`“${f.entry.name}” won’t be offered for linking again`); window.dispatchEvent(new Event('world:rerender')); } catch (err) { toast(err.message, 'bad'); }
        } }, '✕')])),
      (() => { const b = el('button', { class: 'btn small', type: 'button' }, 'Link them'); b.onclick = () => linkThem(s, found, b); return b; })()))));
}

// Change your mind: the names marked never to be linked, each with a way to take the mark back.
function notLinksSection(notLinks = []) {
  const list = notLinks.map((id) => getEntry(id)).filter(Boolean).sort(byName);
  if (!list.length) return null;
  return el('details', { class: 'card todo-group not-links' }, el('summary', {}, `Names never offered for linking (${list.length})`),
    el('ul', { class: 'plain todo-list' }, list.map((x) => el('li', {}, link(x), el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
      try { await api('settings', { method: 'PATCH', body: { relink: x.id } }); toast(`“${x.name}” can be offered for linking again`); window.dispatchEvent(new Event('world:rerender')); } catch (err) { toast(err.message, 'bad'); }
    } }, 'Offer it again')))));
}

// Routines that don't read: lines the clock can't read, and places named that aren't in the world, to fix in one go.
function routinesSection(list) {
  if (!list.length) return null;
  return el('section', { class: 'card todo-group routine-issues' }, el('h3', {}, `Routines that don’t read (${list.length})`),
    el('p', { class: 'muted small' }, 'Write each part of the day as “when: where” (mornings, evenings, nights, “9–17”, otherwise), and name places that are in the world so the clock can find them.'),
    el('ul', { class: 'plain todo-list' }, list.slice(0, 40).map(({ entry, bad, unknown }) => el('li', {}, link(entry),
      bad.length ? el('div', { class: 'small' }, 'Can’t read: ', bad.map((b, i) => [i ? ', ' : '', el('q', {}, b)])) : null,
      unknown.length ? el('div', { class: 'small' }, 'Not in the world: ', unknown.map((name, i) => [i ? ', ' : '', name, ' ',
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Create ${name}`, onclick: () => makePlace(name, entry) }, 'Create')])) : null,
      el('a', { class: 'btn small ghost', href: `#world/edit/${entry.id}` }, 'Edit')))));
}

// [[Names]] that lead nowhere yet, with where they're mentioned and a way to create each (pick its kind first).
function missingSection(missing) {
  if (!missing.length) return null;
  const create = (name, kind) => window.dispatchEvent(new CustomEvent('world:draft', { detail: { kind, name } }));
  return el('section', { class: 'card todo-group' }, el('h3', {}, `Links that lead nowhere yet (${missing.length})`),
    el('p', { class: 'muted small' }, '[[Names]] in the text with no entry behind them. Create them, and every mention becomes a link.'),
    el('ul', { class: 'plain todo-list missing-list' }, missing.slice(0, 40).map((m) => {
      const kind = el('select', { 'aria-label': `Kind of entry for ${m.name}` }, KIND_ORDER.map((k) => el('option', { value: k }, KINDS[k].label)));
      kind.value = 'npc';
      return el('li', {}, el('strong', {}, m.name),
        el('span', { class: 'muted small' }, ' in ', m.from.slice(0, 3).flatMap((e, i) => [i ? ', ' : '', link(e)]), m.from.length > 3 ? ` and ${m.from.length - 3} more` : ''),
        el('span', { class: 'missing-make' }, kind, el('button', { class: 'btn small', type: 'button', onclick: () => create(m.name, kind.value) }, 'Create')));
    })),
    missing.length > 40 ? el('p', { class: 'muted small' }, `and ${missing.length - 40} more`) : null);
}

export async function viewTodo() {
  if (!isGm()) return notice('GMs only', 'This page finds thin spots in the world for the GMs to fill in.');
  let prep = {};
  try { prep = (await api('settings')).world?.prep || {}; } catch { /* without the GMs' lists */ }
  const spots = thinSpots(worldEntries());
  const missing = missingLinks(worldEntries());
  const routines = routineIssues();
  const total = GROUPS.reduce((t, [k]) => t + spots[k].length, 0) + missing.length + routines.length;
  return el('div', { class: 'w-view todo-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'What needs writing'), el('p', {}, total ? `${total} thin spot${total === 1 ? '' : 's'} to fill in, most useful first.` : 'Nothing thin: every entry has something written, every place has people in it.'),
      el('p', { class: 'small' }, el('a', { href: '#world/dupes' }, 'Likely duplicates'), ': entries that may be the same thing, to merge.')),
    missingSection(missing),
    routinesSection(routines),
    unlinkedSection(prep.not_links || []),
    notLinksSection(prep.not_links || []),
    ...(() => { const chk = sessionChecks(worldEntries()); return [emptyLogsSection(chk), numbersSection(chk)]; })(),
    GROUPS.map(([k, title, hint]) => {
      const list = [...spots[k]].sort(byName);
      return list.length ? el('section', { class: 'card todo-group' }, el('h3', {}, `${title} (${list.length})`), el('p', { class: 'muted small' }, hint),
        el('ul', { class: 'plain todo-list' }, list.slice(0, 40).map((e) => el('li', {}, link(e), el('span', { class: 'muted small' }, ` ${kindLabel(e.kind)}${getEntry(e.parent_id) ? ` · in ${getEntry(e.parent_id).name}` : ''}`),
          el('a', { class: 'btn small ghost', href: `#world/edit/${e.id}` }, 'Edit')))),
        list.length > 40 ? el('p', { class: 'muted small' }, `and ${list.length - 40} more`) : null) : null;
    }));
}
