// Place hubs: everything inside a region, area, town or location, with quick tools to fill it.
// placeHub(entry, tab) renders the tab bar and panels shown on a place's page and in the map drawer.
// viewAtlas() shows the whole world as a tree of places.

import { wildsSection } from './encounter-ui.js';
import { thumb } from './image-ui.js';
import { el, toast, setKids } from './dom.js';
import { isGm } from './api.js';
import { KINDS, PLACE_KINDS, CHILD_PLACES } from './world-schema.js';
import {
  world, worldEntries, getEntry, link, kindLabel, byName, notice, nameList, findByName, createEntries, patchEntry,
  childrenOf, descendantsOf, linkedTo, mapsOf,
} from './world-store.js';
import { npcDraft, questDraft, tavernDraft, shopDraft, settlementDraft, areaDraft, orgDraft } from './generators.js';
import { pinsFor } from './world-maps.js';
import { generateShop, rollMarket, marketText, parseMarket, stockText, SHOP_TYPES, ECONOMIES } from './economy.js';
import { renderMarket, renderStock } from './shop-ui.js';
import { personName, ANCESTRY_WEIGHTS } from './names.js';
import { makeRng } from './rng.js';
import { createEntry } from './world-store.js';

export const HUB_TABS = [['overview', 'Overview'], ['people', 'People'], ['quests', 'Quest board'], ['market', 'Market'], ['places', 'Places'], ['powers', 'Powers'], ['wilds', 'Encounters'], ['maps', 'Maps']];
const er = makeRng(Date.now() ^ 0xec0);
const QUEST_STATUSES = ['Rumor', 'Available', 'Active', 'Completed', 'Failed', 'Abandoned'];
const ORG_KINDS = ['faction', 'guild', 'clan'];
const sendDraft = (d) => window.dispatchEvent(new CustomEvent('world:draft', { detail: d }));
const statusClass = (s) => `st-${String(s || 'none').toLowerCase()}`;

export function placeCounts(place) {
  const inside = descendantsOf(place.id);
  return {
    people: inside.filter((e) => e.kind === 'npc').length,
    quests: inside.filter((e) => e.kind === 'quest').length,
    openQuests: inside.filter((e) => e.kind === 'quest' && ['Available', 'Active', 'Rumor'].includes(e.fields?.status || 'Available')).length,
    places: inside.filter((e) => PLACE_KINDS.includes(e.kind)).length,
    powers: [...new Set([...inside.filter((e) => ORG_KINDS.includes(e.kind)), ...linkedTo(place.id, ORG_KINDS)].map((e) => e.id))].length,
  };
}

// ---- draft previews ----------------------------------------------------------------------------

// Shows freshly rolled drafts with keep/reroll/rename, then saves the kept ones in one go.
function previewBox(title, makeOne, count, onSaved) {
  let drafts = Array.from({ length: count }, makeOne);
  const keep = new Set(drafts.map((_, i) => i));
  const box = el('div', { class: 'preview card' });
  const status = el('p', { class: 'form-status', role: 'status' });
  function render() {
    setKids(box,
      el('div', { class: 'entry-head' }, el('h4', {}, title), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Close', onclick: () => box.remove() }, '✕')),
      el('ul', { class: 'draft-list' }, drafts.map((d, i) => el('li', { class: `draft${keep.has(i) ? '' : ' off'}` },
        el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: keep.has(i) || null, onchange: (ev) => { if (ev.target.checked) keep.add(i); else keep.delete(i); render(); } })),
        el('div', { class: 'draft-main' },
          el('input', { type: 'text', class: 'draft-name', value: d.name, 'aria-label': 'Name', onchange: (ev) => { d.name = ev.target.value.trim() || d.name; } }),
          el('span', { class: 'muted small' }, [d.fields?.role || d.fields?.type || d.fields?.size || kindLabel(d.kind), d.fields?.ancestry].filter(Boolean).join(' · ')),
          el('p', { class: 'small' }, d.summary)),
        el('button', { class: 'reroll', type: 'button', title: 'Reroll this one', 'aria-label': `Reroll ${d.name}`, onclick: () => { drafts[i] = makeOne(); keep.add(i); render(); } }, '↻')))),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn primary small', type: 'button', disabled: !keep.size || null, onclick: save }, keep.size === drafts.length ? (drafts.length > 1 ? `Save all ${drafts.length}` : 'Save') : `Save ${keep.size}`),
        el('button', { class: 'btn small', type: 'button', onclick: () => { drafts = drafts.map((d, i) => (keep.has(i) ? d : makeOne())); render(); } }, 'Reroll the unticked'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => box.remove() }, 'Discard')),
      status);
  }
  async function save() {
    const chosen = drafts.filter((_, i) => keep.has(i));
    status.textContent = 'Saving…'; status.className = 'form-status';
    try { const made = await createEntries(chosen); toast(`Saved ${made.length === 1 ? made[0].name : `${made.length} entries`}`); box.remove(); onSaved(made); }
    catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  }
  render();
  return box;
}

// Pick an existing entry by name and run fn on it.
function pickExisting(label, kinds, exclude, fn) {
  const id = `pick-${Math.random().toString(36).slice(2, 7)}`;
  const input = el('input', { type: 'text', list: id, placeholder: label, 'aria-label': label });
  const form = el('form', { class: 'pick-form' }, input,
    el('datalist', { id }, worldEntries().filter((e) => kinds.includes(e.kind) && !exclude(e)).sort(byName).map((e) => el('option', { value: e.name }, e.fields?.role || kindLabel(e.kind)))),
    el('button', { class: 'btn small', type: 'submit' }, 'Add'));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const e = findByName(input.value);
    if (!e || !kinds.includes(e.kind)) { toast(`No ${kinds.map((k) => KINDS[k].label.toLowerCase()).join(' or ')} called “${input.value}”.`, 'bad'); return; }
    try { await fn(e); input.value = ''; } catch (err) { toast(err.message, 'bad'); }
  });
  return form;
}

// ---- sections ----------------------------------------------------------------------------------

function peopleSection(place, rerender, compact) {
  const keyFirst = (a, b) => Number((b.tags || []).includes('key')) - Number((a.tags || []).includes('key')) || byName(a, b);
  const here = childrenOf(place.id, ['npc']).sort(keyFirst);
  const deeper = descendantsOf(place.id, ['npc']).filter((e) => e.parent_id !== place.id).sort(keyFirst);
  const slot = el('div', { class: 'preview-slot' });
  const roll = (n) => slot.prepend(previewBox(n > 1 ? `${n} new people for ${place.name}` : `A new face in ${place.name}`, () => npcDraft(place), n, rerender));
  const card = (e) => el('li', { class: `person card ${e.fields?.status && e.fields.status !== 'Alive' ? 'gone' : ''}${(e.tags || []).includes('key') ? ' key' : ''}` },
    el('div', { class: 'person-head' }, thumb(e, 'avatar'), (e.tags || []).includes('key') ? el('span', { class: 'key-star', title: 'Key NPC' }, '★') : null, link(e), e.fields?.status && e.fields.status !== 'Alive' ? el('span', { class: 'tag' }, e.fields.status) : null),
    el('span', { class: 'muted small' }, [e.fields?.role, e.fields?.ancestry].filter(Boolean).join(' · ') || 'NPC'),
    !compact && e.summary ? el('p', { class: 'small' }, e.summary) : null,
    isGm() && !compact ? el('div', { class: 'person-actions' },
      e.parent_id !== place.id ? el('span', { class: 'muted small' }, 'in ', link(getEntry(e.parent_id) || place)) : null,
      el('button', { class: 'btn small ghost', type: 'button', onclick: async () => { try { await patchEntry(e, { parent_id: null }); toast(`${e.name} moved out of ${place.name}`); rerender(); } catch (err) { toast(err.message, 'bad'); } } }, 'Move out')) : null);
  return el('section', { class: 'hub-sec' },
    compact ? el('h4', {}, `People (${here.length + deeper.length})`) : null,
    isGm() ? el('div', { class: 'hub-tools' },
      el('button', { class: 'btn primary small', type: 'button', onclick: () => roll(1) }, 'Roll an NPC'),
      el('button', { class: 'btn small', type: 'button', onclick: () => roll(compact ? 3 : 5) }, compact ? 'Roll 3' : 'Populate (5)'),
      compact ? null : pickExisting('Bring an existing NPC here…', ['npc'], (x) => x.parent_id === place.id, async (x) => { await patchEntry(x, { parent_id: place.id }); toast(`${x.name} now lives in ${place.name}`); rerender(); })) : null,
    slot,
    here.length || deeper.length
      ? el('ul', { class: `people-grid${compact ? ' compact' : ''}` }, [...here, ...(compact ? deeper.slice(0, 6) : deeper)].slice(0, compact ? 8 : 500).map(card))
      : el('p', { class: 'muted' }, isGm() ? `Nobody lives in ${place.name} yet. Roll a few townsfolk, or bring existing NPCs here.` : 'No known residents yet.'),
    compact && here.length + deeper.length > 8 ? el('a', { href: `#world/e/${place.id}/people`, class: 'small' }, `All ${here.length + deeper.length} people →`) : null);
}

function questSection(place, rerender, compact) {
  const quests = descendantsOf(place.id, ['quest']);
  let filter = 'open';
  const slot = el('div', { class: 'preview-slot' });
  const tierSel = el('select', { 'aria-label': 'Party level' }, ['Levels 1–4', 'Levels 5–10', 'Levels 11–16', 'Levels 17–20'].map((t, i) => el('option', { value: i }, t)));
  const board = el('div', { class: 'board-wrap' });
  function renderBoard() {
    const shown = quests.filter((q) => {
      const s = q.fields?.status || 'Available';
      return filter === 'all' || (filter === 'open' ? ['Rumor', 'Available', 'Active'].includes(s) : ['Completed', 'Failed', 'Abandoned'].includes(s));
    }).slice(0, compact ? 4 : 500);
    setKids(board,
      compact ? null : el('div', { class: 'seg small-seg', role: 'group', 'aria-label': 'Show' }, [['open', 'Open'], ['done', 'Finished'], ['all', 'All']].map(([v, t]) => el('button', { type: 'button', 'aria-pressed': String(filter === v), onclick: () => { filter = v; renderBoard(); } }, t))),
      shown.length ? el('ul', { class: `quest-board${compact ? ' compact' : ''}` }, shown.map((q) => {
        const s = q.fields?.status || 'Available';
        return el('li', { class: `notice ${statusClass(s)}` },
          el('span', { class: 'pinhead', 'aria-hidden': 'true' }),
          el('div', { class: 'notice-top' }, el('span', { class: `status-pill ${statusClass(s)}` }, s), q.fields?.reward ? el('span', { class: 'reward' }, q.fields.reward) : null),
          el('h5', {}, link(q)),
          q.summary ? el('p', {}, q.summary) : null,
          q.fields?.patron ? el('p', { class: 'muted small' }, `Ask for: ${q.fields.patron}`) : null,
          q.parent_id !== place.id && getEntry(q.parent_id) ? el('p', { class: 'muted small' }, 'Posted in ', link(getEntry(q.parent_id))) : null,
          isGm() && !compact ? el('select', { class: 'status-sel', 'aria-label': `Status of ${q.name}`, onchange: async (ev) => {
            try { await patchEntry(q, { fields: { status: ev.target.value } }); toast(`${q.name}: ${ev.target.value}`); rerender(); } catch (err) { toast(err.message, 'bad'); }
          } }, QUEST_STATUSES.map((st) => { const o = el('option', { value: st }, st); if (st === s) o.selected = true; return o; })) : null);
      })) : el('p', { class: 'muted' }, filter === 'open' ? (isGm() ? 'The board is empty. Roll a job, or write one.' : 'No open jobs on the board right now.') : 'Nothing here.'),
      compact && quests.length > shown.length ? el('a', { href: `#world/e/${place.id}/quests`, class: 'small' }, `Whole board (${quests.length}) →`) : null);
  }
  renderBoard();
  return el('section', { class: 'hub-sec' },
    compact ? el('h4', {}, `Quest board (${quests.filter((q) => ['Rumor', 'Available', 'Active'].includes(q.fields?.status || 'Available')).length} open)`) : null,
    isGm() ? el('div', { class: 'hub-tools' },
      el('button', { class: 'btn primary small', type: 'button', onclick: () => slot.prepend(previewBox(`A job posted in ${place.name}`, () => questDraft(place, +tierSel.value), 1, rerender)) }, 'Roll a quest'),
      compact ? null : el('button', { class: 'btn small', type: 'button', onclick: () => slot.prepend(previewBox(`Jobs for the ${place.name} board`, () => questDraft(place, +tierSel.value), 3, rerender)) }, 'Fill the board (3)'),
      compact ? null : tierSel,
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => sendDraft({ kind: 'quest', parent_id: place.id, fields: { status: 'Available' } }) }, 'Write one')) : null,
    slot, board);
}

function placesSection(place, rerender, compact) {
  const kids = childrenOf(place.id, PLACE_KINDS);
  const slot = el('div', { class: 'preview-slot' });
  const allowed = CHILD_PLACES[place.kind] || [];
  const add = (label, make, n = 1) => el('button', { class: 'btn small', type: 'button', onclick: () => slot.prepend(previewBox(`${label} in ${place.name}`, () => make(place), n, rerender)) }, `+ ${label}`);
  const groups = ['area', 'settlement', 'location'].map((k) => [k, kids.filter((e) => e.kind === k)]).filter(([, l]) => l.length);
  return el('section', { class: 'hub-sec' },
    compact ? el('h4', {}, `Places (${kids.length})`) : null,
    isGm() ? el('div', { class: 'hub-tools' },
      allowed.includes('settlement') ? add('Town', settlementDraft) : null,
      allowed.includes('area') ? add('Area', areaDraft) : null,
      allowed.includes('location') ? add('Tavern', tavernDraft) : null,
      allowed.includes('location') ? add('Shop', shopDraft) : null,
      compact ? null : el('button', { class: 'btn small ghost', type: 'button', onclick: () => sendDraft({ kind: allowed[0] || 'location', parent_id: place.id }) }, 'New place…')) : null,
    slot,
    groups.length ? groups.map(([k, list]) => el('div', { class: 'place-group' }, compact ? null : el('h4', {}, KINDS[k].plural),
      el('ul', { class: 'place-list' }, list.slice(0, compact ? 8 : 500).map((e) => {
        const c = placeCounts(e);
        return el('li', {}, link(e), el('span', { class: 'muted small' }, [e.fields?.type || e.fields?.size, c.people && `${c.people} people`, c.openQuests && `${c.openQuests} jobs`, c.places && `${c.places} places`].filter(Boolean).join(' · ')));
      }))))
      : el('p', { class: 'muted' }, isGm() ? `Nothing inside ${place.name} yet. Add towns, areas, taverns and shops.` : 'No known places inside.'));
}

function powersSection(place, rerender) {
  const inside = descendantsOf(place.id, ORG_KINDS);
  const linked = linkedTo(place.id, ORG_KINDS).filter((e) => !inside.includes(e));
  const slot = el('div', { class: 'preview-slot' });
  const add = (label, type) => el('button', { class: 'btn small', type: 'button', onclick: () => slot.prepend(previewBox(`${label} of ${place.name}`, () => orgDraft(place, type), 1, rerender)) }, `+ ${label}`);
  const row = (e, how) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), el('span', { class: 'muted small' }, how || e.fields?.type || e.fields?.trade || e.fields?.ancestry || ''));
  return el('section', { class: 'hub-sec' },
    isGm() ? el('div', { class: 'hub-tools' }, add('Guild', 'guild'), add('Faction', 'faction'), add('Family', 'clan'),
      pickExisting('Bring an existing faction, guild or house here…', ORG_KINDS, (x) => inside.includes(x), async (x) => { await patchEntry(x, { parent_id: place.id }); toast(`${x.name} is now based in ${place.name}`); rerender(); })) : null,
    slot,
    inside.length || linked.length ? el('ul', { class: 'entry-list' }, inside.map((e) => row(e)), linked.map((e) => row(e, (e.links.find((l) => l.id === place.id) || {}).label)))
      : el('p', { class: 'muted' }, 'No factions, guilds or houses are tied to this place yet.'));
}

function mapsSection(place) {
  const own = mapsOf(place.id);
  const pins = pinsFor(place.id);
  const inside = descendantsOf(place.id).flatMap((e) => pinsFor(e.id).map((p) => ({ ...p, e })));
  return el('section', { class: 'hub-sec' },
    own.length ? el('div', {}, el('h4', {}, `Maps of ${place.name}`), el('ul', { class: 'entry-list' }, own.map((m) => el('li', {}, el('a', { href: `#world/map/${m.id}` }, m.name), el('span', { class: 'muted small' }, `${(m.pins || []).length} pins`))))) : null,
    pins.length ? el('div', {}, el('h4', {}, 'Pinned on'), el('ul', { class: 'entry-list' }, pins.map(({ map, pin }) => el('li', {}, el('a', { href: `#world/map/${map.id}/${pin.id}` }, map.name))))) : null,
    inside.length ? el('div', {}, el('h4', {}, 'Pinned places inside'), el('ul', { class: 'entry-list' }, inside.slice(0, 40).map(({ map, pin, e }) => el('li', {}, link(e), el('a', { class: 'muted small', href: `#world/map/${map.id}/${pin.id}` }, `on ${map.name}`))))) : null,
    isGm() ? el('div', { class: 'btnrow' },
      (world.maps || []).length && !pins.length ? (world.maps || []).map((m) => el('a', { class: 'btn small', href: `#world/map/${m.id}/place:${place.id}` }, `Pin on ${m.name}`)) : null,
      el('a', { class: 'btn small ghost', href: '#world/maps' }, own.length ? 'Add another map' : `Upload a map of ${place.name}`)) : null,
    !own.length && !pins.length && !inside.length && !isGm() ? el('p', { class: 'muted' }, 'Not on any map yet.') : null);
}

// ---- market (settlements) ------------------------------------------------------------------------

const isShop = (e) => e.kind === 'location' && (e.fields?.type === 'Shop' || e.fields?.type === 'Tavern' || e.fields?.shop_type);
const townSize = (place) => (['Hamlet', 'Village', 'Town', 'City', 'Metropolis', 'Fortress', 'Outpost'].includes(place.fields?.size) ? place.fields.size : 'Town');
export const marketOf = (place) => (place?.fields?.market ? parseMarket(place.fields.market, townSize(place)) : null);

// New stock for a shop entry under its town's market.
export function restockDraft(shopEntry, town) {
  const market = marketOf(town) || rollMarket(er, { size: town ? townSize(town) : 'Town', economy: 'Stable' });
  const type = shopEntry.fields?.shop_type || (shopEntry.fields?.type === 'Tavern' ? 'Tavern & inn' : 'General store');
  const sh = generateShop(er, { type, market, ownerName: shopEntry.fields?.owner?.split(',')[0], size: market.size });
  return { shop_type: type, stock: stockText(sh) };
}

function marketSection(place, rerender) {
  const market = marketOf(place);
  const shops = descendantsOf(place.id, ['location']).filter(isShop);
  const slot = el('div', { class: 'preview-slot' });
  const ecoSel = el('select', { 'aria-label': 'Economy' }, el('option', { value: '' }, 'Random economy'), Object.keys(ECONOMIES).map((k) => el('option', { value: k }, k)));
  const typeSel = el('select', { 'aria-label': 'Shop type' }, el('option', { value: '' }, 'Any shop'), Object.keys(SHOP_TYPES).map((k) => el('option', { value: k }, k)));
  const rollMkt = async () => {
    const m = rollMarket(er, { economy: ecoSel.value || undefined, size: townSize(place) });
    try { await patchEntry(place, { fields: { market: marketText(m) } }); toast(`${place.name}: ${m.economy}`); rerender(); } catch (err) { toast(err.message, 'bad'); }
  };
  const openShop = () => {
    const m = market || rollMarket(er, { size: townSize(place) });
    let sh;
    const box = el('div', { class: 'preview card' });
    const draw = () => {
      const owner = personName(er, er.pickW(ANCESTRY_WEIGHTS));
      sh = generateShop(er, { type: typeSel.value || undefined, market: m, ownerName: owner, size: townSize(place) }); sh.ownerFull = owner;
      setKids(box, el('div', { class: 'entry-head' }, el('h4', {}, `${sh.name} · ${sh.type}`), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Close', onclick: () => box.remove() }, '✕')),
        el('p', { class: 'muted small' }, `Run by ${owner}. ${sh.items.length + sh.special.length} items.`), renderStock(stockText(sh)),
        el('div', { class: 'btnrow' }, el('button', { class: 'btn primary small', type: 'button', onclick: async () => {
          try { await createEntry({ kind: 'location', name: sh.name, parent_id: place.id, summary: `${sh.type} run by ${owner}.`, fields: { type: 'Shop', shop_type: sh.type, owner, stock: stockText(sh) } }); toast(`Opened ${sh.name}`); box.remove(); rerender(); }
          catch (err) { toast(err.message, 'bad'); }
        } }, 'Open this shop'), el('button', { class: 'btn small', type: 'button', onclick: draw }, 'Different shop'), el('button', { class: 'btn small ghost', type: 'button', onclick: () => box.remove() }, 'Discard')));
    };
    draw(); slot.prepend(box);
  };
  const restockAll = async () => {
    let n = 0;
    for (const sh of shops) { try { await patchEntry(sh, { fields: restockDraft(sh, place) }); n++; } catch (err) { toast(`${sh.name}: ${err.message}`, 'bad'); } }
    toast(`Restocked ${n} shop${n === 1 ? '' : 's'} at ${place.name}’s prices`); rerender();
  };
  return el('section', { class: 'hub-sec' },
    market ? renderMarket(market) : el('p', { class: 'muted' }, isGm() ? `${place.name} has no market yet. Roll one: its economy, inflation, shortages and surpluses set prices in every shop here.` : 'Nobody has written up the market here yet.'),
    isGm() ? el('div', { class: 'hub-tools' }, ecoSel, el('button', { class: market ? 'btn small' : 'btn primary small', type: 'button', onclick: rollMkt }, market ? 'New market conditions' : 'Roll the market'),
      typeSel, el('button', { class: 'btn primary small', type: 'button', onclick: openShop }, 'Open a shop'),
      shops.length ? el('button', { class: 'btn small ghost', type: 'button', onclick: restockAll }, `Restock all ${shops.length} at today’s prices`) : null) : null,
    slot,
    shops.length ? el('div', {}, el('h4', {}, 'Shops'), el('ul', { class: 'entry-list' }, shops.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, e.fields?.shop_type || e.fields?.type),
      e.fields?.owner ? el('span', { class: 'muted small' }, e.fields.owner) : null,
      e.parent_id !== place.id && getEntry(e.parent_id) ? el('span', { class: 'muted small' }, 'in ', link(getEntry(e.parent_id))) : null)))) : el('p', { class: 'muted small' }, 'No shops yet.'));
}

// ---- hub -----------------------------------------------------------------------------------------

export function placeHub(place, tab, overview, rerender) {
  const c = placeCounts(place);
  const counts = { people: c.people, quests: c.openQuests, places: c.places, powers: c.powers, maps: mapsOf(place.id).length + pinsFor(place.id).length, market: descendantsOf(place.id, ['location']).filter(isShop).length };
  const tabs = HUB_TABS.filter(([k]) => k !== 'market' || place.kind === 'settlement');
  const active = tabs.some(([k]) => k === tab) ? tab : 'overview';
  const panel = active === 'overview' ? overview()
    : active === 'people' ? peopleSection(place, rerender)
      : active === 'quests' ? questSection(place, rerender)
        : active === 'market' ? marketSection(place, rerender)
        : active === 'places' ? placesSection(place, rerender)
          : active === 'powers' ? powersSection(place, rerender)
            : active === 'wilds' ? wildsSection(place, rerender)
              : mapsSection(place);
  return el('div', { class: 'hub' },
    el('nav', { class: 'hub-tabs', 'aria-label': `${place.name} sections` }, tabs.map(([k, t]) => el('a', { href: `#world/e/${place.id}${k === 'overview' ? '' : `/${k}`}`, 'aria-current': k === active ? 'page' : 'false' },
      t, k !== 'overview' && counts[k] ? el('span', { class: 'count' }, counts[k]) : null))),
    el('div', { class: 'hub-panel' }, panel));
}

// Compact version for the map drawer.
export function placeDrawer(place, rerender) {
  const c = placeCounts(place);
  return el('div', { class: 'drawer-hub' },
    el('div', { class: 'drawer-stats' },
      [['people', 'People', c.people], ['quests', 'Open jobs', c.openQuests], ['places', 'Places', c.places], ['powers', 'Powers', c.powers]]
        .map(([k, t, n]) => el('a', { class: 'stat', href: `#world/e/${place.id}/${k}` }, el('span', { class: 'stat-v' }, n), el('span', { class: 'stat-l' }, t)))),
    peopleSection(place, rerender, true), questSection(place, rerender, true), PLACE_KINDS.includes(place.kind) ? placesSection(place, rerender, true) : null);
}

// ---- atlas ---------------------------------------------------------------------------------------

const atlasOpen = new Set();
export function viewAtlas() {
  const places = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind));
  const roots = places.filter((e) => !e.parent_id || !getEntry(e.parent_id) || !PLACE_KINDS.includes(getEntry(e.parent_id).kind)).sort((a, b) => PLACE_KINDS.indexOf(a.kind) - PLACE_KINDS.indexOf(b.kind) || byName(a, b));
  const filter = el('input', { type: 'search', placeholder: 'Filter places…', 'aria-label': 'Filter places' });
  const tree = el('div', { class: 'atlas' });
  const slot = el('div', { class: 'preview-slot' });
  const rerender = () => window.dispatchEvent(new Event('world:rerender'));
  function node(e, depth) {
    const kids = childrenOf(e.id, PLACE_KINDS);
    const c = placeCounts(e);
    const open = atlasOpen.has(e.id) || (depth < 1 && !atlasOpen.has(`-${e.id}`));
    const toggle = kids.length ? el('button', { class: 'tree-toggle', type: 'button', 'aria-expanded': String(open), 'aria-label': `${open ? 'Collapse' : 'Expand'} ${e.name}`, onclick: () => {
      if (open) { atlasOpen.delete(e.id); atlasOpen.add(`-${e.id}`); } else { atlasOpen.add(e.id); atlasOpen.delete(`-${e.id}`); }
      draw();
    } }, open ? '▾' : '▸') : el('span', { class: 'tree-toggle' });
    const allowed = CHILD_PLACES[e.kind] || [];
    return el('li', { 'data-name': e.name.toLowerCase() },
      el('div', { class: `tree-row k-${e.kind}` }, toggle, el('span', { class: 'tree-dot', 'aria-hidden': 'true' }), link(e), el('span', { class: 'kind-tag' }, e.fields?.type || e.fields?.size || kindLabel(e.kind)),
        el('span', { class: 'tree-counts' },
          c.people ? el('a', { href: `#world/e/${e.id}/people`, title: 'People' }, `${c.people} people`) : null,
          c.openQuests ? el('a', { href: `#world/e/${e.id}/quests`, title: 'Open jobs' }, `${c.openQuests} jobs`) : null),
        isGm() ? el('span', { class: 'tree-add' },
          allowed.includes('settlement') ? el('button', { class: 'btn small ghost', type: 'button', title: `Add a town to ${e.name}`, onclick: () => { slot.replaceChildren(previewBox(`A town in ${e.name}`, () => settlementDraft(e), 1, () => { atlasOpen.add(e.id); rerender(); })); slot.scrollIntoView({ block: 'nearest' }); } }, '+ town') : null,
          allowed.includes('area') ? el('button', { class: 'btn small ghost', type: 'button', title: `Add an area to ${e.name}`, onclick: () => { slot.replaceChildren(previewBox(`An area in ${e.name}`, () => areaDraft(e), 1, () => { atlasOpen.add(e.id); rerender(); })); slot.scrollIntoView({ block: 'nearest' }); } }, '+ area') : null,
          el('button', { class: 'btn small ghost', type: 'button', title: `Add people to ${e.name}`, onclick: () => { slot.replaceChildren(previewBox(`People of ${e.name}`, () => npcDraft(e), 3, rerender)); slot.scrollIntoView({ block: 'nearest' }); } }, '+ people')) : null),
      kids.length && open ? el('ul', {}, kids.map((k) => node(k, depth + 1))) : null);
  }
  function draw() {
    const q = filter.value.trim().toLowerCase();
    if (q) {
      const hits = places.filter((e) => e.name.toLowerCase().includes(q)).sort(byName);
      setKids(tree, hits.length ? el('ul', { class: 'tree' }, hits.map((e) => el('li', {}, el('div', { class: `tree-row k-${e.kind}` }, el('span', { class: 'tree-dot' }), link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)),
        el('span', { class: 'muted small' }, (getEntry(e.parent_id) ? ['in ', link(getEntry(e.parent_id))] : null)))))) : el('p', { class: 'muted' }, 'No places match.'));
      return;
    }
    setKids(tree, roots.length ? el('ul', { class: 'tree' }, roots.map((e) => node(e, 0))) : null);
  }
  filter.addEventListener('input', draw);
  draw();
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, 'Atlas'), el('p', {}, 'Every region, area, town and place, nested the way they sit in the world, with who lives there and how many jobs are open.')),
      isGm() ? el('div', { class: 'btnrow' }, el('a', { class: 'btn primary small', href: '#world/new/region' }, '+ Region'),
        el('button', { class: 'btn small', type: 'button', onclick: () => slot.replaceChildren(previewBox('A new area', () => areaDraft(null), 1, rerender)) }, '+ Random area')) : null),
    filter, slot,
    roots.length ? tree : notice('No places yet', isGm() ? 'Start with a region (a kingdom, a province, a wild land), then add areas and towns inside it.' : 'The GMs haven’t mapped out any places yet.'),
    nameList());
}

