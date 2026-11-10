// Search everything: Ctrl+K (⌘K on a Mac) or "/" opens one box for pages, actions, world entries and rules.
import { el, setKids } from './dom.js';
import { TOOL_LIST } from './tool-list.js';
import { KINDS, KIND_ORDER } from './world-schema.js';
import { session, isGm, isAdmin, isOwner, isPlayer } from './api.js';
import { readRecent } from './recent.js';
import { nearWord, wordsOf } from './name-check.js';

// The rules, magic items and the world load the first time the palette opens, not with every page.
let M = null;
async function loadData() {
  if (!M) {
    const [rules, items, store, hours, calendar, wh, routine, appearances, week, wishes] = await Promise.all([import('./rules2024.js'), import('./magic-items.js'), import('./world-store.js'), import('./shop-hours.js'), import('./calendar.js'), import('./world-hours.js'), import('./world-routine.js'), import('./appearances.js'), import('./week-in-town.js'), import('./world-wishes.js')]);
    M = { ...rules, MAGIC_ITEMS: items.MAGIC_ITEMS, store, hours, calendar, wh, routine, appearances, week, wishes, changes: [] };
    // Shipped changes (What's new), fetched alongside without holding the box up.
    Promise.all([import('./changelog.js'), fetch('/ROADMAP.md').then((r) => (r.ok ? r.text() : ''))])
      .then(([c, md]) => { M.changes = c.changelog(md); if (dialog?.open) render(); }).catch(() => {});
  }
  return M;
}

let dialog, input, list, items = [], active = 0;

function baseItems() {
  const out = [
    ...TOOL_LIST.map((t) => ({ label: t.label, group: 'Table tools', href: `#tools/${t.id}` })),
    { label: 'Character Forge', group: 'Pages', href: '#characters', hint: 'Roll a 2024-rules character' },
    { label: 'World', group: 'Pages', href: '#world' },
    { label: 'The Party', group: 'World', href: '#world/party', hint: 'Party members, treasury, loot log, handouts' },
    { label: 'Calendar', group: 'World', href: '#world/calendar', hint: 'Today’s date, moons, holidays, days pass' },
    { label: 'Export & print', group: 'World', href: '#world/export', hint: 'Markdown or a print page, GM or player copy' },
    { label: 'Your library', group: 'World', href: '#world/library', hint: 'Monsters, items, classes and species from your books' },
    { label: 'Who stands where', group: 'World', href: '#world/powers', hint: 'Faction relationship grid: allies, rivals, wars' },
    { label: 'Faction clocks', group: 'World', href: '#world/clocks', hint: 'Plans in motion; run a faction turn' },
    { label: 'Table talk', group: 'World', href: '#world/table', hint: 'What players and GMs are saying' },
    { label: 'Maps', group: 'World', href: '#world/maps' },
    { label: 'Relationship web', group: 'World', href: '#world/web' },
    { label: 'Party standing', group: 'World', href: '#world/standings' },
    ...KIND_ORDER.map((k) => ({ label: KINDS[k].plural, group: 'World', href: `#world/k/${k}` })),
    ...['classes', 'species', 'backgrounds', 'feats', 'spells', 'items', 'slots'].map((t) => ({ label: `Reference: ${t === 'slots' ? 'spell slots' : t === 'items' ? 'magic items' : t}`, group: 'Pages', href: `#reference/${t}` })),
    ...Object.keys(M.CLASSES).map((c) => ({ label: c, group: 'Class', href: '#reference/classes', filter: c })),
    ...Object.keys(M.SPECIES).map((c) => ({ label: c, group: 'Species', href: '#reference/species', filter: c })),
    ...Object.keys(M.BACKGROUNDS).map((c) => ({ label: c, group: 'Background', href: '#reference/backgrounds', filter: c })),
    ...Object.keys(M.ORIGIN_FEATS).map((c) => ({ label: c, group: 'Feat', href: '#reference/feats', filter: c })),
    ...M.MAGIC_ITEMS.map((i) => ({ label: i.name, group: i.cursed ? 'Cursed item' : 'Magic item', href: '#reference/items', filter: i.name, hint: i.summary })),
  ];
  if (isGm()) {
    out.push({ label: 'GM discussions', group: 'World', href: '#world/talk' });
    for (const k of KIND_ORDER) out.push({ label: `New ${KINDS[k].label === 'NPC' ? 'NPC' : KINDS[k].label.toLowerCase()}`, group: 'Create', href: `#world/new/${k}` });
  }
  if (isPlayer()) out.push({ label: 'New character', group: 'Create', href: '#world/new/character' }, { label: 'New journal entry', group: 'Create', href: '#world/new/journal' }, { label: 'My things', group: 'World', href: '#world/mine' });
  if (isGm()) out.push({ label: 'Import notes', group: 'World', href: '#world/import', hint: 'Markdown files, an Obsidian folder, or pasted text' }, { label: 'Suggestions from players', group: 'World', href: '#world/suggestions' }, { label: 'Session prep', group: 'World', href: '#world/prep', hint: 'Everything for next session on one page' });
  if (isOwner() || isAdmin()) out.push({ label: 'Admin', group: 'Pages', href: '#admin' }, { label: 'Members & invites', group: 'Admin', href: '#admin/members' });
  out.push({ label: 'Worlds', group: 'Pages', href: '#worlds', hint: 'Switch, create or join a world' });
  out.push({ label: 'What’s new', group: 'Pages', href: '#news', hint: 'Everything added to the Satchel, newest first' });
  out.push(...(M.changes || []).map((c) => ({ label: `What’s new: ${c.title}`, group: `Change #${c.n}`, href: `#news/${c.n}`, hint: c.text, haystack: c.text, minor: true })));
  return out;
}

function entryItems() {
  // Open now in search: a shop or tavern says whether it's open by the world's clock.
  const info = M.store.world.info || {}, holiday = info.clock?.minutes === undefined ? '' : M.hours.tradeDay(M.calendar.cleanCalendar(info.cal));
  const hours = (e) => (info.clock?.minutes === undefined || e.kind !== 'location' || !(e.fields?.stock || e.fields?.menu) ? null : M.hours.openText(e, info.clock.minutes, M.wh.dayFor(e)));
  const open = (e) => { const o = hours(e); return o ? `${o.open ? '🟢' : '🔒'} ${o.text}` : ''; };
  return M.store.worldEntries().map((e) => ({ label: e.name, group: M.store.kindLabel(e.kind), href: `#world/e/${e.id}`, openNow: hours(e)?.open, hint: [open(e), e.summary || (e.fields?.routine ? `Routine: ${String(e.fields.routine).slice(0, 90)}` : '')].filter(Boolean).join(' · '), haystack: `${e.name} ${(e.tags || []).join(' ')} ${Object.values(e.fields || {}).join(' ')}` }));
}

// Shipped changes rank under every page and entry that matches at all (but above typos).
function score(item, q) {
  const s = scoreOf(item, q);
  return item.minor ? s * 0.12 : s;
}

function scoreOf(item, q) {
  const name = item.label.toLowerCase();
  if (!q) return item.group === 'Table tools' || item.group === 'Pages' ? 1 : 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.split(/[\s’'-]+/).some((w) => w.startsWith(q))) return 60;
  if (name.includes(q)) return 40;
  if ((item.haystack || '').toLowerCase().includes(q)) return 15;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => `${name} ${(item.haystack || '').toLowerCase()} ${item.group.toLowerCase()}`.includes(w))) return 20;
  // A typo or two: still found, below everything that matched as typed.
  if (words.length && words.every((w) => nearWord(w, wordsOf(item.label)))) return 10;
  return 0;
}

function render() {
  if (!M) return;
  const q = input.value.trim().toLowerCase();
  const all = [...baseItems(), ...entryItems()];
  // Search the logs: "log: dragon" lists the sessions whose log mentions it, newest first, each with the sentence.
  const lg = /^(?:log|logs|in the log):\s*(.+)$/.exec(q);
  if (lg) {
    const word = lg[1].trim();
    // Session logs first (newest first), then the players' journal entries (newest first).
    const journals = M.store.worldEntries().filter((x) => x.kind === 'journal').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    items = [...M.appearances.sessionOrder(M.store.worldEntries()), ...journals].map((sn) => ({ sn, line: M.appearances.quoteOf(sn, { name: word }, 90) })).filter((x) => x.line)
      .slice(0, 40).map(({ sn, line }) => ({ label: sn.name, group: sn.kind === 'journal' ? 'In a journal' : 'In the log', href: `#world/e/${sn.id}`, hint: line }));
    active = Math.min(active, Math.max(0, items.length - 1));
    setKids(list, ...(items.length ? items.map((it, i) => el('li', { role: 'option', id: `pal-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '', onmousedown: (ev) => { ev.preventDefault(); go(it); } },
      el('span', { class: 'pal-label' }, it.label), el('span', { class: 'pal-hint' }, it.hint), el('span', { class: 'pal-group' }, it.group)))
      : [el('li', { class: 'pal-empty' }, `No session log or journal entry mentions “${word}”.`)]));
    input.setAttribute('aria-activedescendant', items.length ? `pal-${active}` : '');
    return;
  }
  // "Who's at the Bell": who the routines put at a place (or inside it) right now.
  const at = /^(?:who'?s |who’s |who is )?at (.+)$/.exec(q);
  const bare = (t) => t.toLowerCase().replace(/^the /, '').trim();
  const place = at && M.store.worldEntries().find((e) => ['location', 'settlement', 'region', 'area'].includes(e.kind) && bare(e.name) === bare(at[1]));
  if (place) {
    const a = M.routine.aroundNow(place), hh = (x) => `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    items = (a?.list || []).map(({ npc, place: p, until }) => ({ label: npc.entry.name, group: 'Here now', href: `#world/e/${npc.entry.id}`, hint: [p.id === place.id ? '' : `at ${p.name}`, until !== null ? `until ${hh(until)}` : ''].filter(Boolean).join(' ') }))
      .sort((x, y) => x.label.localeCompare(y.label)).slice(0, 40);
    items.unshift({ label: place.name, group: M.store.kindLabel(place.kind), href: `#world/e/${place.id}`, hint: a ? `${items.length} here at ${hh(a.m)}` : 'The world has no clock yet' });
    active = Math.min(active, Math.max(0, items.length - 1));
    setKids(list, ...items.map((it, i) => el('li', { role: 'option', id: `pal-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '', onmousedown: (ev) => { ev.preventDefault(); go(it); } },
      el('span', { class: 'pal-label' }, it.label), it.hint ? el('span', { class: 'pal-hint' }, it.hint) : null, el('span', { class: 'pal-group' }, it.group))));
    input.setAttribute('aria-activedescendant', `pal-${active}`);
    return;
  }
  // "Holidays": the coming holidays (the next 90 days), the party's town's own included, soonest first.
  let holidays = [];
  if (/^(holidays?|festivals?)$/.test(q)) {
    let town = null; try { town = M.routine.partyTown(); } catch { town = null; }
    const cal = M.calendar.withLocal(M.calendar.cleanCalendar(M.store.world.info?.cal), town?.kind === 'settlement' ? town : null);
    holidays = M.calendar.upcomingHolidays(cal, 90).slice(0, 20).map(({ holiday: h, date, inDays }) => {
      const t = M.calendar.holidayTitle(h, date.year);
      return { label: `${t[0].toUpperCase()}${t.slice(1)}${h.local ? ` (${h.local})` : ''}`, group: 'Holiday', href: `#world/calendar/${date.year}/${date.month}`, hint: `🎉 ${date.day} ${cal.months[date.month].name} · ${M.week.inDaysText(inDays)}` };
    });
  }
  // "Stalls": today's market stalls in every town having its market, each with its goods.
  let stallItems = [];
  if (/^(stalls?|market stalls?)$/.test(q)) {
    stallItems = M.store.worldEntries().filter((e) => e.kind === 'settlement').flatMap((t) => M.routine.todaysStalls(t).map((st) => ({ label: st.name, group: `Stall in ${t.name}`, href: `#world/e/${t.id}/market`, hint: st.goods.map((g) => `${g.name} ${g.price}`).join(', ') }))).slice(0, 30);
  }
  // "Wishes": the open wishes this person may see (their own characters', or everyone's for GMs), with where each is
  // for sale in the party's town today.
  let wishItems = [];
  if (/^(wish(es|list)?|wish lists?)$/.test(q)) {
    let town = null; try { town = M.routine.partyTown(); } catch { town = null; }
    const cp = (n) => { const g = Math.floor(n / 100), sv = Math.floor((n % 100) / 10), c = n % 10; return [g && `${g} gp`, sv && `${sv} sp`, c && `${c} cp`].filter(Boolean).join(' ') || '0 gp'; };
    wishItems = M.wishes.partyWishes(town?.kind === 'settlement' ? town : null).slice(0, 30).map((w) => ({ label: w.wish.text, group: `${w.who.name} wishes`, href: `#world/e/${w.who.id}`,
      hint: w.at.length ? `⭐ For sale: ${w.at.slice(0, 2).map((x) => `${typeof x.where === 'string' ? x.where : x.where.name} (${cp(x.good.cp)})`).join(', ')}` : '⭐ Not for sale here today' }));
  }
  // "Market": the towns with a market day, and when each is next (soonest first; holidays skipped), above the
  // ordinary matches for the word.
  let markets = [];
  if (/^(markets?|market days?)$/.test(q)) {
    const cal = M.calendar.cleanCalendar(M.store.world.info?.cal);
    markets = M.store.worldEntries().filter((e) => e.kind === 'settlement' && e.fields?.market_day).map((e) => ({ e, m: cal ? M.week.nextMarket(M.calendar.withLocal(cal, e), e) : null }))
      .sort((a, b) => (a.m ? a.m.inDays : 1e9) - (b.m ? b.m.inDays : 1e9) || a.e.name.localeCompare(b.e.name)).slice(0, 20)
      .map(({ e, m }) => ({ label: e.name, group: 'Market day', href: `#world/e/${e.id}`, hint: m ? (m.inDays === 0 ? `🧺 Market day today (${m.weekday})` : `🧺 Next market ${m.weekday}, ${M.week.inDaysText(m.inDays)}`) : `🧺 Market on ${e.fields.market_day}s` }));
  }
  // "Open now": every shop and tavern open at the world's hour, by name.
  if (/^(open now|what'?s open( now)?|what’s open( now)?)$/.test(q)) {
    items = all.filter((it) => it.openNow).sort((a, b) => a.label.localeCompare(b.label)).slice(0, 40);
    active = Math.min(active, Math.max(0, items.length - 1));
    setKids(list, ...(items.length ? items.map((it, i) => el('li', { role: 'option', id: `pal-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '', onmousedown: (ev) => { ev.preventDefault(); go(it); } },
      el('span', { class: 'pal-label' }, it.label), it.hint ? el('span', { class: 'pal-hint' }, it.hint.length > 70 ? `${it.hint.slice(0, 68)}…` : it.hint) : null, el('span', { class: 'pal-group' }, 'Open now')))
      : [el('li', { class: 'pal-empty' }, M.store.world.info?.clock ? 'Nothing’s open just now.' : 'The world has no clock yet, so nothing can say it’s open.')]));
    input.setAttribute('aria-activedescendant', items.length ? `pal-${active}` : '');
    return;
  }
  items = all.map((it) => [score(it, q), it]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label)).slice(0, 40).map(([, it]) => it);
  if (markets.length) items = [...markets, ...items.filter((it) => !markets.some((m) => m.href === it.href))].slice(0, 40);
  if (holidays.length) items = [...holidays, ...items].slice(0, 40);
  if (stallItems.length) items = [...stallItems, ...items].slice(0, 40);
  if (wishItems.length) items = [...wishItems, ...items].slice(0, 40);
  // Nothing typed yet: the entries you opened last come first.
  if (!q) {
    let recent = [];
    try { recent = readRecent(localStorage, session.worldKey).map((id) => M.store.world.entries.get(id)).filter(Boolean).slice(0, 6); } catch { /* storage blocked */ }
    items = [...recent.map((e) => ({ label: e.name, group: 'Recently viewed', href: `#world/e/${e.id}`, hint: e.summary })), ...items].slice(0, 40);
  }
  active = Math.min(active, Math.max(0, items.length - 1));
  setKids(list, ...(items.length ? items.map((it, i) => el('li', { role: 'option', id: `pal-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '', onmousedown: (ev) => { ev.preventDefault(); go(it); }, onmousemove: () => { if (active !== i) { active = i; mark(); } } },
    el('span', { class: 'pal-label' }, it.label), it.hint ? el('span', { class: 'pal-hint' }, it.hint.length > 70 ? `${it.hint.slice(0, 68)}…` : it.hint) : null, el('span', { class: 'pal-group' }, it.group)))
    : [el('li', { class: 'pal-empty' }, M.store.world.loaded || session.configured !== true ? 'Nothing matches.' : 'Nothing matches yet. The world is still loading…')]));
  input.setAttribute('aria-activedescendant', items.length ? `pal-${active}` : '');
}
function mark() { [...list.children].forEach((li, i) => { li.classList.toggle('active', i === active); li.setAttribute('aria-selected', String(i === active)); }); input.setAttribute('aria-activedescendant', `pal-${active}`); list.children[active]?.scrollIntoView({ block: 'nearest' }); }

function go(it) {
  dialog.close();
  location.hash = it.href.slice(1);
  if (it.filter) setTimeout(() => { const f = document.getElementById('ref-filter'); if (f) { f.value = it.filter; f.dispatchEvent(new Event('input')); } }, 50);
}

export async function openPalette() {
  input.value = ''; active = 0; dialog.showModal(); input.focus();
  setKids(list, el('li', { class: 'pal-empty' }, 'Loading…'));
  await loadData();
  render();
  if (session.configured === true && !M.store.world.loaded) M.store.loadWorld().then(() => { if (dialog.open) render(); });
}

export function initPalette() {
  input = el('input', { type: 'search', id: 'pal-input', placeholder: 'Search tools, world entries, classes, feats…', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', autocomplete: 'off', spellcheck: 'false' });
  list = el('ul', { id: 'pal-list', role: 'listbox', class: 'pal-list' });
  dialog = el('dialog', { class: 'dialog palette', 'aria-label': 'Search everything' }, input, list, el('p', { class: 'pal-foot muted small' }, '↑ ↓ to move · Enter to open · Esc to close'));
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { active = Math.min(items.length - 1, active + 1); mark(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); mark(); ev.preventDefault(); }
    else if (ev.key === 'Enter' && items[active]) { go(items[active]); ev.preventDefault(); }
  });
  document.body.append(dialog);
  document.addEventListener('keydown', (ev) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((ev.key === 'k' || ev.key === 'K') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); if (dialog.open) dialog.close(); else openPalette(); }
    else if (ev.key === '/' && !typing && !dialog.open) { ev.preventDefault(); openPalette(); }
  });
}
