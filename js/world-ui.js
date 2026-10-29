// The shared world: browse, search, read and (for GMs) write entries.
// Routes: #world · #world/k/<kind> · #world/e/<id> · #world/new/<kind> · #world/edit/<id> · #world/q/<search> · #world/bin
//         #world/party · #world/zero (session zero) · #world/schedule · #world/downtime[/<character>] · #world/suggestions (GMs) · #world/mine (your characters, journals and suggestions)

import { el, toast, toastUndo, confirmButton, setKids } from './dom.js';
import { api, session, isGm, isMember, isPlayer, signedIn, onSession, setPreview } from './api.js';
import { KINDS, KIND_ORDER, LINK_LABELS, STANDING_KINDS, PLACE_KINDS, PLAYER_KINDS, fieldApplies } from './world-schema.js';
import { openSignIn } from './signin.js';
import { stripMarks } from './rich.js';
import { world, worldEntries, getEntry, loadWorld, byName, kindLabel, kindFields, richInline, link, when, findByName, mentions, richText, contentsNav, notice, nameList } from './world-store.js';
import { viewMaps, viewMap, pinsFor } from './world-maps.js';
import { viewStandings, standingWidget } from './world-standings.js';
import { viewTalk, talkWidget, tableWidget, viewTable } from './world-talk.js';
import { placeHub, viewAtlas, placeCounts } from './world-place.js';
import { viewParty } from './world-party.js';
import { viewSchedule, nextSessionLine } from './world-schedule.js';
import { viewDowntime, downtimeSection } from './world-downtime.js';
import { recapButton } from './world-recap.js';
import { showButton, checkShown } from './world-show.js';
import { attitudesOfCharacter, attitudesToward } from './world-attitudes.js';
import { noteBox, myNotesSection } from './world-notes.js';
import { objectivesSection } from './world-objectives.js';
import { whatsNewCard } from './world-whatsnew.js';
import { attendanceSection } from './world-attendance.js';
import { revealButton } from './world-reveal.js';
import { quickNoteButton } from './world-quicknote.js';
import { initLinkSuggest } from './link-suggest.js';
import { bulkControls } from './world-bulk.js';
import { customFieldsButton } from './world-fields.js';
import { goalsSection } from './world-goals.js';
import { wishesSection } from './world-wishes.js';
import { farewellCard } from './world-hall.js';
import { askNav, askAboutLink } from './world-ask.js';
import { quoteCard } from './world-quotes.js';
import { previouslyCard } from './world-previously.js';
import { itemCardButton, spellCardButton } from './world-playcards.js';
import { mentionsCard } from './world-mentions.js';
import { starButton, favoritesNav, followButton, followingNav } from './world-favorites.js';
import { rewardCard } from './world-reward.js';
import { appearances } from './appearances.js';
import { withPronouns } from './world-profiles.js';
import { noticesCard, drawNoticeBanner } from './world-notices.js';
import { gallerySection } from './world-gallery.js';
import { talkResults } from './world-talk-search.js';
import { shareButton } from './world-share.js';
import { suggestEditButton, editsSection, myEditsSection } from './world-edits.js';
import { nameCheck } from './world-namecheck.js';
import { pollsCard } from './world-polls.js';
import { clockCard } from './world-clock.js';
import { startHereButton, startHereCard } from './world-start.js';
import { viewTags, tagNote } from './world-tags.js';
import { pushRecent, readRecent } from './recent.js';
import { copyPlaceDialog } from './world-copyplace.js';
import { mergeButton } from './world-merge.js';
import { sayLine } from './world-say.js';
import { rollButton } from './world-roll.js';
import { cleanSay, sayOf } from './say.js';
import { cleanMusic } from './music.js';
import { musicLine } from './world-music.js';
import { tableSection } from './world-tables.js';
import { parseSearch, searchHash, searchEntries } from './search.js';
import { saveTemplateButton, templatePicker } from './world-templates.js';
import { fillHistory } from './world-history.js';
import { viewCards, cardsButton } from './world-cards.js';
import { encounterCard } from './encounter-ui.js';
import { bondsSection } from './world-bonds.js';
import { viewClocks, clocksWidget } from './world-clocks.js';
import { viewRumors } from './world-rumors.js';
import { familySection, clanTree, viewFamily } from './world-family.js';
import { knowsButtons, knownSection } from './world-known.js';
import { startCard, markPartySeen } from './onboarding.js';
import { viewCalendar, worldCalendar, todayText } from './world-calendar.js';
import { parseDate, toDays, yearLength } from './calendar.js';
import { sheetSection } from './sheet-ui.js';
import { pictureField, figure, thumb } from './image-ui.js';
import { renderStats, renderSpells } from './statblock-ui.js';
import { renderStock } from './shop-ui.js';
import { restockDraft } from './world-place.js';
import { npcStats, NPC_CLASS_OPTIONS } from './npc-stats.js';
import { patchEntry, setEntryState, stateBadges, syncWorld, descendantsOf } from './world-store.js';

// Pages used now and then load when first opened, so world pages start faster.
const lazyView = (load, name) => async (...args) => (await load())[name](...args);
const viewWeb = lazyView(() => import('./world-web.js'), 'viewWeb');
const viewSay = lazyView(() => import('./world-say.js'), 'viewSay');
const viewDupes = lazyView(() => import('./world-dupes.js'), 'viewDupes');
const viewHall = lazyView(() => import('./world-hall.js'), 'viewHall');
const viewAsk = lazyView(() => import('./world-ask.js'), 'viewAsk');
const viewQuotes = lazyView(() => import('./world-quotes.js'), 'viewQuotes');
const viewPictures = lazyView(() => import('./world-pictures.js'), 'viewPictures');
const viewNumbers = lazyView(() => import('./world-numbers.js'), 'viewNumbers');
const viewItemCards = lazyView(() => import('./world-playcards.js'), 'viewItemCards');
const viewSpellCards = lazyView(() => import('./world-playcards.js'), 'viewSpellCards');
const viewPrep = lazyView(() => import('./world-prep.js'), 'viewPrep');
const viewPowers = lazyView(() => import('./world-powers.js'), 'viewPowers');
const viewLibrary = lazyView(() => import('./world-library.js'), 'viewLibrary');
const viewImport = lazyView(() => import('./world-import.js'), 'viewImport');
const viewSessionSheet = lazyView(() => import('./world-sheet.js'), 'viewSessionSheet');
const viewTodo = lazyView(() => import('./world-todo.js'), 'viewTodo');
const viewZero = lazyView(() => import('./world-zero.js'), 'viewZero');
const viewPrintCharacter = lazyView(() => import('./world-print.js'), 'viewPrintCharacter');
const viewExport = lazyView(() => import('./world-export.js'), 'viewExport');

export { loadWorld, worldEntries };
const lower = (s) => (s === 'NPC' ? s : s.toLowerCase());
let draft = null;
let main, side, lastParts = [];

// ---- sidebar -----------------------------------------------------------------------------------

// The entries you opened last in this browser (folded away; the open one is left out).
function recentNav() {
  let ids = [];
  try { ids = readRecent(localStorage, session.worldKey); } catch { /* storage blocked */ }
  const here = location.hash.match(/^#world\/e\/([^/]+)/)?.[1];
  const list = ids.filter((id) => id !== here).map((id) => world.entries.get(id)).filter(Boolean).slice(0, 8);
  if (!list.length) return null;
  return el('details', { class: 'w-favs w-recent' }, el('summary', { class: 'w-favs-h' }, '🕘 Recently viewed'), el('ul', {}, list.map((e) => el('li', {}, link(e)))));
}

// A folding group of world views; open or shut is remembered in this browser. A shut group shows a dot when
// something inside it has news (a "new" count).
function navGroup(key, title, open, links) {
  let saved = null;
  try { saved = localStorage.getItem(`satchel-nav-${key}`); } catch { /* storage blocked */ }
  const list = links.filter(Boolean);
  const news = list.some((a) => a.querySelector('.count.new') || a.querySelector('.count')?.textContent === 'new');
  const d = el('details', { class: 'w-group', open: (saved === null ? open : saved === '1') || null },
    el('summary', {}, title, news ? [el('span', { class: 'w-dot', 'aria-hidden': 'true' }), el('span', { class: 'sr-only' }, ' (something new)')] : null), el('div', { class: 'w-group-links' }, list));
  d.addEventListener('toggle', () => { try { localStorage.setItem(`satchel-nav-${key}`, d.open ? '1' : '0'); } catch { /* storage blocked */ } });
  return d;
}

function renderSide() {
  const counts = {}; for (const e of world.entries.values()) counts[e.kind] = (counts[e.kind] || 0) + 1;
  const suggested = worldEntries().filter((e) => e.status === 'suggested').length;
  const search = el('input', { type: 'search', id: 'w-search', placeholder: 'Search the world…', 'aria-label': 'Search the world' });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter' && search.value.trim()) location.hash = `world/q/${encodeURIComponent(search.value.trim())}`; });
  setKids(side, 
    el('a', { href: '#world', class: 'w-home' }, world.info?.name || 'The World'),
    search,
    favoritesNav(),
    followingNav(session.gm?.name),
    recentNav(),
    isPlayer() ? el('div', { class: 'w-gm w-player' }, el('a', { class: 'btn primary small', href: '#world/new/character' }, '+ My character'), el('a', { class: 'btn small', href: '#world/new/journal' }, '+ Journal entry'),
      el('a', { class: 'btn ghost small', href: '#world/new/lore' }, 'Suggest an entry'), el('a', { class: 'btn ghost small', href: '#world/mine' }, 'My things'), el('a', { class: 'btn ghost small', href: '#world/export' }, 'Export')) : null,
    el('nav', { class: 'w-kinds w-tools', 'aria-label': 'World views' },
      navGroup('table', 'At the table', true, [
        el('a', { href: '#world/party', 'data-view': 'party' }, el('span', {}, 'The Party'), el('span', { class: 'count' }, worldEntries().filter((e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status)).length)),
        isMember() && (world.info?.primer || isGm()) ? el('a', { href: '#world/zero', 'data-view': 'zero' }, el('span', {}, 'Session zero'), el('span', { class: 'count' }, world.info?.zero_read === false ? 'new' : '')) : null,
        isMember() ? el('a', { href: '#world/schedule', 'data-view': 'schedule' }, el('span', {}, 'Next session'), el('span', { class: 'count' }, world.info?.next_session && Date.parse(world.info.next_session) > Date.now() - 86400000 ? new Date(world.info.next_session).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')) : null,
        isMember() ? el('a', { href: '#world/downtime', 'data-view': 'downtime' }, el('span', {}, 'Downtime'), el('span', { class: 'count' }, isGm() ? (worldEntries().filter((d) => d.kind === 'downtime' && !d.fields?.resolved).length || '') : '')) : null,
        el('a', { href: '#world/calendar', 'data-view': 'calendar', title: todayText() }, el('span', {}, 'Calendar'), el('span', { class: 'count cal-count' }, worldCalendar() ? todayText().split(', ').pop().replace(/ \d+.*$/, '') : '')),
        el('a', { href: '#world/table', 'data-view': 'table' }, el('span', {}, 'Table talk'), el('span', { class: 'count' }, '💬')),
        askNav(),
        isMember() ? el('a', { href: '#world/quotes', 'data-view': 'quotes' }, el('span', {}, 'Quote wall'), el('span', { class: 'count' }, '❝')) : null,
        isGm() ? el('a', { href: '#world/talk', 'data-view': 'talk' }, el('span', {}, 'GM discussions'), el('span', { class: 'count', id: 'w-talk-count' }, '')) : null,
      ]),
      navGroup('world', 'The world', true, [
        el('a', { href: '#world/atlas', 'data-view': 'atlas' }, el('span', {}, 'Atlas'), el('span', { class: 'count' }, worldEntries().filter((e) => PLACE_KINDS.includes(e.kind)).length)),
        el('a', { href: '#world/maps', 'data-view': 'maps' }, el('span', {}, 'Maps'), el('span', { class: 'count' }, (world.maps || []).length)),
        el('a', { href: '#world/web', 'data-view': 'web' }, el('span', {}, 'Relationship web'), el('span', { class: 'count' }, '◎')),
        el('a', { href: '#world/powers', 'data-view': 'powers' }, el('span', {}, 'Who stands where'), el('span', { class: 'count' }, '▦')),
        el('a', { href: '#world/clocks', 'data-view': 'clocks' }, el('span', {}, 'Faction clocks'), el('span', { class: 'count' }, (world.standings?.clocks || []).length)),
        el('a', { href: '#world/standings', 'data-view': 'standings' }, el('span', {}, 'Party standing'), el('span', { class: 'count' }, Object.keys(world.standings?.current || {}).length)),
        el('a', { href: '#world/tags', 'data-view': 'tags' }, el('span', {}, 'Tags'), el('span', { class: 'count' }, new Set(worldEntries().flatMap((e) => e.tags || [])).size || '')),
        el('a', { href: '#world/library', 'data-view': 'library' }, el('span', {}, 'Your library'), el('span', { class: 'count' }, worldEntries().filter((e) => e.kind === 'creature' || e.kind === 'rule' || (e.kind === 'item' && e.fields?.source)).length)),
      ]),
      navGroup('extras', 'Extras', false, [
        el('a', { href: '#world/pictures', 'data-view': 'pictures' }, el('span', {}, 'Picture wall'), el('span', { class: 'count' }, '▣')),
        el('a', { href: '#world/numbers', 'data-view': 'numbers' }, el('span', {}, 'In numbers'), el('span', { class: 'count' }, '#')),
        el('a', { href: '#world/say', 'data-view': 'say' }, el('span', {}, 'Say it right'), el('span', { class: 'count' }, worldEntries().filter((e) => sayOf(e)).length || '')),
        el('a', { href: '#world/hall', 'data-view': 'hall' }, el('span', {}, 'Hall of heroes'), el('span', { class: 'count' }, worldEntries().filter((e) => e.kind === 'character' && ['Retired', 'Dead', 'Missing'].includes(e.fields?.status)).length || '')),
      ])),
    el('nav', { class: 'w-kinds', 'aria-label': 'Entry types' }, KIND_ORDER.map((k) => el('a', { href: `#world/k/${k}`, 'data-kind': k }, el('span', {}, KINDS[k].plural), el('span', { class: 'count' }, counts[k] || 0)))),
    isGm() ? el('div', { class: 'w-gm' }, el('a', { class: 'btn primary small', href: '#world/prep' }, 'Session prep'), el('a', { class: 'btn small', href: '#world/new/npc' }, '+ New entry'), el('a', { class: 'btn ghost small', href: '#world/bin' }, 'Bin'),
      el('a', { class: 'btn ghost small', href: '#world/export' }, 'Export & print'), el('a', { class: 'btn ghost small', href: '#world/import' }, 'Import notes'), el('a', { class: 'btn ghost small', href: '#world/todo' }, 'What needs writing'), el('button', { class: 'btn ghost small', type: 'button', title: 'Check what players can see (this tab only)', onclick: () => setPreview(true) }, '👁 See it as a player'),
      suggested + (world.info?.edits_open || 0) ? el('a', { class: 'btn small suggest-btn', href: '#world/suggestions' }, `Suggestions (${suggested + (world.info?.edits_open || 0)})`) : null) : null,
    !isMember() && signedIn() ? el('p', { class: 'muted small w-visitor' }, 'You’re browsing as a visitor. Ask the owner for an invite to add things.') : null,
  );
}

// ---- views -------------------------------------------------------------------------------------

// A nudge on the front page until a member has read the session zero page.
function zeroNudge() {
  if (!world.info?.primer || world.info.zero_read !== false) return null;
  return el('section', { class: 'card zero-nudge' }, el('h3', {}, 'Before your first session'),
    el('p', {}, 'Read the session zero page: what kind of game this is', world.info.primer.tone ? ` (${world.info.primer.tone})` : '', ', the house rules and the safety tools. You can tell the GMs privately what you’d like kept out of the game.'),
    el('a', { class: 'btn primary', href: '#world/zero' }, 'Read session zero'));
}

function viewHome() {
  const all = worldEntries();
  const recent = [...all].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 12);
  const info = world.info || {};
  const keyNpcs = all.filter((e) => e.kind === 'npc' && (e.tags || []).includes('key')).sort(byName);
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, info.name || 'The World'), info.tagline ? el('p', {}, info.tagline) : null,
      worldCalendar() ? el('p', { class: 'today-line' }, el('a', { href: '#world/calendar' }, `📅 ${todayText()}`)) : null, isMember() ? nextSessionLine() : null),
    zeroNudge(),
    previouslyCard(),
    quoteCard(),
    // Open for newcomers (no earlier visit, or session zero not read yet), folded for everyone else.
    startHereCard({ fresh: !world.info?.prev_visit || world.info?.zero_read === false }),
    // The table's things side by side: notices, quick polls, time and light.
    el('div', { class: 'home-table' }, noticesCard(rerenderWorld), pollsCard(), clockCard()),
    whatsNewCard(),
    startCard(rerenderWorld),
    info.about ? el('div', { class: 'card' }, richText(info.about)) : (isGm() ? el('p', { class: 'muted' }, 'The admin can name the world and write an introduction in the Admin page.') : null),
    all.length ? null : notice('This world is empty', isGm() ? 'Start with a region or a city, then fill it with factions and people. Anything from the table tools can be sent here with “Add to world”.' : 'The GMs haven’t added anything yet.',
      isGm() ? el('div', { class: 'btnrow' }, el('a', { class: 'btn primary', href: '#world/new/region' }, 'New region'), el('a', { class: 'btn', href: '#world/new/settlement' }, 'New settlement'), el('a', { class: 'btn', href: '#world/new/faction' }, 'New faction')) : null),
    el('div', { class: 'kind-grid' }, KIND_ORDER.map((k) => {
      const n = all.filter((e) => e.kind === k).length;
      return el('a', { class: 'kind-card', href: `#world/k/${k}` }, el('strong', {}, KINDS[k].plural), el('span', { class: 'count' }, n), el('small', {}, KINDS[k].blurb));
    })),
    keyNpcs.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Key NPCs'),
      el('ul', { class: 'people-grid' }, keyNpcs.map((e) => el('li', { class: 'person card key' }, el('div', { class: 'person-head' }, el('span', { class: 'key-star', 'aria-hidden': 'true' }, '★'), link(e)),
        el('span', { class: 'muted small' }, [e.fields?.role, getEntry(e.parent_id)?.name].filter(Boolean).join(' · ')), e.summary ? el('p', { class: 'small' }, e.summary) : null)))) : null,
    recent.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Recently changed'),
      el('ul', { class: 'entry-list' }, recent.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, `${e.updated_by ? `${e.updated_by}, ` : ''}${when(e.updated_at)}`))))) : null);
}

function entryCard(e) {
  return el('li', { 'data-id': e.id, class: `entry-card${e.visibility === 'gm' ? ' is-hidden' : ''}${e.status === 'suggested' ? ' is-suggested' : ''}` }, thumb(e), el('div', { class: 'card-title' }, link(e), stateBadges(e)), e.summary ? el('p', {}, ((s) => (s.length > 180 ? `${s.slice(0, 178)}…` : s))(stripMarks(e.summary))) : null,
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => el('a', { class: 'tagchip', href: `#world/q/${encodeURIComponent(`#${t}`)}` }, `#${t}`))) : null);
}

function viewKind(kind) {
  if (!KINDS[kind]) return notice('Nothing here', 'That kind of entry doesn’t exist.');
  let list = worldEntries().filter((e) => e.kind === kind);
  if (kind === 'event') {
    // Timeline order: the date as the world calendar reads it, else the sort year. Sessions with an in-world date
    // join the timeline, so the world's history and the table's line up.
    const cal = worldCalendar();
    const when = (e) => (e.kind === 'session' ? e.fields.world_date : e.fields.date);
    const key = (e) => { const d = cal && parseDate(cal, when(e)); return d ? toDays(cal, d) / yearLength(cal) : parseFloat(e.fields.sort) || 0; };
    if (cal) list = [...list, ...worldEntries().filter((e) => e.kind === 'session' && parseDate(cal, e.fields?.world_date))];
    list.sort((a, b) => key(a) - key(b) || byName(a, b));
  }
  else if (kind === 'session') list.sort((a, b) => (parseFloat(b.fields.number) || 0) - (parseFloat(a.fields.number) || 0) || String(b.fields.played_on || b.created_at).localeCompare(String(a.fields.played_on || a.created_at)));
  else list.sort(byName);
  const listNode = list.length ? (kind === 'session' ? sessionList(list) : kind === 'event'
      ? el('ol', { class: 'timeline' }, list.map((e) => (e.kind === 'session'
        ? el('li', { class: 'tl-session', 'data-id': e.id }, el('span', { class: 'date' }, e.fields.world_date), el('div', {}, el('span', { class: 'tag' }, 'Played'), ' ', link(e), e.fields.played_on ? el('span', { class: 'muted small' }, ` at the table ${e.fields.played_on}`) : null, e.summary ? el('p', {}, e.summary) : null))
        : el('li', { 'data-id': e.id }, el('span', { class: 'date' }, e.fields.date || e.fields.sort || '—'), el('div', {}, link(e), e.summary ? el('p', {}, e.summary) : null)))))
      : el('ul', { class: 'entry-grid' }, list.map(entryCard))) : null;
  const bulk = listNode ? bulkControls(list, listNode) : {};
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, KINDS[kind].plural), el('p', {}, KINDS[kind].blurb)),
      el('div', { class: 'btnrow' }, bulk.button, customFieldsButton(kind, rerenderWorld, 'btn ghost'),
        kind === 'item' && list.length && isMember() ? el('a', { class: 'btn ghost', href: '#world/itemcards' }, 'Print cards') : null,
        kind === 'session' && isGm() ? [recapButton('btn'), el('a', { class: 'btn primary', href: '#world/new/session' }, 'New session')]
          : isGm() || (isMember() && PLAYER_KINDS.includes(kind)) ? el('a', { class: 'btn primary', href: `#world/new/${kind}` }, `New ${lower(kindLabel(kind))}`)
          : isMember() ? el('a', { class: 'btn', href: `#world/new/${kind}` }, `Suggest a ${lower(kindLabel(kind))}`) : null)),
    listNode ? [listNode, bulk.bar]
      : notice(`No ${KINDS[kind].plural.replace(/^(?!NPC)\w+/, (w) => w.toLowerCase())} yet`, isGm() ? 'Add the first one.' : PLAYER_KINDS.includes(kind) && isMember() ? 'Add the first one.' : 'The GMs haven’t added any yet.'));
}

function sessionList(list) {
  return el('ol', { class: 'session-list' }, list.map((e) => el('li', { class: 'card', 'data-id': e.id },
    el('div', { class: 'entry-head' }, el('span', { class: 'eyebrow' }, [e.fields.number && `Session ${e.fields.number}`, e.fields.played_on, e.fields.world_date].filter(Boolean).join(' · ') || 'Session'),
      e.fields.gm ? el('span', { class: 'muted small' }, `GM ${e.fields.gm}`) : null),
    link(e), e.summary ? el('p', {}, e.summary) : null,
    e.fields.players ? el('p', { class: 'muted small' }, `Players: ${e.fields.players.replace(/\n+/g, ', ')}`) : null,
    e.fields.xp ? el('p', { class: 'muted small' }, `XP: ${e.fields.xp}`) : null)));
}

function viewSearch(raw) {
  const f = parseSearch(raw), gm = isGm();
  const place = f.inside && getEntry(f.inside);
  const within = place ? new Set([place.id, ...descendantsOf(place.id).map((e) => e.id)]) : null;
  const hits = searchEntries(worldEntries(), f, { gm, within });
  const all = worldEntries();
  const go = (patch) => { location.hash = searchHash({ ...f, ...patch }); };
  const sel = (id, label, value, opts, key) => {
    const s2 = el('select', { id, 'aria-label': label }, opts.map(([v, t]) => el('option', { value: v }, t)));
    s2.value = value; s2.addEventListener('change', () => go({ [key]: s2.value })); return s2;
  };
  const q = el('input', { type: 'search', id: 'sq', value: f.q, placeholder: 'Words to find…', 'aria-label': 'Search words' });
  q.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') go({ q: q.value.trim() }); });
  const kinds = KIND_ORDER.filter((k) => all.some((e) => e.kind === k));
  const tags = [...new Set(all.flatMap((e) => e.tags || []))].sort();
  const places = all.filter((e) => PLACE_KINDS.includes(e.kind)).sort(byName);
  const filtered = f.kind || f.tag || f.inside || f.state;
  const tagOnly = /^#\S+$/.test(f.q.trim()) ? f.q.trim().slice(1) : !f.q && f.tag && !f.kind && !f.inside && !f.state ? f.tag : null;
  const title = tagOnly ? `Tagged #${tagOnly}` : f.q ? `Search: “${f.q}”` : 'Search the world';
  const grid = hits.length && (f.q || filtered) ? el('ul', { class: 'entry-grid' }, hits.slice(0, 200).map((e) => { const c = entryCard(e); c.prepend(el('span', { class: 'kind-tag' }, kindLabel(e.kind))); return c; })) : null;
  const bulk = grid ? bulkControls(hits.slice(0, 200), grid) : {};
  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, title), el('p', {}, `${hits.length} result${hits.length === 1 ? '' : 's'}${place ? ` in ${place.name}` : ''}`)), bulk.button),
    tagOnly ? tagNote(tagOnly, rerenderWorld) : null,
    tagOnly ? el('p', { class: 'small' }, el('a', { href: '#world/tags' }, 'All tags')) : null,
    el('div', { class: 'controls search-filters' }, q, el('button', { class: 'btn small', type: 'button', onclick: () => go({ q: q.value.trim() }) }, 'Search'),
      sel('sf-kind', 'Kind', f.kind, [['', 'Any kind'], ...kinds.map((k) => [k, KINDS[k].plural])], 'kind'),
      tags.length ? sel('sf-tag', 'Tag', f.tag, [['', 'Any tag'], ...tags.map((t) => [t, `#${t}`])], 'tag') : null,
      places.length ? sel('sf-in', 'Inside', f.inside, [['', 'Anywhere'], ...places.map((p) => [p.id, p.name])], 'inside') : null,
      gm ? sel('sf-state', 'Show', f.state, [['', 'Everything'], ['hidden', 'Hidden from players'], ['suggested', 'Suggestions']], 'state') : null,
      filtered ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => go({ kind: '', tag: '', inside: '', state: '' }) }, 'Clear filters') : null),
    !f.q && !filtered ? el('p', { class: 'muted' }, 'Type some words, or pick a kind, tag or place to list what’s there.')
      : grid ? [grid, bulk.bar]
        : notice('No matches', 'Try fewer words, or clear a filter.'),
    hits.length > 200 ? el('p', { class: 'muted' }, `Showing the first 200 of ${hits.length}. Add another word or a filter to narrow it down.`) : null,
    talkResults(f.q));
}

function viewEntry(id, tab) {
  const e = world.entries.get(id);
  if (!e) return notice('Entry not found', 'It may have been deleted, or the link is wrong.');
  try { pushRecent(localStorage, session.worldKey, e.id); } catch { /* storage blocked */ }
  const all = worldEntries();
  const crumbs = []; let p = e.parent_id && world.entries.get(e.parent_id), guard = 0;
  while (p && guard++ < 10) { crumbs.unshift(p); p = p.parent_id && world.entries.get(p.parent_id); }
  const children = all.filter((x) => x.parent_id === id).sort(byName);
  const out = (e.links || []).map((l) => ({ ...l, target: world.entries.get(l.id) })).filter((l) => l.target);
  const incoming = all.flatMap((x) => (x.links || []).filter((l) => l.id === id).map((l) => ({ ...l, from: x })));
  const sessions = all.filter((x) => x.kind === 'session' && x.id !== id && (mentions(`${x.body}\n${x.summary}\n${Object.values(x.fields || {}).join('\n')}`).has(id) || (x.links || []).some((l) => l.id === id)))
    .sort((a, b) => (parseFloat(b.fields.number) || 0) - (parseFloat(a.fields.number) || 0));
  const pins = pinsFor(id);
  const fieldRows = kindFields(e.kind).filter((fd) => fieldApplies(fd, e.fields)).filter(([k, , type]) => e.fields?.[k] && !['stats', 'spells', 'level', 'stock', 'market', 'encounters'].includes(k) && type !== 'hidden' && type !== 'image' && !(k === 'sheet' && e.fields.forge)).map(([k, label, type, , o]) => [o?.gmSecret ? `${label} (GMs only)` : label, e.fields[k], type]);

  const history = el('div', { class: 'history', hidden: true });
  const isPlace = PLACE_KINDS.includes(e.kind);
  // Places show people, quests, sub-places and organizations in their own tabs, so the overview lists only the rest.
  const shownElsewhere = isPlace ? ['npc', 'quest', 'faction', 'guild', 'clan', ...PLACE_KINDS] : [];
  const otherChildren = children.filter((c) => !shownElsewhere.includes(c.kind));
  const overview = () => el('div', { class: 'overview' },
    // The picture floats beside the summary and traits, so they share one plain block.
    el('div', { class: 'overview-top' }, figure(e),
      e.summary ? el('p', { class: 'lede' }, richInline(e.summary)) : null,
      fieldRows.length ? el('dl', { class: 'traits' }, fieldRows.flatMap(([l, v, type]) => [el('dt', {}, l), el('dd', {}, type === 'long' ? richText(v) : /^https:\/\/\S+$/.test(v) ? el('a', { href: v, target: '_blank', rel: 'noopener' }, /dndbeyond\.com/.test(v) ? 'Open on D&D Beyond ↗' : 'Open link ↗') : el('span', {}, v))])) : null),
    e.kind === 'npc' || e.fields?.stats || e.fields?.spells ? statSection(e) : null,
    e.kind === 'clan' ? clanTree(e, rerenderWorld) : null,
    e.kind === 'npc' || e.kind === 'character' ? familySection(e, rerenderWorld) : null,
    e.kind === 'character' ? ownerLine(e) : null,
    goalsSection(e, rerenderWorld),
    farewellCard(e, rerenderWorld),
    wishesSection(e, rerenderWorld),
    e.kind === 'character' ? sheetSection(e, rerenderWorld) : null,
    e.kind === 'character' ? knownSection(e, rerenderWorld) : null,
    e.kind === 'character' ? attitudesOfCharacter(e, rerenderWorld) : null,
    bondsSection(e, rerenderWorld),
    e.kind === 'character' ? downtimeSection(e) : null,
    attitudesToward(e, rerenderWorld),
    rewardCard(e, rerenderWorld),
    objectivesSection(e, rerenderWorld),
    tableSection(e),
    e.kind === 'encounter' && e.fields?.enc ? (() => { try { return encounterCard(JSON.parse(e.fields.enc), { title: 'Saved encounter', save: false }); } catch { return null; } })() : null,
    attendanceSection(e, rerenderWorld),
    e.fields?.stock || (e.kind === 'location' && e.fields?.type === 'Shop' && isGm()) ? el('section', { class: 'card shop-card' },
      el('div', { class: 'entry-head' }, el('h3', {}, 'For sale'), isGm() ? el('button', { class: 'btn small', type: 'button', onclick: async () => {
        const town = trailTown(e);
        try { await patchEntry(e, { fields: restockDraft(e, town) }); toast(town ? `Restocked at ${town.name}’s prices` : 'Restocked'); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); }
      } }, e.fields?.stock ? 'Restock' : 'Stock this shop') : null),
      renderStock(e.fields?.stock) || el('p', { class: 'muted' }, 'No stock listed yet.')) : null,
    e.body ? el('section', {}, contentsNav(e.body), richText(e.body, { anchors: true })) : null,
    isGm() && e.secret ? el('aside', { class: 'secret' }, el('div', { class: 'eyebrow' }, 'GM only'), richText(e.secret)) : null,
    mentionsCard(e, rerenderWorld),
    e.kind === 'npc' ? lastSeenLine(e) : null,
    out.length || incoming.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Connections'),
      el('ul', { class: 'links' },
        out.map((l) => el('li', { class: l.secret ? 'secret-link' : '' }, el('span', { class: 'rel' }, l.label), ' ', link(l.target), el('span', { class: 'kind-tag' }, kindLabel(l.target.kind)), l.secret ? el('span', { class: 'tag' }, 'GM only') : null)),
        incoming.map((l) => el('li', { class: l.secret ? 'secret-link' : '' }, link(l.from), ' ', el('span', { class: 'rel' }, `is ${l.label}`), ' this', el('span', { class: 'kind-tag' }, kindLabel(l.from.kind)))))) : null,
    STANDING_KINDS.includes(e.kind) ? standingWidget(e) : null,
    STANDING_KINDS.includes(e.kind) || e.kind === 'quest' ? clocksWidget(e) : null,
    gallerySection(e, rerenderWorld),
    sessions.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Appears in sessions'),
      el('ul', { class: 'entry-list' }, sessions.map((x) => el('li', {}, link(x), el('span', { class: 'muted small' }, [x.fields.played_on, x.fields.gm && `GM ${x.fields.gm}`].filter(Boolean).join(' · ')))))) : null,
    !isPlace && pins.length ? el('section', {}, el('h3', { class: 'section-title' }, 'On the map'),
      el('ul', { class: 'entry-list' }, pins.map(({ map, pin }) => el('li', {}, el('a', { href: `#world/map/${map.id}/${pin.id}` }, map.name), el('span', { class: 'muted small' }, pin.label || ''))))) : null,
    otherChildren.length ? el('section', {}, el('h3', { class: 'section-title' }, `In ${e.name}`), el('ul', { class: 'entry-list' }, otherChildren.map((c) => el('li', {}, link(c), el('span', { class: 'kind-tag' }, kindLabel(c.kind)))))) : null,
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => el('a', { class: 'tagchip', href: `#world/q/${encodeURIComponent(`#${t}`)}` }, `#${t}`))) : null,
    el('p', { class: 'muted small' }, `Created${e.created_by ? ` by ${e.created_by}` : ''} ${when(e.created_at)}${e.updated_by ? ` · last edited by ${e.updated_by} ${when(e.updated_at)}` : ''} · `, el('a', { href: `#world/web/${e.id}` }, 'See connections in the web')),
    history,
    noteBox(e),
    tableWidget(e),
    isGm() ? talkWidget(e) : null);
  const node = el('article', { class: 'w-view entry-view' },
    crumbs.length ? el('nav', { class: 'crumbs', 'aria-label': 'Located in' }, crumbs.flatMap((c, i) => [i ? ' › ' : '', link(c)])) : null,
    el('div', { class: 'panel-head row' },
      el('div', {}, el('div', { class: 'eyebrow' }, kindLabel(e.kind), e.fields?.type ? ` · ${e.fields.type}` : ''), el('h2', {}, e.name), sayLine(e), musicLine(e), stateBadges(e).length ? el('div', { class: 'badges' }, stateBadges(e)) : null),
      !isGm() ? el('div', { class: 'btnrow' }, starButton(e), followButton(e), e.can_edit ? el('a', { class: 'btn', href: `#world/edit/${e.id}` }, 'Edit') : null, suggestEditButton(e), askAboutLink(e), itemCardButton(e), spellCardButton(e)) : null,
      isGm() ? el('div', { class: 'btnrow' }, starButton(e), followButton(e), el('a', { class: 'btn', href: `#world/edit/${e.id}` }, 'Edit'),
        showButton(e),
        revealButton(e, rerenderWorld),
        saveTemplateButton(e),
        copyButton(e),
        mergeButton(e),
        startHereButton(e),
        cardsButton(e),
        itemCardButton(e),
        spellCardButton(e),
        world.info?.discord && e.visibility !== 'gm' && e.status !== 'suggested' ? confirmButton('Post to Discord', async () => {
          try { await api('settings', { method: 'POST', body: { post: e.id } }); toast(`Posted ${e.name} to Discord`); } catch (err) { toast(err.message, 'bad'); }
        }, 'btn ghost') : null,
        shareButton(e, rerenderWorld),
        e.status === 'suggested' ? null : el('button', { class: 'btn ghost', type: 'button', title: e.visibility === 'gm' ? 'Let players see this entry' : 'Hide this entry from players', onclick: async () => {
          try { const n = await setEntryState(e, { visibility: e.visibility === 'gm' ? 'all' : 'gm' }); toast(n.visibility === 'gm' ? `${e.name} is hidden from players` : `Revealed ${e.name} to players`); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); }
        } }, e.visibility === 'gm' ? 'Reveal to players' : 'Hide from players'),
        el('button', { class: 'btn ghost', type: 'button', onclick: async () => {
          history.hidden = !history.hidden; if (history.hidden) return;
          fillHistory(history, id, rerenderWorld);
        } }, 'History')) : null),
    knowsButtons(e, rerenderWorld),
    e.status === 'suggested' ? suggestionBanner(e) : null,
    e.visibility === 'gm' && isGm() ? el('p', { class: 'hidden-note muted small' }, 'Players can’t see this entry, or find it in search or on maps. Reveal it when they discover it.') : null,
    isPlace ? placeSummary(e) : null,
    isPlace ? placeHub(e, tab, overview, rerenderWorld) : overview());
  return node;
}

function suggestionBanner(e) {
  if (!isGm()) return el('div', { class: 'card suggest-banner' }, el('strong', {}, 'Waiting for a GM. '), 'Only you and the GMs can see this suggestion until one of them approves it.');
  return el('div', { class: 'card suggest-banner' },
    el('p', {}, el('strong', {}, `${e.owner || 'A player'} suggested this. `), 'Approve it to add it to the world for everyone, edit it first, or reject it (it goes to the bin).'),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary small', type: 'button', onclick: async () => { try { await setEntryState(e, { status: 'live' }); toast(`Approved ${e.name}`); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); } } }, 'Approve'),
      el('button', { class: 'btn small', type: 'button', onclick: async () => { try { await setEntryState(e, { status: 'live', visibility: 'gm' }); toast(`Approved ${e.name}, hidden from players for now`); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); } } }, 'Approve, keep hidden'),
      confirmButton('Reject', async () => { try { await api('entries', { method: 'DELETE', query: { id: e.id } }); world.entries.delete(e.id); toastUndo('Rejected; it’s in the bin', () => undoDelete(e.id, e.name, false)); location.hash = 'world/suggestions'; } catch (err) { toast(err.message, 'bad'); } }, 'btn ghost small')));
}

function viewSuggestions() {
  if (!isGm()) return notice('GMs only', 'Suggestions from players wait here for a GM.');
  const list = worldEntries().filter((e) => e.status === 'suggested').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, 'Suggestions'), el('p', {}, 'Things your players have added that wait for a GM. Approve them as they are, edit them first, or reject them.')),
    list.length ? el('ul', { class: 'entry-list suggest-list' }, list.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, `${e.owner || 'A player'}, ${when(e.created_at)}`),
      el('span', { class: 'actions' },
        el('button', { class: 'btn small primary', type: 'button', onclick: async () => { try { await setEntryState(e, { status: 'live' }); toast(`Approved ${e.name}`); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); } } }, 'Approve'),
        confirmButton('Reject', async () => { try { await api('entries', { method: 'DELETE', query: { id: e.id } }); world.entries.delete(e.id); toastUndo(`Rejected ${e.name}`, () => undoDelete(e.id, e.name, false)); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); } }, 'btn small ghost')))))
      : (world.info?.edits_open ? null : notice('Nothing waiting', 'When a player suggests an NPC, a place, a rumor or an edit to an entry, it shows up here.')),
    editsSection(rerenderWorld));
}

function viewMine() {
  if (!signedIn()) return notice('Sign in first', 'Your characters, journals and suggestions show here once you’re signed in.', el('button', { class: 'btn primary', type: 'button', onclick: () => openSignIn() }, 'Sign in'));
  const list = worldEntries().filter((e) => e.owner_id === session.gm.id).sort(byName);
  const group = (title, items) => items.length ? el('section', {}, el('h3', { class: 'section-title' }, title), el('ul', { class: 'entry-grid' }, items.map(entryCard))) : null;
  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, 'My things'), el('p', {}, 'Your characters, journal entries, the suggestions you’ve made and your private notes in this world.')),
    list.length ? [group('Characters', list.filter((e) => e.kind === 'character')), group('Journal', list.filter((e) => e.kind === 'journal')),
      group('Suggestions', list.filter((e) => !PLAYER_KINDS.includes(e.kind)))]
      : notice('Nothing yet', 'Add your character, keep a journal, or suggest something the GMs might add to the world.',
        isMember() ? el('div', { class: 'btnrow' }, el('a', { class: 'btn primary', href: '#world/new/character' }, '+ My character'), el('a', { class: 'btn', href: '#world/new/journal' }, '+ Journal entry')) : null),
    myEditsSection(),
    isMember() ? myNotesSection() : null);
}

// Who plays a character, and a way to claim an unowned one (or for a GM, to let it go).
function ownerLine(e) {
  const claim = async (body, msg) => { try { const r = await api('entries', { method: 'PATCH', body: { id: e.id, ...body } }); world.entries.set(r.entry.id, r.entry); toast(msg); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); } };
  if (e.owner_id) {
    return el('p', { class: 'muted small owner-line' }, `Played by ${withPronouns(e.owner_id, e.owner)}${e.owner_id === session.gm?.id ? ', that’s you' : ''}. `,
      isGm() ? confirmButton('Unassign', () => claim({ owner: null }, 'Nobody plays this character now'), 'linkish') : null);
  }
  return isMember() ? el('p', { class: 'muted small owner-line' }, 'No player has claimed this character. ',
    el('button', { class: 'linkish', type: 'button', onclick: () => claim({ claim: true }, `${e.name} is yours now`) }, 'It’s mine')) : null;
}

// The nearest settlement a place sits in (for market prices).
function trailTown(e) {
  let p = e.parent_id && world.entries.get(e.parent_id), guard = 0;
  while (p && guard++ < 12) { if (p.kind === 'settlement') return p; p = p.parent_id && world.entries.get(p.parent_id); }
  return null;
}

// The NPC's stat block and spells, with a GM control to roll new ones.
function statSection(e) {
  const has = e.fields?.stats || e.fields?.spells;
  if (!has && !isGm()) return null;
  const clsSel = el('select', { 'aria-label': 'Class' }, NPC_CLASS_OPTIONS.map((c) => el('option', { value: c }, c === 'auto' ? 'From their role' : c === 'commoner' ? 'Commoner (no class)' : c)));
  const lvlSel = el('select', { 'aria-label': 'Level' }, el('option', { value: '' }, 'Any level'), Array.from({ length: 20 }, (_, i) => el('option', { value: i + 1 }, `Level ${i + 1}`)));
  const roll = async () => {
    const st = npcStats({ role: e.fields?.role, ancestry: e.fields?.ancestry, cls: clsSel.value, level: +lvlSel.value || undefined });
    try { await patchEntry(e, { fields: { level: st.level, stats: st.stats, spells: st.spells } }); toast(`New stats for ${e.name}: ${st.level}`); rerenderWorld(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  return el('section', { class: 'card stat-card' },
    el('div', { class: 'entry-head' }, el('div', {}, el('h3', {}, 'Stat block'), e.fields?.level ? el('div', { class: 'eyebrow' }, e.fields.level) : null)),
    has ? null : el('p', { class: 'muted' }, 'No stats yet. Roll a stat block: a class and level are picked from their role, or choose your own.'),
    renderStats(e.fields?.stats),
    e.fields?.spells ? el('h4', { class: 'sb-spell-title' }, 'Spellcasting') : null,
    renderSpells(e.fields?.spells, e.id),
    isGm() ? el('div', { class: 'controls stat-roll' }, clsSel, lvlSel, el('button', { class: 'btn small', type: 'button', onclick: roll }, has ? 'Reroll stats' : 'Roll stats')) : null);
}

// A line of counts under a place's title.
function placeSummary(e) {
  const c = placeCounts(e);
  const bits = [[c.people, 'people', 'people'], [c.openQuests, 'open jobs', 'quests'], [c.places, 'places', 'places'], [c.powers, 'factions & guilds', 'powers']].filter(([n]) => n);
  return bits.length ? el('p', { class: 'place-summary muted' }, bits.flatMap(([n, t, tab], i) => [i ? ' · ' : '', el('a', { href: `#world/e/${e.id}/${tab}` }, `${n} ${t}`)])) : null;
}

// ---- editing -----------------------------------------------------------------------------------

function viewEdit(id, kindForNew) {
  if (!isMember()) return notice(signedIn() ? 'Members only' : 'Sign in to add things', signedIn() ? 'You’re visiting this world. Ask its owner for an invite to add characters, journals and suggestions.' : 'Sign in with your personal code, or open the invite link your GM sent you.',
    signedIn() ? null : el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => openSignIn() }, 'Sign in'), el('a', { class: 'btn', href: '#join' }, 'I have an invite')));
  const existing = id ? world.entries.get(id) : null;
  if (id && !existing) return notice('Entry not found', 'It may have been deleted.');
  if (existing && !existing.can_edit) return notice('Not yours to edit', 'Players can edit their own characters, journals and suggestions. Ask a GM to change this one.');
  const gm = isGm();
  const e = existing ? structuredClone(existing) : { kind: KINDS[kindForNew] ? kindForNew : 'npc', name: '', summary: '', body: '', fields: {}, secret: '', tags: [], links: [], parent_id: null, ...(draft || {}) };
  if (!existing && !draft && e.kind === 'session') {
    const sessions = worldEntries().filter((x) => x.kind === 'session');
    const next = Math.max(0, ...sessions.map((x) => parseInt(x.fields.number, 10) || 0)) + 1;
    e.name = `Session ${next}`;
    e.fields = { number: String(next), played_on: new Date().toISOString().slice(0, 10), gm: session.gm?.name || '' };
    e.body = 'What happened:\n\nWho the party met (use [[Names]] so the entries link back to this session):\n';
  }
  // Handouts start hidden: write them ahead, hand them out at the table.
  if (!existing && !draft && e.kind === 'handout' && !e.visibility) e.visibility = 'gm';
  if (!existing) draft = null;
  e.fields = e.fields || {}; e.links = e.links || [];

  const form = el('form', { class: 'card edit-form', autocomplete: 'off' });
  const fieldsBox = el('div', { class: 'edit-fields' });
  const linksBox = el('div', { class: 'links-edit' });
  const status = el('p', { class: 'form-status', role: 'status' });

  const input = (name, label, value, attrs = {}) => el('div', { class: 'field' }, el('label', { for: `f-${name}` }, label), el('input', { type: 'text', id: `f-${name}`, name, value: value || '', ...attrs }));
  const area = (name, label, value, rows = 4, hint) => el('div', { class: 'field' }, el('label', { for: `f-${name}` }, label), el('textarea', { id: `f-${name}`, name, rows }, value || ''), hint ? el('small', { class: 'muted' }, hint) : null);

  // Players can make characters and journals; anything else becomes a suggestion for the GMs.
  const kindChoices = gm || !existing || existing.status === 'suggested' ? KIND_ORDER : PLAYER_KINDS;
  const kindSel = el('select', { id: 'f-kind', name: 'kind' }, KIND_ORDER.filter((k) => kindChoices.includes(k)).map((k) => el('option', { value: k }, gm || PLAYER_KINDS.includes(k) ? KINDS[k].label : `${KINDS[k].label} (suggestion)`)));
  kindSel.value = kindChoices.includes(e.kind) ? e.kind : kindChoices[0];
  const visSel = el('select', { id: 'f-visibility', name: 'visibility' }, el('option', { value: 'all' }, 'Everyone in the world'), el('option', { value: 'gm' }, 'GMs only (hidden from players)'));
  visSel.value = e.visibility === 'gm' ? 'gm' : 'all';
  const suggestNote = el('p', { class: 'muted small suggest-note' });
  const updateNote = () => { suggestNote.textContent = !gm && !PLAYER_KINDS.includes(kindSel.value) ? 'This will be a suggestion: the GMs see it and can approve it, edit it or turn it down. Until then only you and they can see it.' : ''; };
  kindSel.addEventListener('change', updateNote); updateNote();
  function renderFields() {
    collectFields();
    setKids(fieldsBox, ...kindFields(kindSel.value).map((fd) => {
      const [k, label, type, opts] = fd, v = e.fields[k] || '';
      if (type === 'hidden' || !fieldApplies(fd, e.fields) || ((fd[4]?.gmOnly || fd[4]?.gmSecret) && !gm)) return null;
      if (type === 'image') return pictureField(v);
      if (type === 'select') {
        const s = el('select', { id: `ff-${k}`, 'data-field': k }, el('option', { value: '' }, '—'), opts.map((o) => el('option', { value: o }, o)));
        if (v && !opts.includes(v)) s.append(el('option', { value: v }, v));
        s.value = v;
        return el('div', { class: 'field' }, el('label', { for: `ff-${k}` }, label), s);
      }
      const box = type === 'long' ? el('textarea', { id: `ff-${k}`, 'data-field': k, rows: 3 }, v) : el('input', { type: 'text', id: `ff-${k}`, 'data-field': k, value: v });
      const roll = rollButton(() => kindSel.value, k, box, label, () => ({ type: fieldsBox.querySelector('[data-field="type"]')?.value }));
      const head = roll ? el('div', { class: 'label-row' }, el('label', { for: `ff-${k}` }, label), roll) : el('label', { for: `ff-${k}` }, label);
      return el('div', { class: `field${type === 'long' ? ' wide' : ''}` }, head, box);
    }), gm ? el('p', { class: 'field wide own-fields' }, customFieldsButton(kindSel.value, renderFields)) : null);
  }
  function collectFields() { for (const f of fieldsBox.querySelectorAll('[data-field]')) e.fields[f.dataset.field] = f.value; }
  kindSel.addEventListener('change', renderFields);
  // A rules option's category decides which fields it has (a species's speed, a class's hit die).
  fieldsBox.addEventListener('change', (ev) => { if (ev.target.dataset?.field === 'category') renderFields(); });

  function linkRow(l = { label: 'related to', id: '', secret: false }) {
    const target = l.id ? world.entries.get(l.id) : null;
    const row = el('div', { class: 'link-row' },
      el('input', { type: 'text', class: 'l-label', list: 'w-labels', value: l.label, 'aria-label': 'Relationship' }),
      el('input', { type: 'text', class: 'l-target', list: 'w-names', value: target?.name || '', placeholder: 'Entry name', 'aria-label': 'Connected entry' }),
      gm ? el('label', { class: 'check' }, el('input', { type: 'checkbox', class: 'l-secret', checked: l.secret || null }), ' GM only') : null,
      el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Remove connection', onclick: () => row.remove() }, '✕'));
    return row;
  }
  linksBox.append(...e.links.map(linkRow));

  const parent = e.parent_id && world.entries.get(e.parent_id);
  form.append(
    el('div', { class: 'edit-grid' },
      el('div', { class: 'field' }, el('label', { for: 'f-kind' }, 'Type'), kindSel),
      gm ? el('div', { class: 'field' }, el('label', { for: 'f-visibility' }, 'Who can see it'), visSel) : null,
      input('name', 'Name', e.name, { required: true, maxlength: 200 }),
      input('say', 'Say it', e.fields.say || '', { maxlength: 80, placeholder: 'How to pronounce it, e.g. BRAM-well' }),
      input('music', 'Mood music', e.fields.music || '', { type: 'url', maxlength: 500, placeholder: 'https:// link (YouTube, Spotify, Tabletop Audio…)' }),
      input('parent', 'Located in / part of', parent?.name || '', { list: 'w-names', placeholder: 'e.g. a region or city' })),
    suggestNote,
    area('summary', 'Summary', e.summary, 2, 'One or two sentences. This shows in lists and search.'),
    fieldsBox,
    area('body', 'Description & notes', e.body, 8, 'Link to other entries with [[double brackets]], e.g. [[The Silver Hand]]. **Bold**, *italic*, “- ” for a list, “## ” for a small heading, “> ” for text to read aloud.'),
    gm ? area('secret', 'GM-only secrets', e.secret, 4, 'Players never see this. Only this world’s GMs can read it.') : null,
    input('tags', 'Tags', (e.tags || []).join(', '), { placeholder: 'comma separated, e.g. north, war, session-12' }),
    el('div', { class: 'field wide' }, el('label', {}, 'Connections'), linksBox,
      el('button', { class: 'btn small', type: 'button', onclick: () => linksBox.append(linkRow()) }, '+ Add connection')),
    nameList(), el('datalist', { id: 'w-labels' }, LINK_LABELS.map((l) => el('option', { value: l }))),
    status,
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'submit' }, existing ? 'Save changes' : !gm && !PLAYER_KINDS.includes(e.kind) ? 'Send suggestion' : 'Create entry'),
      el('a', { class: 'btn ghost', href: existing ? `#world/e/${existing.id}` : '#world' }, 'Cancel'),
      existing ? confirmButton('Move to bin', async () => {
        try { await api('entries', { method: 'DELETE', query: { id: existing.id } }); world.entries.delete(existing.id); toastUndo(`${existing.name} moved to the bin`, () => undoDelete(existing.id, existing.name)); location.hash = `world/k/${existing.kind}`; }
        catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
      }, 'btn ghost') : null));
  renderFields();
  // An NPC's secret can be rolled too (kept in step with the type).
  const secretBox = form.querySelector('#f-secret');
  if (secretBox) {
    const label = secretBox.previousElementSibling;
    const row = el('div', { class: 'label-row' }); label.replaceWith(row); row.append(label);
    const sync = () => { row.querySelector('.roll-btn')?.remove(); const b = rollButton(() => kindSel.value, 'secret', secretBox, 'secret'); if (b) row.append(b); };
    kindSel.addEventListener('change', sync); sync();
  }

  // Same or similar names already in the world, under the name field (new entries, or a renamed one).
  if (form.querySelector('#f-name')) nameCheck(form.querySelector('#f-name'), existing?.id);
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
      links.push({ id: t.id, label: row.querySelector('.l-label').value.trim() || 'related to', secret: Boolean(row.querySelector('.l-secret')?.checked) });
    }
    if (unknown.length) { status.textContent = `These connections don’t match any entry: ${unknown.join(', ')}.`; status.className = 'form-status error'; return; }
    const entry = {
      kind: kindSel.value, name: String(f.get('name')).trim(), summary: String(f.get('summary') || ''), body: String(f.get('body') || ''), secret: gm ? String(f.get('secret') || '') : existing?.secret || '', visibility: gm ? visSel.value : existing?.visibility || 'all',
      fields: Object.fromEntries([...Object.entries(e.fields).filter(([k, v]) => v && k !== 'say' && k !== 'music' && kindFields(kindSel.value).some(([fk]) => fk === k)), ['say', cleanSay(f.get('say'))], ['music', cleanMusic(f.get('music'))]].filter(([, v]) => v)),
      tags: String(f.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean), links, parent_id: parentEntry?.id || null, version: existing?.version,
    };
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = existing ? await api('entries', { method: 'PUT', query: { id: existing.id }, body: { entry } }) : await api('entries', { method: 'POST', body: { entry } });
      world.entries.set(r.entry.id, r.entry);
      toast(existing ? 'Saved' : r.entry.status === 'suggested' ? 'Suggested: a GM will take a look' : 'Added to the world');
      location.hash = `world/e/${r.entry.id}`;
    } catch (err) {
      status.textContent = err.message; status.className = 'form-status error';
      if (err.status === 409 && err.body?.entry) world.entries.set(err.body.entry.id, err.body.entry);
    }
  });

  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, existing ? `Edit ${existing.name}` : !gm && !PLAYER_KINDS.includes(e.kind) ? 'Suggest an entry' : `New ${lower(kindLabel(e.kind))}`),
    el('p', {}, existing ? `Last edited by ${existing.updated_by || 'someone'} ${when(existing.updated_at)}. If another GM saves first, you’ll be told before anything is overwritten.` : 'Everything except the name is optional. You can fill it in later.')), existing ? null : templatePicker(e.kind), form);
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

// Redraw the current world view in place (after a quick save), keeping the scroll position.
export function rerenderWorld() { showWorld(lastParts, { keepScroll: true }); }

export async function showWorld(parts, { keepScroll = false } = {}) {
  lastParts = parts;
  if (session.configured === false || session.configured === 'offline') {
    setKids(side);
    setKids(main, notice('The shared world isn’t connected yet',
      session.configured === 'offline'
        ? 'This copy of the app is running without its server, so the shared world is unavailable. Everything else works.'
        : 'The admin needs to connect the database: add Neon Postgres to the Vercel project and set ADMIN_CODE. See the README for the two steps.'));
    return;
  }
  if (!world.loaded) { setKids(main, el('p', { class: 'muted' }, 'Loading the world…')); await loadWorld(); if (world.loaded) setTimeout(checkShown, 300); }
  if (world.error) { setKids(main, notice('Couldn’t load the world', world.error.message, el('button', { class: 'btn', type: 'button', onclick: () => { loadWorld(true).then(() => showWorld(parts)); } }, 'Try again'))); return; }
  renderSide();
  const [view, arg] = parts;
  let node;
  if (view === 'k') node = arg === 'rumor' ? viewRumors(rerenderWorld) : viewKind(arg);
  else if (view === 'e') node = viewEntry(arg, parts[2]);
  else if (view === 'new') node = viewEdit(null, arg);
  else if (view === 'edit') node = viewEdit(arg);
  else if (view === 'q') node = viewSearch(arg || '');
  else if (view === 'tags') node = viewTags();
  else if (view === 'say') node = await viewSay();
  else if (view === 'dupes') node = await viewDupes();
  else if (view === 'hall') node = await viewHall();
  else if (view === 'ask') node = await viewAsk(arg, parts[2]);
  else if (view === 'quotes') node = await viewQuotes();
  else if (view === 'pictures') node = await viewPictures();
  else if (view === 'numbers') node = await viewNumbers();
  else if (view === 'itemcards') node = await viewItemCards(arg || '');
  else if (view === 'spellcards') node = await viewSpellCards(arg || '');
  else if (view === 'bin') node = await viewBin();
  else if (view === 'atlas') node = viewAtlas();
  else if (view === 'maps') node = viewMaps();
  else if (view === 'map') node = await viewMap(arg, parts[2]);
  else if (view === 'web') node = await viewWeb(arg);
  else if (view === 'standings') node = viewStandings();
  else if (view === 'talk') node = await viewTalk();
  else if (view === 'table') node = await viewTable();
  else if (view === 'prep') node = await viewPrep(rerenderWorld);
  else if (view === 'sheet') node = await viewSessionSheet();
  else if (view === 'todo') node = await viewTodo();
  else if (view === 'zero') node = await viewZero();
  else if (view === 'print') node = await viewPrintCharacter(arg);
  else if (view === 'cards') node = await viewCards(arg);
  else if (view === 'powers') node = await viewPowers(rerenderWorld);
  else if (view === 'library') node = await viewLibrary(arg, rerenderWorld);
  else if (view === 'import') node = await viewImport(rerenderWorld);
  else if (view === 'suggestions') node = viewSuggestions();
  else if (view === 'party') { markPartySeen(); node = await viewParty(rerenderWorld); }
  else if (view === 'schedule') node = await viewSchedule(rerenderWorld);
  else if (view === 'downtime') node = viewDowntime(rerenderWorld, arg);
  else if (view === 'export') node = await viewExport();
  else if (view === 'clocks') node = viewClocks();
  else if (view === 'family') node = viewFamily(arg);
  else if (view === 'calendar') node = viewCalendar(arg, parts[2], rerenderWorld);
  else if (view === 'mine') node = viewMine();
  else node = viewHome();
  const y = window.scrollY;
  setKids(main, node);
  drawNoticeBanner();
  for (const a of side.querySelectorAll('.w-kinds a')) a.classList.toggle('active', Boolean((view === 'k' && a.dataset.kind === arg) || (view === 'e' && world.entries.get(arg)?.kind === a.dataset.kind) || (a.dataset.view && (a.dataset.view === view || (a.dataset.view === 'maps' && view === 'map')))));
  // The group holding the open view unfolds (without changing what's remembered).
  for (const g of side.querySelectorAll('.w-group')) if (g.querySelector('a.active')) g.setAttribute('open', '');
  window.scrollTo({ top: keepScroll ? y : 0 });
}

// Drafts sent from the tools ("Add to world") open the new-entry form, prefilled.
// Make a copy (GMs): the entry's text, fields, tags, connections and place, as a new draft named "… (copy)". What
// belongs to one character or one session (play state, goals, attitudes, attendance…) stays behind.
const NOT_COPIED = ['play', 'known', 'attitudes', 'attendance', 'goals', 'spread', 'objectives'];
function copyButton(e) {
  if (e.status === 'suggested') return null;
  const draft = (name) => acceptDraft({
    kind: e.kind, name: name || `${e.name} (copy)`, summary: e.summary || '', body: e.body || '', secret: e.secret || '', tags: [...(e.tags || [])],
    links: (e.links || []).map((l) => ({ ...l })), parent_id: e.parent_id || null, visibility: e.visibility || 'all',
    fields: Object.fromEntries(Object.entries(e.fields || {}).filter(([k]) => !NOT_COPIED.includes(k))),
  });
  // A place can bring what's inside it along.
  return el('button', { class: 'btn small', type: 'button', title: 'Start a new entry from this one', onclick: () => (PLACE_KINDS.includes(e.kind) ? copyPlaceDialog(e, draft) : draft()) }, 'Make a copy');
}

// On an NPC's page: when the party last met them, from the session logs.
function lastSeenLine(e) {
  const seen = appearances(worldEntries(), mentions).get(e.id);
  if (!seen) return null;
  return el('p', { class: 'muted small last-seen' }, '👁 Last seen in ', link(seen.last), seen.ago ? ` (${seen.ago} session${seen.ago === 1 ? '' : 's'} ago)` : ' (the latest session)',
    seen.count > 1 ? ` · in ${seen.count} sessions` : '');
}

// Undo a move to the bin: bring the entry back, then open it (or just redraw where we are).
async function undoDelete(id, name, open = true) {
  try {
    await api('entries', { method: 'DELETE', query: { id, restore: 1 } });
    const r = await api('entries', { query: { id } });
    world.entries.set(r.entry.id, r.entry);
    toast(`${name} is back`);
    if (open) location.hash = `world/e/${id}`; else rerenderWorld();
  } catch (err) { toast(err.message, 'bad'); }
}

export function acceptDraft(d = {}) {
  if (!isMember()) { toast(signedIn() ? 'You need an invite to this world to add things' : 'Sign in to add things to the shared world'); if (!signedIn()) openSignIn(); return; }
  if (!isGm() && !PLAYER_KINDS.includes(d.kind)) toast('Players’ additions are sent to the GMs as suggestions');
  draft = { ...d, fields: { ...(d.fields || {}) } };
  // Already on that form (say, picking a template): redraw it with the draft.
  if (location.hash === `#world/new/${d.kind}`) rerenderWorld(); else location.hash = `world/new/${d.kind}`;
}

export function mountWorld(root) {
  side = el('aside', { class: 'w-side' });
  main = el('div', { class: 'w-main' });
  root.append(el('div', { class: 'w-layout' }, side, main));
  document.body.append(quickNoteButton());
  initLinkSuggest();
  window.addEventListener('world:rerender', () => rerenderWorld());
  // Ask the GM: the sidebar count follows what's waiting; something new arriving gets a toast.
  window.addEventListener('world:ask', (ev) => {
    renderSide();
    if (ev.detail?.more && !location.hash.startsWith('#world/ask')) toast(isGm() ? '💬 A player asked the GMs something' : '💬 The GMs answered you');
  });
  // Live updates: every 20 seconds while a world page is open and visible, pick up what others changed.
  const tick = async () => {
    if (document.hidden || !location.hash.startsWith('#world') || !world.loaded || syncing) return;
    syncing = true;
    try {
      const all = await syncWorld(session.gm?.name);
      if (all.some((c) => c.shown)) checkShown();
      if (all.some((c) => c.notice)) { drawNoticeBanner(); if (location.hash === '#world' || location.hash === '#world/') rerenderWorld(); }
      const changes = all.filter((c) => !c.shown && !c.notice);
      // Something you follow changed: say so on its own, by name.
      const followed = changes.filter((c) => c.change !== 'removed' && c.by && (world.info?.following || []).includes(c.entry.id));
      if (followed.length) { toast(`🔔 ${followed.map((c) => c.entry.name).join(', ')} (you follow ${followed.length === 1 ? 'it' : 'them'}) changed by ${[...new Set(followed.map((c) => c.by))].join(', ')}`); renderSide(); }
      if (changes.length) {
        const people = [...new Set(changes.map((c) => c.by).filter(Boolean))];
        const one = changes.length === 1 && changes[0];
        if (!followed.length) toast(one ? (one.calendar ? 'The calendar changed' : one.change === 'removed' ? `${one.entry.name} was removed or hidden` : `${one.by || 'Someone'} ${one.change === 'new' ? 'added' : 'edited'} ${one.entry.name}`)
          : `${changes.length} changes${people.length ? ` from ${people.join(', ')}` : ''}`);
        // Don't redraw under someone who is typing; their form keeps its input and the new data shows next time.
        const typing = /^#world\/(new|edit)\//.test(location.hash) || main.contains(document.activeElement) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (!typing) rerenderWorld();
      }
    } catch { /* offline for a moment: try again next time */ }
    syncing = false;
  };
  let syncing = false;
  setInterval(tick, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  // A new sign-in or a different world means different entries are visible: load again.
  let seen = '';
  onSession((s) => {
    const key = `${s.gm?.id || ''}|${s.worldKey || ''}|${s.worlds.map((w) => `${w.id}:${w.role}`).join(',')}`;
    if (key === seen) return; seen = key;
    world.loaded = false;
    if (location.hash.startsWith('#world')) showWorld(location.hash.slice(1).split('/').slice(1));
  });
}
