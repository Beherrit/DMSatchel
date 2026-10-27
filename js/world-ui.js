// The shared world: browse, search, read and (for GMs) write entries.
// Routes: #world · #world/k/<kind> · #world/e/<id> · #world/new/<kind> · #world/edit/<id> · #world/q/<search> · #world/bin

import { $, el, cap, toast, confirmButton } from './dom.js';
import { api, session, isGm, onSession } from './api.js';
import { KINDS, KIND_ORDER, LINK_LABELS } from './world-schema.js';
import { openSignIn } from './signin.js';

const world = { entries: new Map(), info: null, loaded: false, loading: null, error: null };
let draft = null;
let main, side;

export const worldEntries = () => [...world.entries.values()];

export async function loadWorld(force) {
  if (world.loading && !force) return world.loading;
  world.loading = (async () => {
    try {
      const r = await api('entries');
      world.entries = new Map(r.entries.map((e) => [e.id, e]));
      world.info = r.world; world.loaded = true; world.error = null;
    } catch (e) { world.error = e; }
    world.loading = null;
  })();
  return world.loading;
}

const byName = (a, b) => a.name.localeCompare(b.name);
const kindLabel = (k) => KINDS[k]?.label || k;
const link = (e, text) => el('a', { href: `#world/e/${e.id}`, class: `elink k-${e.kind}` }, text || e.name);
const when = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
function findByName(name) {
  const n = name.trim().toLowerCase();
  return worldEntries().find((e) => e.name.toLowerCase() === n);
}

// Body text with [[Entry Name]] links.
function richText(text) {
  const out = el('div', { class: 'rich' });
  for (const para of String(text || '').split(/\n{2,}/)) {
    const p = el('p');
    String(para).split(/(\[\[[^\]]+\]\])/).forEach((part) => {
      const m = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
      if (!m) { p.append(part); return; }
      const target = findByName(m[1]);
      p.append(target ? link(target, m[2] || m[1]) : el('span', { class: 'missing', title: 'No entry with this name yet' }, m[2] || m[1]));
    });
    out.append(p);
  }
  return out;
}

// ---- sidebar -----------------------------------------------------------------------------------

function renderSide() {
  const counts = {}; for (const e of world.entries.values()) counts[e.kind] = (counts[e.kind] || 0) + 1;
  const search = el('input', { type: 'search', id: 'w-search', placeholder: 'Search the world…', 'aria-label': 'Search the world' });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter' && search.value.trim()) location.hash = `world/q/${encodeURIComponent(search.value.trim())}`; });
  side.replaceChildren(
    el('a', { href: '#world', class: 'w-home' }, world.info?.name || 'The World'),
    search,
    el('nav', { class: 'w-kinds', 'aria-label': 'Entry types' }, KIND_ORDER.map((k) => el('a', { href: `#world/k/${k}`, 'data-kind': k }, el('span', {}, KINDS[k].plural), el('span', { class: 'count' }, counts[k] || 0)))),
    isGm() ? el('div', { class: 'w-gm' }, el('a', { class: 'btn primary small', href: '#world/new/npc' }, '+ New entry'), el('a', { class: 'btn ghost small', href: '#world/bin' }, 'Bin')) : null,
  );
}

// ---- views -------------------------------------------------------------------------------------

function notice(title, text, ...extra) { return el('div', { class: 'card empty-state' }, el('h3', {}, title), el('p', {}, text), ...extra); }

function viewHome() {
  const all = worldEntries();
  const recent = [...all].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 12);
  const info = world.info || {};
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, info.name || 'The World'), info.tagline ? el('p', {}, info.tagline) : null),
    info.about ? el('div', { class: 'card' }, richText(info.about)) : (isGm() ? el('p', { class: 'muted' }, 'The admin can name the world and write an introduction in the Admin page.') : null),
    all.length ? null : notice('This world is empty', isGm() ? 'Start with a region or a city, then fill it with factions and people. Anything from the table tools can be sent here with “Add to world”.' : 'The GMs haven’t added anything yet.',
      isGm() ? el('div', { class: 'btnrow' }, el('a', { class: 'btn primary', href: '#world/new/region' }, 'New region'), el('a', { class: 'btn', href: '#world/new/settlement' }, 'New settlement'), el('a', { class: 'btn', href: '#world/new/faction' }, 'New faction')) : null),
    el('div', { class: 'kind-grid' }, KIND_ORDER.map((k) => {
      const n = all.filter((e) => e.kind === k).length;
      return el('a', { class: 'kind-card', href: `#world/k/${k}` }, el('strong', {}, KINDS[k].plural), el('span', { class: 'count' }, n), el('small', {}, KINDS[k].blurb));
    })),
    recent.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Recently changed'),
      el('ul', { class: 'entry-list' }, recent.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, `${e.updated_by ? `${e.updated_by}, ` : ''}${when(e.updated_at)}`))))) : null);
}

function entryCard(e) {
  return el('li', { class: 'entry-card' }, link(e), e.summary ? el('p', {}, e.summary.length > 180 ? `${e.summary.slice(0, 178)}…` : e.summary) : null,
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => el('a', { class: 'tagchip', href: `#world/q/${encodeURIComponent(`#${t}`)}` }, `#${t}`))) : null);
}

function viewKind(kind) {
  if (!KINDS[kind]) return notice('Nothing here', 'That kind of entry doesn’t exist.');
  let list = worldEntries().filter((e) => e.kind === kind);
  if (kind === 'event') list.sort((a, b) => (parseFloat(a.fields.sort) || 0) - (parseFloat(b.fields.sort) || 0) || byName(a, b)); else list.sort(byName);
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, KINDS[kind].plural), el('p', {}, KINDS[kind].blurb)),
      isGm() ? el('a', { class: 'btn primary', href: `#world/new/${kind}` }, `New ${kindLabel(kind).toLowerCase()}`) : null),
    list.length ? (kind === 'event'
      ? el('ol', { class: 'timeline' }, list.map((e) => el('li', {}, el('span', { class: 'date' }, e.fields.date || e.fields.sort || '—'), el('div', {}, link(e), e.summary ? el('p', {}, e.summary) : null))))
      : el('ul', { class: 'entry-grid' }, list.map(entryCard)))
      : notice(`No ${KINDS[kind].plural.toLowerCase()} yet`, isGm() ? 'Add the first one.' : 'The GMs haven’t added any yet.'));
}

function viewSearch(q) {
  const term = q.trim().toLowerCase();
  const tag = term.startsWith('#') ? term.slice(1) : null;
  const hits = worldEntries().filter((e) => (tag ? e.tags?.includes(tag)
    : [e.name, e.summary, e.body, ...Object.values(e.fields || {}), ...(e.tags || []), isGm() ? e.secret : ''].join('\n').toLowerCase().includes(term))).sort(byName);
  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, tag ? `Tagged #${tag}` : `Search: “${q}”`), el('p', {}, `${hits.length} result${hits.length === 1 ? '' : 's'}`)),
    hits.length ? el('ul', { class: 'entry-grid' }, hits.map((e) => { const c = entryCard(e); c.prepend(el('span', { class: 'kind-tag' }, kindLabel(e.kind))); return c; })) : notice('No matches', 'Try a shorter word, or a name.'));
}

function viewEntry(id) {
  const e = world.entries.get(id);
  if (!e) return notice('Entry not found', 'It may have been deleted, or the link is wrong.');
  const all = worldEntries();
  const crumbs = []; let p = e.parent_id && world.entries.get(e.parent_id), guard = 0;
  while (p && guard++ < 10) { crumbs.unshift(p); p = p.parent_id && world.entries.get(p.parent_id); }
  const children = all.filter((x) => x.parent_id === id).sort(byName);
  const out = (e.links || []).map((l) => ({ ...l, target: world.entries.get(l.id) })).filter((l) => l.target);
  const incoming = all.flatMap((x) => (x.links || []).filter((l) => l.id === id).map((l) => ({ ...l, from: x })));
  const fieldRows = KINDS[e.kind].fields.filter(([k]) => e.fields?.[k]).map(([k, label, type]) => [label, e.fields[k], type]);

  const history = el('div', { class: 'history', hidden: true });
  const node = el('article', { class: 'w-view entry-view' },
    crumbs.length ? el('nav', { class: 'crumbs', 'aria-label': 'Located in' }, crumbs.flatMap((c, i) => [i ? ' › ' : '', link(c)])) : null,
    el('div', { class: 'panel-head row' },
      el('div', {}, el('div', { class: 'eyebrow' }, kindLabel(e.kind), e.fields?.type ? ` · ${e.fields.type}` : ''), el('h2', {}, e.name)),
      isGm() ? el('div', { class: 'btnrow' }, el('a', { class: 'btn', href: `#world/edit/${e.id}` }, 'Edit'),
        el('button', { class: 'btn ghost', type: 'button', onclick: async () => {
          history.hidden = !history.hidden; if (history.hidden) return;
          history.replaceChildren(el('p', { class: 'muted' }, 'Loading history…'));
          try { const r = await api('activity', { query: { id } }); history.replaceChildren(el('h4', {}, 'History'), el('ul', { class: 'plain' }, r.activity.map((h) => el('li', {}, `${when(h.at)} · ${h.gm || 'Someone'} · ${h.action}`)))); }
          catch (err) { history.replaceChildren(el('p', { class: 'error' }, err.message)); }
        } }, 'History')) : null),
    e.summary ? el('p', { class: 'lede' }, e.summary) : null,
    fieldRows.length ? el('dl', { class: 'traits' }, fieldRows.flatMap(([l, v, type]) => [el('dt', {}, l), el('dd', {}, type === 'long' ? richText(v) : el('span', {}, v))])) : null,
    e.body ? el('section', {}, richText(e.body)) : null,
    isGm() && e.secret ? el('aside', { class: 'secret' }, el('div', { class: 'eyebrow' }, 'GM only'), richText(e.secret)) : null,
    out.length || incoming.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Connections'),
      el('ul', { class: 'links' },
        out.map((l) => el('li', { class: l.secret ? 'secret-link' : '' }, el('span', { class: 'rel' }, l.label), ' ', link(l.target), el('span', { class: 'kind-tag' }, kindLabel(l.target.kind)), l.secret ? el('span', { class: 'tag' }, 'GM only') : null)),
        incoming.map((l) => el('li', { class: l.secret ? 'secret-link' : '' }, link(l.from), ' ', el('span', { class: 'rel' }, `is ${l.label}`), ' this', el('span', { class: 'kind-tag' }, kindLabel(l.from.kind)))))) : null,
    children.length ? el('section', {}, el('h3', { class: 'section-title' }, `In ${e.name}`), el('ul', { class: 'entry-list' }, children.map((c) => el('li', {}, link(c), el('span', { class: 'kind-tag' }, kindLabel(c.kind)))))) : null,
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => el('a', { class: 'tagchip', href: `#world/q/${encodeURIComponent(`#${t}`)}` }, `#${t}`))) : null,
    el('p', { class: 'muted small' }, `Created${e.created_by ? ` by ${e.created_by}` : ''} ${when(e.created_at)}${e.updated_by ? ` · last edited by ${e.updated_by} ${when(e.updated_at)}` : ''}`),
    history);
  return node;
}

// ---- editing -----------------------------------------------------------------------------------

function nameList() {
  return el('datalist', { id: 'w-names' }, worldEntries().sort(byName).map((e) => el('option', { value: e.name }, kindLabel(e.kind))));
}

function viewEdit(id, kindForNew) {
  if (!isGm()) return notice('GMs only', 'Sign in with your invite code to add or change entries.', el('button', { class: 'btn primary', type: 'button', onclick: () => openSignIn() }, 'GM sign in'));
  const existing = id ? world.entries.get(id) : null;
  if (id && !existing) return notice('Entry not found', 'It may have been deleted.');
  const e = existing ? structuredClone(existing) : { kind: KINDS[kindForNew] ? kindForNew : 'npc', name: '', summary: '', body: '', fields: {}, secret: '', tags: [], links: [], parent_id: null, ...(draft || {}) };
  if (!existing) draft = null;
  e.fields = e.fields || {}; e.links = e.links || [];

  const form = el('form', { class: 'card edit-form', autocomplete: 'off' });
  const fieldsBox = el('div', { class: 'edit-fields' });
  const linksBox = el('div', { class: 'links-edit' });
  const status = el('p', { class: 'form-status', role: 'status' });

  const input = (name, label, value, attrs = {}) => el('div', { class: 'field' }, el('label', { for: `f-${name}` }, label), el('input', { type: 'text', id: `f-${name}`, name, value: value || '', ...attrs }));
  const area = (name, label, value, rows = 4, hint) => el('div', { class: 'field' }, el('label', { for: `f-${name}` }, label), el('textarea', { id: `f-${name}`, name, rows }, value || ''), hint ? el('small', { class: 'muted' }, hint) : null);

  const kindSel = el('select', { id: 'f-kind', name: 'kind' }, KIND_ORDER.map((k) => el('option', { value: k }, KINDS[k].label)));
  kindSel.value = e.kind;
  function renderFields() {
    collectFields();
    fieldsBox.replaceChildren(...KINDS[kindSel.value].fields.map(([k, label, type, opts]) => {
      const v = e.fields[k] || '';
      if (type === 'select') {
        const s = el('select', { id: `ff-${k}`, 'data-field': k }, el('option', { value: '' }, '—'), opts.map((o) => el('option', { value: o }, o)));
        if (v && !opts.includes(v)) s.append(el('option', { value: v }, v));
        s.value = v;
        return el('div', { class: 'field' }, el('label', { for: `ff-${k}` }, label), s);
      }
      return type === 'long'
        ? el('div', { class: 'field wide' }, el('label', { for: `ff-${k}` }, label), el('textarea', { id: `ff-${k}`, 'data-field': k, rows: 3 }, v))
        : el('div', { class: 'field' }, el('label', { for: `ff-${k}` }, label), el('input', { type: 'text', id: `ff-${k}`, 'data-field': k, value: v }));
    }));
  }
  function collectFields() { for (const f of fieldsBox.querySelectorAll('[data-field]')) e.fields[f.dataset.field] = f.value; }
  kindSel.addEventListener('change', renderFields);

  function linkRow(l = { label: 'related to', id: '', secret: false }) {
    const target = l.id ? world.entries.get(l.id) : null;
    const row = el('div', { class: 'link-row' },
      el('input', { type: 'text', class: 'l-label', list: 'w-labels', value: l.label, 'aria-label': 'Relationship' }),
      el('input', { type: 'text', class: 'l-target', list: 'w-names', value: target?.name || '', placeholder: 'Entry name', 'aria-label': 'Connected entry' }),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', class: 'l-secret', checked: l.secret || null }), ' GM only'),
      el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Remove connection', onclick: () => row.remove() }, '✕'));
    return row;
  }
  linksBox.append(...e.links.map(linkRow));

  const parent = e.parent_id && world.entries.get(e.parent_id);
  form.append(
    el('div', { class: 'edit-grid' },
      el('div', { class: 'field' }, el('label', { for: 'f-kind' }, 'Type'), kindSel),
      input('name', 'Name', e.name, { required: true, maxlength: 200 }),
      input('parent', 'Located in / part of', parent?.name || '', { list: 'w-names', placeholder: 'e.g. a region or city' })),
    area('summary', 'Summary', e.summary, 2, 'One or two sentences. This shows in lists and search.'),
    fieldsBox,
    area('body', 'Description & notes', e.body, 8, 'Link to other entries by name with [[double brackets]], e.g. [[The Silver Hand]].'),
    area('secret', 'GM-only secrets', e.secret, 4, 'Players never see this. Only signed-in GMs can read it.'),
    input('tags', 'Tags', (e.tags || []).join(', '), { placeholder: 'comma separated, e.g. north, war, session-12' }),
    el('div', { class: 'field wide' }, el('label', {}, 'Connections'), linksBox,
      el('button', { class: 'btn small', type: 'button', onclick: () => linksBox.append(linkRow()) }, '+ Add connection')),
    nameList(), el('datalist', { id: 'w-labels' }, LINK_LABELS.map((l) => el('option', { value: l }))),
    status,
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'submit' }, existing ? 'Save changes' : 'Create entry'),
      el('a', { class: 'btn ghost', href: existing ? `#world/e/${existing.id}` : '#world' }, 'Cancel'),
      existing ? confirmButton('Move to bin', async () => {
        try { await api('entries', { method: 'DELETE', query: { id: existing.id } }); world.entries.delete(existing.id); toast('Moved to the bin'); location.hash = `world/k/${existing.kind}`; }
        catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
      }, 'btn ghost') : null));
  renderFields();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    collectFields();
    const f = new FormData(form);
    const parentName = String(f.get('parent') || '').trim();
    const parentEntry = parentName ? findByName(parentName) : null;
    if (parentName && !parentEntry) { status.textContent = `There’s no entry called “${parentName}”. Create it first, or leave “Located in” blank.`; status.className = 'form-status error'; return; }
    const links = []; const unknown = [];
    for (const row of linksBox.querySelectorAll('.link-row')) {
      const name = row.querySelector('.l-target').value.trim(); if (!name) continue;
      const t = findByName(name);
      if (!t) { unknown.push(name); continue; }
      links.push({ id: t.id, label: row.querySelector('.l-label').value.trim() || 'related to', secret: row.querySelector('.l-secret').checked });
    }
    if (unknown.length) { status.textContent = `These connections don’t match any entry: ${unknown.join(', ')}.`; status.className = 'form-status error'; return; }
    const entry = {
      kind: kindSel.value, name: String(f.get('name')).trim(), summary: String(f.get('summary') || ''), body: String(f.get('body') || ''), secret: String(f.get('secret') || ''),
      fields: Object.fromEntries(Object.entries(e.fields).filter(([k, v]) => v && KINDS[kindSel.value].fields.some(([fk]) => fk === k))),
      tags: String(f.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean), links, parent_id: parentEntry?.id || null, version: existing?.version,
    };
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = existing ? await api('entries', { method: 'PUT', query: { id: existing.id }, body: { entry } }) : await api('entries', { method: 'POST', body: { entry } });
      world.entries.set(r.entry.id, r.entry);
      toast(existing ? 'Saved' : 'Added to the world');
      location.hash = `world/e/${r.entry.id}`;
    } catch (err) {
      status.textContent = err.message; status.className = 'form-status error';
      if (err.status === 409 && err.body?.entry) world.entries.set(err.body.entry.id, err.body.entry);
    }
  });

  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, existing ? `Edit ${existing.name}` : `New ${kindLabel(e.kind).toLowerCase()}`),
    el('p', {}, existing ? `Last edited by ${existing.updated_by || 'someone'} ${when(existing.updated_at)}. If another GM saves first, you’ll be told before anything is overwritten.` : 'Everything except the name is optional. You can fill it in later.')), form);
}

async function viewBin() {
  if (!isGm()) return notice('GMs only', 'Sign in to see deleted entries.');
  try {
    const r = await api('entries', { query: { bin: 1 } });
    return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, 'Bin'), el('p', {}, 'Deleted entries. Restore any of them.')),
      r.entries.length ? el('ul', { class: 'entry-list' }, r.entries.map((e) => el('li', {}, el('span', {}, e.name), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, `${e.updated_by || ''} ${when(e.updated_at)}`),
        el('button', { class: 'btn small', type: 'button', onclick: async () => { await api('entries', { method: 'DELETE', query: { id: e.id, restore: 1 } }); await loadWorld(true); toast(`Restored ${e.name}`); location.hash = `world/e/${e.id}`; } }, 'Restore'))))
        : notice('The bin is empty', 'Nothing has been deleted.'));
  } catch (err) { return notice('Couldn’t load the bin', err.message); }
}

// ---- routing -----------------------------------------------------------------------------------

export async function showWorld(parts) {
  if (session.configured === false || session.configured === 'offline') {
    side.replaceChildren();
    main.replaceChildren(notice('The shared world isn’t connected yet',
      session.configured === 'offline'
        ? 'This copy of the app is running without its server, so the shared world is unavailable. Everything else works.'
        : 'The admin needs to connect the database: add Neon Postgres to the Vercel project and set ADMIN_CODE. See the README for the two steps.'));
    return;
  }
  if (!world.loaded) { main.replaceChildren(el('p', { class: 'muted' }, 'Loading the world…')); await loadWorld(); }
  if (world.error) { main.replaceChildren(notice('Couldn’t load the world', world.error.message, el('button', { class: 'btn', type: 'button', onclick: () => { loadWorld(true).then(() => showWorld(parts)); } }, 'Try again'))); return; }
  renderSide();
  const [view, arg] = parts;
  let node;
  if (view === 'k') node = viewKind(arg);
  else if (view === 'e') node = viewEntry(arg);
  else if (view === 'new') node = viewEdit(null, arg);
  else if (view === 'edit') node = viewEdit(arg);
  else if (view === 'q') node = viewSearch(decodeURIComponent(arg || ''));
  else if (view === 'bin') node = await viewBin();
  else node = viewHome();
  main.replaceChildren(node);
  for (const a of side.querySelectorAll('.w-kinds a')) a.classList.toggle('active', (view === 'k' && a.dataset.kind === arg) || (view === 'e' && world.entries.get(arg)?.kind === a.dataset.kind));
  window.scrollTo({ top: 0 });
}

export function mountWorld(root) {
  side = el('aside', { class: 'w-side' });
  main = el('div', { class: 'w-main' });
  root.append(el('div', { class: 'w-layout' }, side, main));
  window.addEventListener('world:draft', (ev) => {
    const d = ev.detail || {};
    if (!isGm()) { toast('Sign in as a GM to add things to the shared world'); openSignIn(); return; }
    draft = { ...d, fields: { ...(d.fields || {}) } };
    location.hash = `world/new/${d.kind}`;
  });
  onSession(() => { world.loaded = false; if (location.hash.startsWith('#world')) showWorld(location.hash.slice(1).split('/').slice(1)); });
}
