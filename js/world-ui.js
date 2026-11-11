// The shared world: browse, search, read and (for GMs) write entries.
// Routes: #world · #world/k/<kind> · #world/e/<id> · #world/new/<kind> · #world/edit/<id> · #world/q/<search> · #world/bin
//         #world/party · #world/zero (session zero) · #world/schedule · #world/downtime[/<character>] · #world/suggestions (GMs) · #world/mine (your characters, journals and suggestions)

import { el, toast, toastUndo, confirmButton, setKids, download, copyText } from './dom.js';
import { entriesCSV } from './csv.js';
import { api, session, isGm, isMember, isPlayer, signedIn, onSession, setPreview, previewing } from './api.js';
import { turnUp, turnUpList, turnUpNote } from './world-turnup.js';
import { KINDS, KIND_ORDER, LINK_LABELS, STANDING_KINDS, PLACE_KINDS, PLAYER_KINDS, fieldApplies } from './world-schema.js';
import { openSignIn } from './signin.js';
import { stripMarks } from './rich.js';
import { newLines, playJson } from './play-log.js';
import { sinceLastCard, comingUpCard } from './world-sincelast.js';
import { routineNow, hereNow, regularsLine, routinePreview, mindingLine, townHoursBox, rollTownButton, laterLine, aroundPartyCard, busiestLine, crossPathsLine, festivalLine, ownerDayLine, wantedCard, openNowLine, marketDayLine, weekInTownBox, patronLine, membersNowCard, townPreviewBox } from './world-routine.js';
import { offerBounty } from './world-bounty.js';
import { untilChange, hoursSign, hoursPreview } from './shop-hours.js';
import { leftText } from './clock.js';
import { giftsSection, givenSection } from './world-gifts.js';
import { world, worldEntries, getEntry, loadWorld, byName, kindLabel, kindFields, richInline, link, when, findByName, mentions, richText, contentsNav, notice, nameList } from './world-store.js';
import { viewMaps, viewMap, pinsFor } from './world-maps.js';
import { viewStandings, standingWidget } from './world-standings.js';
import { viewTalk, talkWidget, tableWidget, viewTable, tableNewCount } from './world-talk.js';
import { placeHub, viewAtlas, placeCounts } from './world-place.js';
import { viewParty } from './world-party.js';
import { viewSchedule, nextSessionLine, rsvpCard } from './world-schedule.js';
import { viewDowntime, downtimeSection } from './world-downtime.js';
import { recapButton } from './world-recap.js';
import { showButton, checkShown } from './world-show.js';
import { attitudesOfCharacter, attitudesToward } from './world-attitudes.js';
import { noteBox, myNotesSection } from './world-notes.js';
import { objectivesSection, omensCard, boundLine } from './world-objectives.js';
import { riddleCard } from './world-riddle.js';
import { whatsNewCard } from './world-whatsnew.js';
import { attendanceSection } from './world-attendance.js';
import { revealButton } from './world-reveal.js';
import { quickNoteButton } from './world-quicknote.js';
import { initLinkSuggest } from './link-suggest.js';
import { bulkControls } from './world-bulk.js';
import { customFieldsButton } from './world-fields.js';
import { goalsSection } from './world-goals.js';
import { wishesSection, wishMark } from './world-wishes.js';
import { farewellCard } from './world-hall.js';
import { noteRead, readsLine } from './world-reads.js';
import { readingCard, noteReading } from './world-reading.js';
import { revealDateLine } from './world-revealdate.js';
import { neighbors } from './neighbors.js';
import { questGroups } from './quest-groups.js';
import { partyPageButton, partyPageNote, partyPageForm, canPartyEdit } from './world-partypage.js';
import { storySection } from './world-story.js';
import { askNav, askAboutLink } from './world-ask.js';
import { quoteCard } from './world-quotes.js';
import { previouslyCard } from './world-previously.js';
import { itemCardButton, spellCardButton } from './world-playcards.js';
import { mentionsCard } from './world-mentions.js';
import { starButton, favoritesNav, followButton, followingNav } from './world-favorites.js';
import { rewardCard } from './world-reward.js';
import { appearances, sceneOf, quoteOf, sessionsWith, sessionOrder } from './appearances.js';
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
import { cleanAka, akaOf } from './aka.js';
import { ageOf, ageText } from './birthdays.js';
import { deadlineOf, deadlineText } from './deadline.js';
import { menuCard } from './world-menu.js';
import { buyBox, tradeLedger, asksBox } from './world-buy.js';
import { chainSection } from './world-questchain.js';
import { hireLine } from './world-hire.js';
import { nextMoveButton } from './world-nextmove.js';
import { shoppingCard } from './world-shopping.js';
import { dayWeather } from './forecast.js';
import './world-living.js';
import { cleanMusic } from './music.js';
import { musicLine } from './world-music.js';
import { tableSection } from './world-tables.js';
import { parseSearch, searchHash, searchEntries } from './search.js';
import { saveTemplateButton, templatePicker } from './world-templates.js';
import { fillHistory } from './world-history.js';
import { changesCard } from './world-changes.js';
import { viewCards, cardsButton } from './world-cards.js';
import { encounterCard, placeTerrains } from './encounter-ui.js';
import { bondsSection } from './world-bonds.js';
import { viewClocks, clocksWidget } from './world-clocks.js';
import { viewRumors } from './world-rumors.js';
import { familySection, clanTree, viewFamily } from './world-family.js';
import { knowsButtons, knownSection } from './world-known.js';
import { startCard, markPartySeen } from './onboarding.js';
import { viewCalendar, worldCalendar, todayText, onThisDayCard } from './world-calendar.js';
import { parseDate, toDays, yearLength, parseHolidayLines, ordinal } from './calendar.js';
import { nextShut } from './week-in-town.js';
import { customersAt, purchases, spots, goodsAt, orderedAt } from './purchases.js';
import { toolsInPack, craftableWith } from './crafting.js';
import { partyOrder, nightShifts } from './world-orders.js';
import { guildMembersCard, membershipsOf } from './world-guild.js';
import { talkLine } from './world-languages.js';
import { hhmm as hhmmW } from './party-order.js';
import { coinText } from './economy.js';
import { parseLength, lengthText } from './session-timer.js';
import { sheetSection } from './sheet-ui.js';
import { pictureField, figure, thumb } from './image-ui.js';
import { renderStats, renderSpells } from './statblock-ui.js';
import { renderStock } from './shop-ui.js';
import { restockDraft } from './world-place.js';
import { npcStats, NPC_CLASS_OPTIONS } from './npc-stats.js';
import { patchEntry, setEntryState, stateBadges, syncWorld, descendantsOf, tagChip } from './world-store.js';
import { dayFor } from './world-hours.js';
import { namedIn, journalsAbout, newIn } from './session-named.js';
import { unlinkedIn, linkNames } from './unlinked.js';
import { sessionText } from './session-text.js';
import { sessionGaps, realGapText } from './session-gaps.js';

// Pages used now and then load when first opened, so world pages start faster.
const lazyView = (load, name) => async (...args) => (await load())[name](...args);
const viewWeb = lazyView(() => import('./world-web.js'), 'viewWeb');
const viewSay = lazyView(() => import('./world-say.js'), 'viewSay');
const viewDupes = lazyView(() => import('./world-dupes.js'), 'viewDupes');
const viewHall = lazyView(() => import('./world-hall.js'), 'viewHall');
const viewPoster = lazyView(() => import('./world-poster.js'), 'viewPoster');
const viewAsk = lazyView(() => import('./world-ask.js'), 'viewAsk');
const viewQuotes = lazyView(() => import('./world-quotes.js'), 'viewQuotes');
const viewPictures = lazyView(() => import('./world-pictures.js'), 'viewPictures');
const viewNumbers = lazyView(() => import('./world-numbers.js'), 'viewNumbers');
const viewItemCards = lazyView(() => import('./world-playcards.js'), 'viewItemCards');
const viewSpellCards = lazyView(() => import('./world-playcards.js'), 'viewSpellCards');
const viewWhosWho = lazyView(() => import('./world-whoswho.js'), 'viewWhosWho');
const viewScreen = lazyView(() => import('./world-screen.js'), 'viewScreen');
const viewKit = lazyView(() => import('./world-kit.js'), 'viewKit');
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
        // Go to my character: the player's own (active) character, straight from the side menu.
        (() => { const mine = myCharacter(); return mine ? el('a', { href: `#world/e/${mine.id}`, 'data-view': 'mine' }, el('span', {}, mine.name), el('span', { class: 'count', 'aria-hidden': 'true' }, '★')) : null; })(),
        isMember() && (world.info?.primer || isGm()) ? el('a', { href: '#world/zero', 'data-view': 'zero' }, el('span', {}, 'Session zero'), el('span', { class: 'count' }, world.info?.zero_read === false ? 'new' : '')) : null,
        isMember() ? el('a', { href: '#world/schedule', 'data-view': 'schedule' }, el('span', {}, 'Next session'), el('span', { class: 'count' }, world.info?.next_session && Date.parse(world.info.next_session) > Date.now() - 86400000 ? new Date(world.info.next_session).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')) : null,
        isMember() ? el('a', { href: '#world/downtime', 'data-view': 'downtime' }, el('span', {}, 'Downtime'), el('span', { class: 'count' }, isGm() ? (worldEntries().filter((d) => d.kind === 'downtime' && !d.fields?.resolved).length || '') : '')) : null,
        el('a', { href: '#world/calendar', 'data-view': 'calendar', title: todayText() }, el('span', {}, 'Calendar'), el('span', { class: 'count cal-count' }, worldCalendar() ? todayText().split(', ').pop().replace(/ \d+.*$/, '') : '')),
        el('a', { href: '#world/table', 'data-view': 'table' }, el('span', {}, 'Table talk'), tableNewCount() ? el('span', { class: 'count new' }, `${tableNewCount()} new`) : el('span', { class: 'count' }, '💬')),
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
        el('a', { href: '#world/whoswho', 'data-view': 'whoswho' }, el('span', {}, 'Who’s who'), el('span', { class: 'count' }, '☺')),
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

// Today's weather where the party is, for everyone who can see that place: the same roll session prep shows.
function tableWeather() {
  const here = getEntry(world.info?.party_at);
  if (!here || !isMember()) return null;
  const w = dayWeather(here.id, placeTerrains(here), worldCalendar());
  return el('p', { class: 'weather-line small' }, el('span', { 'aria-hidden': 'true' }, '🌤 '), 'In ', link(here), `: ${w.line}`, w.rules.length && isGm() ? el('span', { class: 'muted' }, ` ${w.rules[0]}`) : null);
}

function viewHome() {
  const all = worldEntries();
  const recent = [...all].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 12);
  const info = world.info || {};
  const keyNpcs = all.filter((e) => e.kind === 'npc' && (e.tags || []).includes('key')).sort(byName);
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, info.name || 'The World'), info.tagline ? el('p', {}, info.tagline) : null,
      worldCalendar() ? el('p', { class: 'today-line' }, el('a', { href: '#world/calendar' }, `📅 ${todayText()}`)) : null,
      tableWeather(), isMember() ? nextSessionLine() : null, rsvpCard()),
    zeroNudge(),
    previouslyCard(),
    readingCard(),
    onThisDayCard(),
    omensCard(),
    aroundPartyCard(),
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
    isGm() ? changesCard() : recent.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Recently changed'),
      el('ul', { class: 'entry-list' }, recent.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, `${e.updated_by ? `${e.updated_by}, ` : ''}${when(e.updated_at)}`))))) : null);
}

function entryCard(e) {
  return el('li', { 'data-id': e.id, class: `entry-card${e.visibility === 'gm' ? ' is-hidden' : ''}${e.status === 'suggested' ? ' is-suggested' : ''}` }, thumb(e), el('div', { class: 'card-title' }, link(e), stateBadges(e)), e.summary ? el('p', {}, ((s) => (s.length > 180 ? `${s.slice(0, 178)}…` : s))(stripMarks(e.summary))) : null,
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => tagChip(t))) : null);
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
  const listNode = list.length ? (kind === 'session' ? sessionList(list) : kind === 'quest' ? questList(list) : kind === 'event'
      ? el('ol', { class: 'timeline' }, list.map((e) => (e.kind === 'session'
        ? el('li', { class: 'tl-session', 'data-id': e.id }, el('span', { class: 'date' }, e.fields.world_date), el('div', {}, el('span', { class: 'tag' }, 'Played'), ' ', link(e), e.fields.played_on ? el('span', { class: 'muted small' }, ` at the table ${e.fields.played_on}`) : null, e.summary ? el('p', {}, e.summary) : null))
        : el('li', { 'data-id': e.id }, el('span', { class: 'date' }, e.fields.date || e.fields.sort || '—'), el('div', {}, link(e), e.summary ? el('p', {}, e.summary) : null)))))
      : el('ul', { class: 'entry-grid' }, list.map(entryCard))) : null;
  const bulk = listNode ? bulkControls(list, listNode) : {};
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, KINDS[kind].plural), el('p', {}, KINDS[kind].blurb)),
      el('div', { class: 'btnrow' }, bulk.button, customFieldsButton(kind, rerenderWorld, 'btn ghost'),
        kind === 'item' && list.length && isMember() ? el('a', { class: 'btn ghost', href: '#world/itemcards' }, 'Print cards') : null,
        list.length && isMember() ? el('button', { class: 'btn ghost', type: 'button', title: 'Download these as a CSV file for a spreadsheet', onclick: () => download(`${world.info?.slug || 'world'}-${KINDS[kind].plural.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}.csv`, entriesCSV(list.filter((x) => x.kind === kind), KINDS[kind].label, kindFields(kind), (id) => world.entries.get(id)?.name, { gm: isGm() }), 'text/csv') }, 'Download CSV') : null,
        kind === 'session' && isGm() ? [recapButton('btn'), el('a', { class: 'btn primary', href: '#world/new/session' }, 'New session')]
          : isGm() || (isMember() && PLAYER_KINDS.includes(kind)) ? el('a', { class: 'btn primary', href: `#world/new/${kind}` }, `New ${lower(kindLabel(kind))}`)
          : isMember() ? el('a', { class: 'btn', href: `#world/new/${kind}` }, `Suggest a ${lower(kindLabel(kind))}`) : null)),
    listNode ? [listNode, bulk.bar]
      : notice(`No ${KINDS[kind].plural.replace(/^(?!NPC)\w+/, (w) => w.toLowerCase())} yet`, isGm() ? 'Add the first one.' : PLAYER_KINDS.includes(kind) && isMember() ? 'Add the first one.' : 'The GMs haven’t added any yet.'));
}

// Quests grouped by status: in play, on offer and rumored open; done and failed folded away.
function questList(list) {
  return el('div', { class: 'quest-groups' }, questGroups(list).map((g) => {
    const grid = el('ul', { class: 'entry-grid' }, g.entries.map(entryCard));
    return g.open ? el('section', { class: 'quest-group' }, el('h3', { class: 'section-title' }, `${g.title} (${g.entries.length})`), grid)
      : el('details', { class: 'quest-group' }, el('summary', {}, el('span', { class: 'section-title' }, `${g.title} (${g.entries.length})`)), grid);
  }));
}

function sessionList(list) {
  // Time between sessions: how long after the one before each was played.
  const gaps = sessionGaps(list, worldCalendar());
  const seenAll = appearances(worldEntries(), mentions); // once for the whole list
  return el('ol', { class: 'session-list' }, list.map((e) => el('li', { class: 'card', 'data-id': e.id },
    el('div', { class: 'entry-head' }, el('span', { class: 'eyebrow' }, [e.fields.number && `Session ${e.fields.number}`, e.fields.played_on, e.fields.world_date].filter(Boolean).join(' · ') || 'Session'),
      e.fields.gm ? el('span', { class: 'muted small' }, `GM ${e.fields.gm}`) : null),
    link(e), (() => { const g = gaps.get(e.id); const t = g && realGapText(g.real); return t ? el('span', { class: 'muted small session-gap' }, ` · ${t}`) : null; })(),
    // How long it ran: from the session's length (the timer saves it), read and written the same way.
    (() => { const m = parseLength(e.fields?.length); return m ? el('span', { class: 'muted small session-length' }, ` · ran ${lengthText(m)}`) : null; })(),
    // Days in the world, per session: in-world days since the session before, from their in-world dates.
    (() => { const w = gaps.get(e.id)?.world; return w !== null && w !== undefined && w >= 0 ? el('span', { class: 'muted small session-world-gap' }, w === 0 ? ' · the same day in the world' : ` · ${w} day${w === 1 ? '' : 's'} on in the world`) : null; })(),
    e.summary ? el('p', {}, e.summary) : null,
    e.fields.players ? el('p', { class: 'muted small' }, `Players: ${e.fields.players.replace(/\n+/g, ', ')}`) : null,
    e.fields.xp ? el('p', { class: 'muted small' }, `XP: ${e.fields.xp}`) : null,
    // New faces on the session list: how many people and places it introduced.
    (() => { const fresh = newIn(e, seenAll), people = fresh.filter((x) => x.kind === 'npc').length, places = fresh.filter((x) => PLACE_KINDS.includes(x.kind)).length;
      const bits = [people && `${people} new face${people === 1 ? '' : 's'}`, places && `${places} new place${places === 1 ? '' : 's'}`].filter(Boolean);
      return bits.length ? el('p', { class: 'muted small session-new-count' }, `✨ ${bits.join(', ')}`) : null; })(),
    // Journals on the session list: how many entries the players wrote about it.
    (() => { const n = journalsAbout(e.id).length; return n ? el('p', { class: 'muted small session-journal-count' }, `📓 ${n} journal entr${n === 1 ? 'y' : 'ies'} about it`) : null; })(),
    // Who came up, on the session list: who and what the log names (or connects to), up to eight.
    (() => { const named = namedIn(e);
      return named.length ? el('p', { class: 'small session-named' }, el('span', { class: 'muted' }, 'Came up: '), named.slice(0, 8).map((x, i) => [i ? ', ' : '', link(x)]), named.length > 8 ? el('span', { class: 'muted' }, ` and ${named.length - 8} more`) : '') : null; })())));
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

// Next and previous of the same kind, at the foot of an entry's page ([ and ] on the keyboard).
function entryNav(e) {
  const { prev, next } = neighbors(worldEntries(), e);
  if (!prev && !next) return null;
  return el('nav', { class: 'entry-nav', 'aria-label': `More ${KINDS[e.kind]?.plural.toLowerCase() || 'entries'}` },
    prev ? el('a', { href: `#world/e/${prev.id}`, rel: 'prev' }, el('span', { 'aria-hidden': 'true' }, '← '), el('span', { class: 'sr-only' }, 'Previous: '), prev.name) : el('span'),
    next ? el('a', { href: `#world/e/${next.id}`, rel: 'next' }, el('span', { class: 'sr-only' }, 'Next: '), next.name, el('span', { 'aria-hidden': 'true' }, ' →')) : el('span'));
}

function viewEntry(id, tab) {
  const e = world.entries.get(id);
  if (!e) return notice('Entry not found', 'It may have been deleted, or the link is wrong.');
  try { pushRecent(localStorage, session.worldKey, e.id); } catch { /* storage blocked */ }
  noteRead(e); noteReading(e);
  const all = worldEntries();
  const crumbs = []; let p = e.parent_id && world.entries.get(e.parent_id), guard = 0;
  while (p && guard++ < 10) { crumbs.unshift(p); p = p.parent_id && world.entries.get(p.parent_id); }
  const children = all.filter((x) => x.parent_id === id).sort(byName);
  const out = (e.links || []).map((l) => ({ ...l, target: world.entries.get(l.id) })).filter((l) => l.target);
  const incoming = all.flatMap((x) => (x.links || []).filter((l) => l.id === id).map((l) => ({ ...l, from: x })));
  const sessions = all.filter((x) => x.kind === 'session' && x.id !== id && (mentions(`${x.body}\n${x.summary}\n${Object.values(x.fields || {}).join('\n')}`).has(id) || (x.links || []).some((l) => l.id === id)))
    .sort((a, b) => (parseFloat(b.fields.number) || 0) - (parseFloat(a.fields.number) || 0));
  const pins = pinsFor(id);
  const fieldRows = kindFields(e.kind).filter((fd) => fieldApplies(fd, e.fields)).filter(([k, , type]) => e.fields?.[k] && !['stats', 'spells', 'level', 'stock', 'market', 'encounters', 'follows'].includes(k) && type !== 'hidden' && type !== 'image' && !(k === 'sheet' && e.fields.forge)).map(([k, label, type, , o]) => [o?.gmSecret ? `${label} (GMs only)` : label, k === 'born' && ageOf(worldCalendar(), e) ? `${e.fields[k]} (${ageText(ageOf(worldCalendar(), e))})` : k === 'deadline' && deadlineOf(worldCalendar(), e) ? `${e.fields[k]} (${((d) => deadlineText(d.left, d.holiday))(deadlineOf(worldCalendar(), e))})` : e.fields[k], type]);

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
    sinceLastCard(e), comingUpCard(e),
    routineNow(e), patronLine(e), hauntsLine(e), toolsLine(e), orderLine(e), myGuildsLine(e), talkLine(e), membersNowCard(e), guildMembersCard(e, rerenderWorld), crossPathsLine(e), mindingLine(e), ownerDayLine(e), festivalLine(e), marketDayLine(e), weekInTownBox(e), openNowLine(e), wantedCard(e), hereNow(e), laterLine(e), regularsLine(e), busiestLine(e), townHoursBox(e), townPreviewBox(e), turnUpBox(e), rollTownButton(e, rerenderWorld),
    e.kind === 'npc' || e.fields?.stats || e.fields?.spells ? statSection(e) : null,
    e.kind === 'clan' ? clanTree(e, rerenderWorld) : null,
    e.kind === 'npc' || e.kind === 'character' ? familySection(e, rerenderWorld) : null,
    e.kind === 'character' ? ownerLine(e) : null,
    goalsSection(e, rerenderWorld),
    farewellCard(e, rerenderWorld),
    storySection(e),
    readsLine(e),
    wishesSection(e, rerenderWorld),
    e.kind === 'character' ? sheetSection(e, rerenderWorld) : null,
    shoppingCard(e, rerenderWorld),
    e.kind === 'character' ? knownSection(e, rerenderWorld) : null,
    e.kind === 'character' ? attitudesOfCharacter(e, rerenderWorld) : null,
    bondsSection(e, rerenderWorld),
    giftsSection(e, rerenderWorld), givenSection(e),
    e.kind === 'character' ? downtimeSection(e) : null,
    attitudesToward(e, rerenderWorld),
    rewardCard(e, rerenderWorld),
    boundLine(e),
    riddleCard(e, rerenderWorld),
    objectivesSection(e, rerenderWorld),
    chainSection(e, rerenderWorld),
    tableSection(e),
    e.kind === 'encounter' && e.fields?.enc ? (() => { try { return encounterCard(JSON.parse(e.fields.enc), { title: 'Saved encounter', save: false }); } catch { return null; } })() : null,
    attendanceSection(e, rerenderWorld),
    e.kind === 'location' && e.fields?.type === 'Tavern' && e.fields?.menu && !e.fields?.stock ? [closingLine(e), nextShutLine(e)] : null,
    e.kind === 'location' && e.fields?.type === 'Tavern' ? menuCard(e, trailTown(e), rerenderWorld) : null,
    // The tavern's regulars at the bar: the characters who order here most (from their logs).
    e.kind === 'location' && e.fields?.type === 'Tavern' ? customersLine(e, 'tavern') : null,
    e.fields?.stock || (e.kind === 'location' && e.fields?.type === 'Shop' && isGm()) ? el('section', { class: 'card shop-card' },
      el('p', { class: 'shelf-title' }, e.name),
      el('p', { class: 'shelf-hours' }, hoursSign(e)),
      closingLine(e), nextShutLine(e), e.fields?.type === 'Tavern' ? null : customersLine(e, 'shop'),
      el('div', { class: 'entry-head' }, el('h3', {}, 'For sale'),
        // Print the shelf: just the shop's prices, to hand round the table.
        e.fields?.stock ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => { document.body.classList.add('print-shelf'); window.print(); setTimeout(() => document.body.classList.remove('print-shelf'), 500); } }, 'Print the shelf') : null,
        isGm() ? el('button', { class: 'btn small', type: 'button', onclick: async () => {
        const town = trailTown(e);
        try { await patchEntry(e, { fields: restockDraft(e, town) }); toast(town ? `Restocked at ${town.name}’s prices` : 'Restocked'); rerenderWorld(); } catch (err) { toast(err.message, 'bad'); }
      } }, e.fields?.stock ? 'Restock' : 'Stock this shop') : null),
      renderStock(e.fields?.stock, { mark: wishMark }) || el('p', { class: 'muted' }, 'No stock listed yet.'), buyBox(e, rerenderWorld), asksBox(e, rerenderWorld), tradeLedger(e)) : null,
    e.body ? el('section', {}, contentsNav(e.body), richText(e.body, { anchors: true })) : null,
    isGm() && e.secret ? el('aside', { class: 'secret' }, el('div', { class: 'eyebrow' }, 'GM only'), richText(e.secret)) : null,
    mentionsCard(e, rerenderWorld),
    e.kind === 'npc' ? lastSeenLine(e) : lastLogLine(e),
    ['npc', 'character', 'quest', ...PLACE_KINDS].includes(e.kind) ? cameUpBox(e) : null,
    // When a journal entry is set: the sessions it's about, with their in-world dates.
    e.kind === 'journal' ? (() => { const ss = [...new Set([...mentions([e.summary, e.body].join('\n')), ...(e.links || []).map((l) => l.id)])].map((id) => getEntry(id)).filter((x) => x?.kind === 'session');
      return ss.length ? el('p', { class: 'small muted journal-set' }, '📅 About ', ss.map((x, i) => [i ? ', ' : '', link(x), x.fields?.world_date ? ` (${x.fields.world_date})` : ''])) : null; })() : null,
    // What they wrote, on a character: the journal entries by the character's player (newest first).
    e.kind === 'character' && e.owner_id ? (() => { const js = worldEntries().filter((x) => x.kind === 'journal' && x.owner_id === e.owner_id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return js.length ? el('p', { class: 'small char-journals' }, el('strong', {}, `📓 Their player’s journal (${js.length}): `), js.slice(0, 8).map((x, i) => [i ? ', ' : '', link(x)]), js.length > 8 ? el('span', { class: 'muted' }, ` and ${js.length - 8} more`) : '') : null; })() : null,
    // In the players' journals: the journal entries that name an NPC, each with the line.
    e.kind === 'npc' ? (() => { const js = journalsAbout(e.id); return js.length ? el('details', { class: 'came-up in-journals' }, el('summary', { class: 'small' }, `In the players’ journals (${js.length})`),
      el('ol', { class: 'plain small came-up-list' }, js.map((x) => { const q = quoteOf(x, e); return el('li', {}, link(x), x.created_by ? el('span', { class: 'muted' }, ` by ${x.created_by}`) : '', q ? el('q', { class: 'last-seen-quote' }, q) : null); }))) : null; })() : null,
    // Copy a session as text: the log as plain text (no GM secrets), to paste into a chat.
    // The gap on a session's page: how long after the one before, at the table and in the world.
    e.kind === 'session' ? (() => { const order = sessionOrder(worldEntries()), i = order.findIndex((x) => x.id === e.id), prev = order[i + 1];
      if (i < 0 || !prev) return null; const g = sessionGaps([e, prev], worldCalendar()).get(e.id), bits = [realGapText(g.real), g.world !== null && g.world >= 0 ? (g.world === 0 ? 'the same day in the world' : `${g.world} day${g.world === 1 ? '' : 's'} on in the world`) : ''].filter(Boolean);
      return el('p', { class: 'muted small session-gap-line' }, `After `, link(prev), bits.length ? `: ${bits.join(' · ')}` : ''); })() : null,
    ['session', 'journal'].includes(e.kind) ? el('div', { class: 'btnrow' }, el('button', { class: 'btn small ghost session-copy', type: 'button', onclick: () => copyText(sessionText(e)) }, 'Copy as text')) : null,
    ['session', 'journal'].includes(e.kind) ? inSessionCard(e) : null,
    // What the players wrote: journal entries that link to this session.
    e.kind === 'session' ? (() => { const js = journalsAbout(e.id);
      return js.length ? el('section', { class: 'card session-journals' }, el('h3', {}, `What the players wrote (${js.length})`),
        el('ul', { class: 'plain' }, js.map((x) => el('li', {}, link(x), x.created_by ? el('span', { class: 'muted small' }, ` by ${x.created_by}`) : null)))) : null; })() : null,
    // A wanted poster: for anyone with a bounty on their head.
    e.kind === 'npc' && String(e.fields?.bounty || '').trim() && e.visibility !== 'gm' ? el('p', { class: 'small' }, el('a', { class: 'btn small', href: `#world/poster/${e.id}` }, '🎯 Wanted poster')) : null,
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
    e.tags?.length ? el('div', { class: 'tags' }, e.tags.map((t) => tagChip(t))) : null,
    el('p', { class: 'muted small' }, `Created${e.created_by ? ` by ${e.created_by}` : ''} ${when(e.created_at)}${e.updated_by ? ` · last edited by ${e.updated_by} ${when(e.updated_at)}` : ''} · `, el('a', { href: `#world/web/${e.id}` }, 'See connections in the web')),
    history,
    noteBox(e),
    tableWidget(e),
    isGm() ? talkWidget(e) : null, entryNav(e));
  const node = el('article', { class: 'w-view entry-view' },
    crumbs.length ? el('nav', { class: 'crumbs', 'aria-label': 'Located in' }, crumbs.flatMap((c, i) => [i ? ' › ' : '', link(c)])) : null,
    el('div', { class: 'panel-head row' },
      el('div', {}, el('div', { class: 'eyebrow' }, kindLabel(e.kind), e.fields?.type ? ` · ${e.fields.type}` : ''), el('h2', {}, e.name), akaOf(e).length ? el('p', { class: 'aka-line muted small' }, `Also known as ${akaOf(e).join(', ')}`) : null, sayLine(e), musicLine(e), partyPageNote(e), stateBadges(e).length ? el('div', { class: 'badges' }, stateBadges(e)) : null),
      !isGm() ? el('div', { class: 'btnrow' }, starButton(e), followButton(e), nextMoveButton(e, rerenderWorld), e.can_edit ? el('a', { class: 'btn', href: `#world/edit/${e.id}` }, 'Edit') : null, suggestEditButton(e), askAboutLink(e), itemCardButton(e), spellCardButton(e)) : null,
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
        partyPageButton(e, rerenderWorld),
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
    revealDateLine(e, rerenderWorld),
    hireLine(e, rerenderWorld),
    isPlace ? placeSummary(e) : null,
    isPlace ? placeHub(e, tab, overview, rerenderWorld) : overview());
  // #world/e/<id>/history (from the front page's "Recently changed"): open with the history showing.
  if (tab === 'history' && isGm()) { history.hidden = false; fillHistory(history, id, rerenderWorld); }
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
  const bits = [[c.people, c.people === 1 ? 'person' : 'people', 'people'], [c.openQuests, c.openQuests === 1 ? 'open job' : 'open jobs', 'quests'], [c.places, c.places === 1 ? 'place' : 'places', 'places'], [c.powers, c.powers === 1 ? 'faction or guild' : 'factions & guilds', 'powers']]
    .filter(([n, , tab]) => n && !(e.kind === 'settlement' && ['people', 'quests'].includes(tab))); // a settlement's glance panel counts those
  return bits.length ? el('p', { class: 'place-summary muted' }, bits.flatMap(([n, t, tab], i) => [i ? ' · ' : '', el('a', { href: `#world/e/${e.id}/${tab}` }, `${n} ${t}`)])) : null;
}

// ---- editing -----------------------------------------------------------------------------------

// My guilds: on a character's page, the guilds, factions and clans they belong to, with rank and this month's dues.
function myGuildsLine(c) {
  if (c.kind !== 'character') return null;
  const ms = membershipsOf(c); if (!ms.length) return null;
  return el('p', { class: 'small my-guilds' }, '🏛 Belongs to ', ms.map((m, i) => [i ? ', ' : '', link(m.org), m.rank ? ` (${m.rank})` : '',
    m.dues ? el('span', { class: `muted${m.dues.paid ? '' : ' dues-owed'}` }, m.dues.paid ? ` · dues paid for ${m.dues.month}` : ` · owes ${coinText(m.dues.cp)} for ${m.dues.month}`) : '']), '.');
}

// My place and watch: where a character (or hired NPC) marches and which watch they keep.
function orderLine(c) {
  if (!['character', 'npc'].includes(c.kind)) return null;
  const o = partyOrder(), i = o.march.indexOf(c.id), w = nightShifts().find((x) => x.id === c.id);
  if (i < 0 && !w) return null;
  const place = i < 0 ? '' : i === 0 ? 'marches in front' : i === o.march.length - 1 ? 'marches at the back' : `marches ${ordinal(i + 1)} in line`;
  return el('p', { class: 'small order-line' }, `🥾 ${c.name} `, [place, w ? `keeps the ${hhmmW(w.from)}–${hhmmW(w.to)} watch` : ''].filter(Boolean).join(' and '), '. ', el('a', { href: '#world/party' }, 'The party’s orders'));
}

// What these tools could make: on a character's page, the artisan's tools in their pack and a few things each can make.
function toolsLine(c) {
  if (c.kind !== 'character') return null;
  let inv = ''; try { inv = JSON.parse(c.fields?.play || '{}')?.inventory || ''; } catch { inv = ''; }
  const tools = toolsInPack(inv);
  if (!tools.length) return null;
  return el('div', { class: 'small tools-line' }, tools.map((t) => { const can = craftableWith(t);
    return el('p', {}, `🔨 With ${t}, ${c.name} could make `, can.slice(0, 5).map((g) => g.name).join(', '), can.length > 5 ? el('span', { class: 'muted' }, ` and ${can.length - 5} more`) : '', '.'); }));
}

// Favourite haunts: on a character's page, the tavern they order at most and the shop they buy from most (from their log).
function hauntsLine(c) {
  if (c.kind !== 'character') return null;
  const ps = purchases([c]), inn = spots(ps, 'tavern')[0], shop = spots(ps, 'shop')[0];
  if (!inn && !shop) return null;
  const place = (x) => { const e = findByName(x.place); return e ? link(e) : x.place; };
  return el('p', { class: 'small haunts-line' }, inn ? ['🍺 Usually orders at ', place(inn), el('span', { class: 'muted' }, ` (${inn.count}×)`)] : null, inn && shop ? ' · ' : null,
    shop ? ['🛍 Buys most at ', place(shop), el('span', { class: 'muted' }, ` (${shop.count}×)`)] : null);
}

// Customers: who buys here most (a shop's best customers, or a tavern's regulars at the bar), from the characters' logs.
function customersLine(place, kind) {
  const cs = customersAt(worldEntries().filter((c) => c.kind === 'character'), place.name).slice(0, 5);
  if (!cs.length) return null;
  const n = (x) => (kind === 'tavern' ? `${x.count} order${x.count === 1 ? '' : 's'}` : `${x.count} purchase${x.count === 1 ? '' : 's'}${x.cp ? `, ${coinText(x.cp)}` : ''}`);
  // A shop's best sellers: what the party buys there most.
  // A tavern's favourites: what the party orders there most.
  const chars = worldEntries().filter((c) => c.kind === 'character'), gs = (kind === 'shop' ? goodsAt(chars, place.name) : orderedAt(chars, place.name)).slice(0, 5);
  return [el('p', { class: `small customers-line ${kind}` }, kind === 'tavern' ? '🍺 At the bar most: ' : '🛍 Best customers: ', cs.map((x, i) => [i ? ', ' : '', link(x.who), el('span', { class: 'muted' }, ` (${n(x)})`)])),
    gs.length ? el('p', { class: `small best-sellers ${kind}` }, kind === 'shop' ? '📦 Sells most: ' : '🍲 The party’s favourites: ', gs.map((g, i) => [i ? ', ' : '', g.name, el('span', { class: 'muted' }, ` (${g.qty})`)])) : null];
}

// A shop's next day off: when it's next shut all day (its weekly day off, or a holiday it doesn't trade on).
function nextShutLine(shop) {
  if (!(shop.fields?.stock || shop.fields?.menu)) return null;
  const cal = worldCalendar(), x = cal && nextShut(cal, shop, 30);
  if (!x) return null;
  const when = x.inDays === 1 ? 'tomorrow' : `${x.weekday ? `${x.weekday}, ` : ''}in ${x.inDays} days`;
  return el('p', { class: 'small muted next-shut' }, `📅 Next shut ${when}: ${x.why === 'holiday' ? `for ${x.holiday}` : 'its day off'}.`);
}

// Closing time: how long until a shop shuts, or opens, by the world's clock (and today's holiday).
function closingLine(shop) {
  if (!(shop.fields?.stock || shop.fields?.menu) || world.info?.clock?.minutes === undefined) return null;
  const u = untilChange(shop, world.info.clock.minutes, dayFor(shop));
  // Late night at the tavern: in the last hour, it's last orders.
  const last = u.open && u.mins <= 60;
  return el('p', { class: `small closing-line${last ? ' last-orders' : ' muted'}` }, last ? '🍺 ' : '🕰 ', last ? `${shop.fields?.type === 'Tavern' ? 'Last orders' : 'Closing soon'}: ${shop.name} shuts in ${leftText(u.mins)}.` : u.open ? `Open for another ${leftText(u.mins)}.` : u.mins === null ? 'Shut today; it opens tomorrow.' : `Shut; it opens in ${leftText(u.mins)}.`);
}

// The places about an entry, for rolling an NPC's routine: those in its town (by where it's placed), else the world's.
function placesAbout(e) {
  let town = null;
  for (let p = e.parent_id && getEntry(e.parent_id), i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.kind === 'settlement') { town = p; break; }
  const inTown = (x) => { for (let p = x, i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.id === town.id) return true; return false; };
  return worldEntries().filter((x) => x.kind === 'location' && (!town || inTown(x))).slice(0, 60).map((x) => ({ name: x.name, type: x.fields?.type || '' }));
}

function viewEdit(id, kindForNew) {
  if (!isMember()) return notice(signedIn() ? 'Members only' : 'Sign in to add things', signedIn() ? 'You’re visiting this world. Ask its owner for an invite to add characters, journals and suggestions.' : 'Sign in with your personal code, or open the invite link your GM sent you.',
    signedIn() ? null : el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => openSignIn() }, 'Sign in'), el('a', { class: 'btn', href: '#join' }, 'I have an invite')));
  const existing = id ? world.entries.get(id) : null;
  if (id && !existing) return notice('Entry not found', 'It may have been deleted.');
  if (existing && existing.can_edit && canPartyEdit(existing)) return partyPageForm(existing);
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
      if (type === 'image') return pictureField(v, { alt: e.fields.image_alt || '' });
      if (type === 'select') {
        const s = el('select', { id: `ff-${k}`, 'data-field': k }, el('option', { value: '' }, '—'), opts.map((o) => el('option', { value: o }, o)));
        if (v && !opts.includes(v)) s.append(el('option', { value: v }, v));
        s.value = v;
        return el('div', { class: 'field' }, el('label', { for: `ff-${k}` }, label), s);
      }
      const box = type === 'long' ? el('textarea', { id: `ff-${k}`, 'data-field': k, rows: 3 }, v) : el('input', { type: 'text', id: `ff-${k}`, 'data-field': k, value: v });
      const roll = rollButton(() => kindSel.value, k, box, label, () => ({ type: fieldsBox.querySelector('[data-field="type"]')?.value, role: fieldsBox.querySelector('[data-field="role"]')?.value || '', places: k === 'routine' ? placesAbout(e) : [] }));
      const head = roll ? el('div', { class: 'label-row' }, el('label', { for: `ff-${k}` }, label), roll) : el('label', { for: `ff-${k}` }, label);
      return el('div', { class: `field${type === 'long' ? ' wide' : ''}` }, head, box, k === 'routine' ? routinePreview(box) : k === 'hours' ? hoursHint(box) : k === 'holidays' && kindSel.value === 'settlement' ? localHolidaysHint(box) : null);
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
      input('aka', 'Also known as', e.fields.aka || '', { maxlength: 500, placeholder: 'Other names, separated by semicolons' }),
      input('music', 'Mood music', e.fields.music || '', { type: 'url', maxlength: 500, placeholder: 'https:// link (YouTube, Spotify, Tabletop Audio…)' }),
      input('parent', 'Located in / part of', parent?.name || '', { list: 'w-names', placeholder: 'e.g. a region or city' })),
    suggestNote,
    area('summary', 'Summary', e.summary, 2, 'One or two sentences. This shows in lists and search.'),
    fieldsBox,
    area('body', 'Description & notes', e.body, 8, 'Link to other entries with [[double brackets]], e.g. [[The Silver Hand]]. **Bold**, *italic*, “- ” for a list, “## ” for a small heading, “> ” for text to read aloud.'),
    // Link names as you write: in a session log, the entries it names as plain text, with a button to link them.
    ['session', 'journal', 'quest', ...PLACE_KINDS].includes(e.kind) ? linkHint(e.id) : null,
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
  // Roll a name, for kinds the name tables cover (kept in step with the type; a location needs to be a tavern or shop).
  const nameBox = form.querySelector('#f-name');
  if (nameBox) {
    const label = nameBox.previousElementSibling;
    const row = el('div', { class: 'label-row' }); label.replaceWith(row); row.append(label);
    const fieldVal = (k) => fieldsBox.querySelector(`[data-field="${k}"]`)?.value;
    const sync = () => { row.querySelector('.roll-btn')?.remove(); const b = rollButton(() => kindSel.value, 'name', nameBox, 'name', () => ({ type: fieldVal('type'), ancestry: fieldVal('ancestry'), species: fieldVal('species') })); if (b) row.append(b); };
    kindSel.addEventListener('change', sync); sync();
  }
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
      // Fields the form doesn't show (a shop's menu, haggles and ledger, a hireling's wage, a party page's switch) are kept
      // as they are; the fields of a kind this entry no longer is are dropped, as before.
      fields: Object.fromEntries([...Object.entries(existing?.fields || {}).filter(([k, v]) => v && !['say', 'aka', 'music', 'image_alt'].includes(k) && !kindFields(kindSel.value).some(([fk]) => fk === k) && !kindFields(existing.kind).some(([fk]) => fk === k)),
        ...Object.entries(e.fields).filter(([k, v]) => v && k !== 'say' && k !== 'aka' && k !== 'music' && kindFields(kindSel.value).some(([fk]) => fk === k)), ['say', cleanSay(f.get('say'))], ['aka', cleanAka(f.get('aka'), f.get('name'))], ['music', cleanMusic(f.get('music'))], ['image_alt', e.fields.image ? String(e.fields.image_alt || '').replace(/\s+/g, ' ').trim().slice(0, 300) : '']].filter(([, v]) => v)),
      tags: String(f.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean), links, parent_id: parentEntry?.id || null, version: existing?.version,
    };
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = existing ? await api('entries', { method: 'PUT', query: { id: existing.id }, body: { entry } }) : await api('entries', { method: 'POST', body: { entry } });
      world.entries.set(r.entry.id, r.entry);
      toast(existing ? 'Saved' : r.entry.status === 'suggested' ? 'Suggested: a GM will take a look' : 'Added to the world');
      location.hash = `world/e/${r.entry.id}`;
      offerBounty(existing, r.entry);
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
  else if (view === 'whoswho') node = await viewWhosWho();
  else if (view === 'screen') node = await viewScreen();
  else if (view === 'kit') node = await viewKit();
  else if (view === 'poster') node = await viewPoster(arg);
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
  const gm = isGm() && !previewing() && e.fields?.status !== 'Dead';
  // Due back (GMs): a key person the party hasn't met yet.
  if (!seen) return gm && (e.tags || []).includes('key') && appearances(worldEntries(), mentions).size ? el('p', { class: 'small due-back' }, '🔔 Key person, not met yet: they might turn up.') : null;
  // …and where: the place that session's log mentions (their own home first).
  const at = sceneOf(seen.last, mentions, getEntry, PLACE_KINDS, e);
  return el('p', { class: 'muted small last-seen' }, '👁 Last seen in ', link(seen.last), seen.ago ? ` (${seen.ago} session${seen.ago === 1 ? '' : 's'} ago)` : ' (the latest session)',
    at ? [', at ', link(at)] : '', seen.count > 1 ? ` · in ${seen.count} sessions` : '',
    // Due back (GMs): not met in the last two sessions, as session prep counts it.
    gm && seen.ago >= 2 ? el('span', { class: 'due-back' }, ` · 🔔 not seen for ${seen.ago} sessions: might turn up`) : '',
    // What happened with them: the line of that session's log that names them.
    (() => { const q = quoteOf(seen.last, e); return q ? el('q', { class: 'last-seen-quote' }, q) : null; })(),
    // First met: the session they first came up in, and where (when that isn't the last time too).
    seen.first && seen.first.id !== seen.last.id ? (() => { const at1 = sceneOf(seen.first, mentions, getEntry, PLACE_KINDS, e);
      return el('span', { class: 'first-met' }, '🤝 First met in ', link(seen.first), at1 ? [', at ', link(at1)] : ''); })() : null);
}

// In this session: the people, places, quests and things a session's log names (or connects to), grouped by kind.
function inSessionCard(e) {
  const named = namedIn(e);
  if (!named.length) return null;
  const groups = new Map();
  for (const x of named) { const k = kindLabel(x.kind); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
  // New in this session: who and what came up for the first time.
  const fresh = e.kind === 'session' ? newIn(e) : [];
  return el('section', { class: 'card in-session' }, el('h3', {}, `In this ${e.kind === 'journal' ? 'entry' : 'session'} (${named.length})`),
    fresh.length ? el('p', { class: 'small session-new' }, el('strong', {}, '✨ New this session: '), fresh.sort(byName).map((x, i) => [i ? ', ' : '', link(x)])) : null,
    el('dl', { class: 'in-session-list' }, [...groups].map(([k, xs]) => [el('dt', {}, k), el('dd', {}, xs.sort(byName).map((x, i) => [i ? ', ' : '', link(x)]))])));
}

// Every time they came up: an NPC's sessions (when there's more than one), each with the line that names them.
function cameUpBox(e) {
  const list = sessionsWith(worldEntries(), mentions, e.id);
  if (list.length < 2) return null;
  const who = ['npc', 'character'].includes(e.kind);
  return el('details', { class: 'came-up' }, el('summary', { class: 'small' }, `Every time ${who ? 'they' : 'it'} came up (${list.length})`),
    el('ol', { class: 'plain small came-up-list' }, list.map((s) => { const q = quoteOf(s, e); return el('li', {}, link(s), q ? el('q', { class: 'last-seen-quote' }, q) : el('span', { class: 'muted' }, ' (connected, not named in the log)')); })));
}

// Last in the log, everywhere: for places, quests, factions and items, the session that last mentioned them, with
// the line from its log.
const LOGGED = ['region', 'area', 'settlement', 'location', 'quest', 'faction', 'guild', 'clan', 'item', 'character'];
function lastLogLine(e) {
  if (!LOGGED.includes(e.kind)) return null;
  const seen = appearances(worldEntries(), mentions).get(e.id);
  if (!seen) return null;
  const q = quoteOf(seen.last, e);
  return el('p', { class: 'muted small last-log' }, '📜 Last in the log: ', link(seen.last), seen.ago ? ` (${seen.ago} session${seen.ago === 1 ? '' : 's'} ago)` : ' (the latest session)',
    seen.count > 1 ? ` · in ${seen.count} sessions` : '', q ? el('q', { class: 'last-seen-quote' }, q) : null, firstLine(e, seen));
}

// Taken on in, finished in: for a quest, the session that first mentioned it and, once it's done, the last.
function firstLine(e, seen) {
  if (!seen.first) return null;
  // First visited: for a place, the session that first mentioned it (when that isn't the last too).
  if (PLACE_KINDS.includes(e.kind)) return seen.first.id !== seen.last.id ? el('span', { class: 'first-log' }, '🗺 First visited in ', link(seen.first)) : null;
  if (e.kind !== 'quest') return null;
  const done = ['Completed', 'Failed', 'Abandoned'].includes(e.fields?.status);
  return el('span', { class: 'first-log' }, '🧭 Taken on in ', link(seen.first), done ? [` · ${e.fields.status.toLowerCase()} in `, link(seen.last)] : '');
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

// The signed-in person's own character: the first active one they own (newest first if there are several).
export function myCharacter() {
  if (!session.gm) return null;
  return worldEntries().filter((e) => e.kind === 'character' && e.owner_id === session.gm.id && e.status !== 'suggested' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
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
      // You've got news: your own character's sheet changed from outside (a hand-out, a share, rations): say what.
      const news = changes.filter((c) => c.old && c.entry.owner_id && c.entry.owner_id === session.gm?.id)
        .map((c) => ({ c, lines: newLines(playJson(c.old), playJson(c.entry)).filter((x) => x.by !== session.gm?.name) })).filter((x) => x.lines.length);
      for (const { c, lines } of news) toast(`📜 ${c.entry.name}: ${lines.map((x) => `${x.text}${x.by ? ` (${x.by})` : ''}`).join('; ')}`);
      const told = new Set(news.map((x) => x.c));
      // Something you follow changed: say so on its own, by name.
      const followed = changes.filter((c) => c.change !== 'removed' && c.by && (world.info?.following || []).includes(c.entry.id));
      if (followed.length) { toast(`🔔 ${followed.map((c) => c.entry.name).join(', ')} (you follow ${followed.length === 1 ? 'it' : 'them'}) changed by ${[...new Set(followed.map((c) => c.by))].join(', ')}`); renderSide(); }
      if (changes.length) {
        const people = [...new Set(changes.map((c) => c.by).filter(Boolean))];
        const one = changes.length === 1 && changes[0];
        if (!followed.length && changes.some((c) => !told.has(c))) toast(one ? (one.calendar ? 'The calendar changed' : one.change === 'removed' ? `${one.entry.name} was removed or hidden` : `${one.by || 'Someone'} ${one.change === 'new' ? 'added' : 'edited'} ${one.entry.name}`)
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

// Who might turn up, on a settlement's page (GMs): the people due back here, as session prep shows them.
function turnUpBox(e) {
  if (e.kind !== 'settlement' || !isGm() || previewing()) return null;
  const due = turnUp(e);
  if (!due.length) return null;
  return el('details', { class: 'turn-up' }, el('summary', {}, `Who might turn up (${due.length})`), el('p', { class: 'muted small' }, turnUpNote), turnUpList(due));
}

// Link names as you write: under a session log's (or journal entry's) text, the entries it names without [[links]], and a button that
// links them in the text (the GM saves the form as usual).
function linkHint(selfId = null) {
  const out = el('p', { class: 'small link-hint', 'aria-live': 'polite' });
  const draw = () => {
    const box = document.getElementById('f-body');
    if (!box) return;
    const found = unlinkedIn(box.value, worldEntries().filter((x) => !skip.has(x.id) && x.id !== selfId)); // never the entry's own name
    if (!found.length) { setKids(out); return; }
    setKids(out, el('span', { class: 'muted' }, 'Names you could link: '), found.map((f, i) => [i ? ', ' : '', f.entry.name]), ' ',
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => { box.value = linkNames(box.value, found.map((f) => f.entry)); box.dispatchEvent(new Event('input', { bubbles: true })); draw(); } }, 'Link them'));
  };
  // Not a name, as you write: names the GMs marked never to link are left out (only GMs can read that list).
  let skip = new Set();
  if (isGm()) api('settings').then((r) => { skip = new Set(r.world?.prep?.not_links || []); draw(); }).catch(() => {});
  // The text box is in the form by the time this runs (next tick); then follow what's typed, a moment after.
  let t = null;
  setTimeout(() => { const box = document.getElementById('f-body'); if (box) box.addEventListener('input', () => { clearTimeout(t); t = setTimeout(draw, 300); }); draw(); });
  return out;
}

// Hours as you type: under a place's Opening hours field, how it reads them.
// Check the local holidays: as the GM types, which lines the calendar reads (and when they fall) and which it can't.
function localHolidaysHint(box) {
  const out = el('p', { class: 'small muted holidays-preview', 'aria-live': 'polite' });
  const draw = () => {
    const cal = worldCalendar();
    if (!box.value.trim()) { out.textContent = cal ? 'One per line: the name, then the date, e.g. “Founding Day, 3 ' + cal.months[0].name + '”; add the year it was first held to count them (“the 200th Founding Day”), and what happens after a dash (“— a parade”). The town’s shops shut on them.' : 'Set up the calendar first, then write one per line: the name, then the date.'; out.classList.remove('bad-line'); return; }
    if (!cal) { out.textContent = 'The world has no calendar yet, so these can’t fall on a day.'; out.classList.add('bad-line'); return; }
    const { holidays, bad } = parseHolidayLines(cal, box.value);
    out.textContent = [holidays.length ? `Reads: ${holidays.map((h) => `${h.name} (${h.day} ${cal.months[h.month].name}${h.since !== undefined ? `, first held ${h.since}` : ''})${h.note ? `: ${h.note}` : ''}`).join(', ')}.` : '', bad.length ? `Can’t read: ${bad.join(', ')}. Write it like “Founding Day, 3 ${cal.months[0].name}”.` : ''].filter(Boolean).join(' ');
    out.classList.toggle('bad-line', bad.length > 0);
  };
  box.addEventListener('input', draw); draw();
  return out;
}

function hoursHint(box) {
  const out = el('p', { class: 'small muted hours-preview', 'aria-live': 'polite' });
  const draw = () => { out.textContent = hoursPreview(box.value); out.classList.toggle('bad-line', !!box.value.trim() && out.textContent.startsWith('Can’t')); };
  box.addEventListener('input', draw); draw();
  return out;
}
