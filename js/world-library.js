// Your library: short summaries of monsters, items, classes, subclasses, species, backgrounds, feats and spells
// from books your group owns. They live as entries in this world (so search, privacy and export all work), and
// the generators use them: bestiary creatures in encounters and dungeons, items in loot and shops.
// Route: #world/library[/<tab>]
import { el, toast, setKids } from './dom.js';
import { isGm, isMember } from './api.js';
import { worldEntries, createEntry, link, byName, notice } from './world-store.js';
import { KINDS, fieldApplies } from './world-schema.js';
import { parseCr } from './library.js';

const TABS = [
  ['creatures', 'Bestiary', { kind: 'creature' }],
  ['items', 'Items', { kind: 'item', sourced: true }],
  ['classes', 'Classes', { kind: 'rule', category: 'Class' }],
  ['subclasses', 'Subclasses', { kind: 'rule', category: 'Subclass' }],
  ['species', 'Species', { kind: 'rule', category: 'Species' }],
  ['backgrounds', 'Backgrounds', { kind: 'rule', category: 'Background' }],
  ['feats', 'Feats', { kind: 'rule', category: 'Feat' }],
  ['spells', 'Spells', { kind: 'rule', category: 'Spell' }],
  ['other', 'Other', { kind: 'rule', category: 'Other' }],
];

const inTab = (e, t) => e.kind === t.kind && (t.kind !== 'item' || String(e.fields?.source || '').trim()) && (!t.category || e.fields?.category === t.category);
const snippet = (t, n = 240) => { const s = String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };

function statLine(e) {
  const f = e.fields || {};
  if (e.kind === 'creature') return [f.size, f.type && f.type.toLowerCase(), f.cr && `CR ${f.cr}`, f.ac && `AC ${f.ac}`, f.hp && `${f.hp} HP`, f.speed].filter(Boolean).join(' · ');
  if (e.kind === 'item') return [f.rarity, f.type, /^(yes|requires)/i.test(f.attunement || '') ? 'attunement' : ''].filter(Boolean).join(' · ');
  if (f.category === 'Background') return ['Background', f.abilities, f.bgSkills, f.feat && `${f.feat} feat`].filter(Boolean).join(' · ');
  if (f.category === 'Feat') return [`${f.featType || 'General'} feat`, Number(f.level) ? `level ${f.level}+` : ''].filter(Boolean).join(' · ');
  if (f.category === 'Class') return ['Class', f.die && `${f.die} hit die`, f.primary, f.caster && f.caster !== 'None' ? f.caster.toLowerCase() : ''].filter(Boolean).join(' · ');
  if (f.category === 'Species') return ['Species', f.size, f.speed && `speed ${f.speed}`, Number(f.darkvision) ? `darkvision ${f.darkvision}` : '', f.like && `like ${f.like}`].filter(Boolean).join(' · ');
  return [f.category, f.class, f.level && (f.category === 'Spell' ? (f.level === '0' ? 'cantrip' : `level ${f.level}`) : `level ${f.level}`)].filter(Boolean).join(' · ');
}

const what = (e) => e.fields?.abilities || e.fields?.features || e.fields?.properties || e.summary || '';

function card(e) {
  return el('li', { class: `card lib-card${e.visibility === 'gm' ? ' is-hidden' : ''}` },
    el('div', { class: 'entry-head' }, link(e), e.fields?.source ? el('span', { class: 'tag lib-source' }, e.fields.source) : null),
    statLine(e) ? el('div', { class: 'muted small' }, statLine(e)) : null,
    what(e) ? el('p', { class: 'small' }, snippet(what(e))) : null,
    /^https:\/\/\S+$/.test(e.fields?.link || '') ? el('a', { class: 'small', href: e.fields.link, target: '_blank', rel: 'noopener' }, 'Open on D&D Beyond ↗') : null);
}

// A quick-add form shaped for each tab: just enough to know what the thing is and does.
function addForm(tabKey, t, after) {
  const gm = isGm();
  const f = (id, label, input, wide) => el('div', { class: `field${wide ? ' wide' : ''}` }, el('label', { for: id }, label), input);
  const txt = (id, ph) => el('input', { type: 'text', id, placeholder: ph || '' });
  const sel = (id, opts, v) => { const s = el('select', { id }, opts.map((o) => el('option', { value: o }, o))); if (v) s.value = v; return s; };
  const area = (id, ph) => el('textarea', { id, rows: 4, placeholder: ph });
  const kindFields = KINDS[t.kind].fields;
  const options = (k) => kindFields.find(([key]) => key === k)?.[3] || [];
  const els = { name: txt('lib-name', 'Name'), source: txt('lib-source', 'e.g. the book’s name'), link: txt('lib-link', 'https://www.dndbeyond.com/…') };
  let body;
  if (t.kind === 'creature') {
    Object.assign(els, { cr: txt('lib-cr', 'e.g. 1/2 or 5'), type: sel('lib-type', options('type'), 'Monstrosity'), size: sel('lib-size', options('size'), 'Medium'),
      terrain: txt('lib-terrain', 'e.g. swamp, forest (blank = anywhere)'), ac: txt('lib-ac'), hp: txt('lib-hp'), speed: txt('lib-speed', 'e.g. 30 ft, fly 60 ft'),
      abilities: area('lib-abilities', 'Its key abilities and attacks, in short: what it does in a fight and what makes it dangerous.') });
    body = [f('lib-cr', 'Challenge rating', els.cr), f('lib-type', 'Type', els.type), f('lib-size', 'Size', els.size), f('lib-terrain', 'Where it’s found', els.terrain),
      f('lib-ac', 'AC', els.ac), f('lib-hp', 'HP', els.hp), f('lib-speed', 'Speed', els.speed), f('lib-abilities', 'What it does', els.abilities, true)];
  } else if (t.kind === 'item') {
    Object.assign(els, { rarity: sel('lib-rarity', options('rarity').filter((r) => r !== 'Mundane'), 'Uncommon'), type: txt('lib-itype', 'e.g. Wondrous item, Ring, Weapon (longsword)'),
      attunement: sel('lib-att', ['No', 'Requires attunement'], 'No'), properties: area('lib-props', 'What it does, in short.') });
    body = [f('lib-rarity', 'Rarity', els.rarity), f('lib-itype', 'Type', els.type), f('lib-att', 'Attunement', els.attunement), f('lib-props', 'What it does', els.properties, true)];
  } else {
    Object.assign(els, { cls: txt('lib-class', t.category === 'Spell' ? 'e.g. Wizard, Sorcerer' : 'e.g. Fighter'), level: txt('lib-level', t.category === 'Spell' ? '0 for a cantrip' : ''), features: area('lib-feat', 'What it gives, in short: the key features and when you get them.') });
    if (t.category === 'Species') {
      Object.assign(els, { size: sel('lib-ssize', options('size'), 'Medium'), speed: txt('lib-sspeed', '30'), darkvision: txt('lib-dv', '0 if none'), like: sel('lib-like', options('like'), 'Human') });
      els.features.placeholder = 'One trait per line, like “Storm Sense: You can feel weather coming.” The Character Forge lists each as a species trait.';
    }
    // Classes, backgrounds and feats: every field the Character Forge reads, from the schema, with everyday defaults.
    const classFields = kindFields.filter((fd) => fd[4]?.only?.includes(t.category) && ['Class', 'Background', 'Feat'].includes(t.category) && !['class', 'level'].includes(fd[0]))
      .sort((a, b) => (a[0] === 'gear') - (b[0] === 'gear'));
    const CLASS_DEFAULTS = { die: 'd8', primary: 'Str', skillCount: '2', wears: 'No armor', caster: 'None', spellAbility: 'Int', sublevel: '3', featType: 'General' };
    const HINTS = t.category === 'Background'
      ? { abilities: 'Three, e.g. Dex, Wis, Con', bgSkills: 'Two, e.g. Survival, Nature', tool: 'e.g. Cartographer’s Tools', feat: 'e.g. Alert, or a feat from your library', gear: 'What they start with' }
      : { saves: 'e.g. Str, Con', skills: 'e.g. Athletics, Perception, Survival (blank = any)', armorProf: 'e.g. Light and medium armor, shields', weaponProf: 'e.g. Simple and martial weapons',
        weapon: 'e.g. Greatsword 2d6', gear: 'What they start with' };
    for (const [k, , type, opts] of classFields) els[k] = type === 'select' ? sel(`lib-c-${k}`, opts, CLASS_DEFAULTS[k]) : Object.assign(txt(`lib-c-${k}`, HINTS[k]), { value: CLASS_DEFAULTS[k] || '' });
    if (t.category === 'Class') {
      els.features.rows = 8;
      els.features.placeholder = 'One level per line, like\n1: Rage, Unarmored Defense\n2: Reckless Attack: Advantage on Strength attacks; attacks against you have it too.\n3: Subclass\n5: Extra Attack\nAbility Score Improvements at 4, 8, 12 and 16 are added unless you list your own.';
    }
    body = [classFields.map(([k, l]) => f(`lib-c-${k}`, l, els[k])), t.category === 'Species' ? [f('lib-ssize', 'Size', els.size), f('lib-sspeed', 'Speed', els.speed), f('lib-dv', 'Darkvision', els.darkvision), f('lib-like', 'Names, age and height like', els.like)] : null,
      ['Subclass', 'Spell'].includes(t.category) ? f('lib-class', t.category === 'Spell' ? 'Classes' : 'Class', els.cls) : null,
      ['Spell', 'Feat', 'Subclass'].includes(t.category) ? f('lib-level', { Spell: 'Spell level', Feat: 'Minimum level (blank = any)', Subclass: 'Level' }[t.category], els.level) : null, f('lib-feat', t.category === 'Class' ? 'Features by level' : 'What it gives', els.features, true)];
  }
  const hide = el('input', { type: 'checkbox', id: 'lib-hide', checked: t.kind === 'creature' ? true : null });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card edit-form lib-form' },
    el('h3', {}, `Add to ${TABS.find(([k]) => k === tabKey)[1].toLowerCase()}`),
    el('div', { class: 'edit-fields' }, f('lib-name', 'Name', els.name), ...body.flat().filter(Boolean), f('lib-source', 'Source book', els.source), f('lib-link', 'D&D Beyond link (optional)', els.link)),
    gm ? el('label', { class: 'check' }, hide, ' Hide from players (GM prep)') : el('p', { class: 'muted small' }, 'GMs will see this as a suggestion and can approve it.'),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Add')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = els.name.value.trim(); if (!name) { els.name.focus(); return; }
    const v = (k) => els[k]?.value?.trim() || '';
    if (t.kind === 'creature' && v('cr') && parseCr(v('cr')) == null) { status.textContent = 'Challenge rating should look like 1/4, 2 or 13.'; status.className = 'form-status error'; return; }
    if (v('link') && !/^https:\/\//.test(v('link'))) { status.textContent = 'Links start with https://'; status.className = 'form-status error'; return; }
    const fields = t.kind === 'creature' ? { cr: v('cr'), type: v('type'), size: v('size'), terrain: v('terrain'), ac: v('ac'), hp: v('hp'), speed: v('speed'), abilities: v('abilities') }
      : t.kind === 'item' ? { rarity: v('rarity'), type: v('type') || 'Wondrous item', attunement: v('attunement'), properties: v('properties') }
        : { category: t.category, class: v('cls'), level: v('level'), features: v('features'), ...(t.category === 'Species' ? { size: v('size'), speed: v('speed'), darkvision: v('darkvision'), like: v('like') } : {}),
          ...(['Class', 'Background', 'Feat'].includes(t.category) ? Object.fromEntries(KINDS.rule.fields.filter((fd) => fd[4]?.only?.includes(t.category) && !['class', 'level'].includes(fd[0])).map(([k]) => [k, v(k)])) : {}) };
    if (t.category === 'Class' && fields.caster === 'None') { fields.spellAbility = ''; fields.spellsLike = ''; }
    fields.source = v('source') || 'My books'; fields.link = v('link');
    try {
      await createEntry({ kind: t.kind, name, fields, visibility: gm && hide.checked ? 'gm' : 'all', summary: snippet(fields.abilities || fields.properties || fields.features, 300) });
      toast(gm ? `${name} added to your library` : `${name} suggested to the GMs`);
      after();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

let query = '';
export function viewLibrary(tabKey, rerender) {
  const tab = TABS.find(([k]) => k === tabKey) || TABS[0];
  const [key, label, t] = tab;
  const all = worldEntries();
  const counts = Object.fromEntries(TABS.map(([k, , tt]) => [k, all.filter((e) => inTab(e, tt)).length]));
  const list = all.filter((e) => inTab(e, t)).sort(byName);
  const results = el('div');
  const search = el('input', { type: 'search', placeholder: `Search ${label.toLowerCase()}…`, 'aria-label': `Search ${label.toLowerCase()}`, value: query });
  const draw = () => {
    const q = search.value.trim().toLowerCase(); query = search.value;
    const shown = q ? list.filter((e) => `${e.name} ${statLine(e)} ${what(e)} ${e.fields?.source || ''}`.toLowerCase().includes(q)) : list;
    setKids(results, shown.length ? el('ul', { class: 'lib-grid' }, shown.map(card))
      : notice(list.length ? 'No matches' : `No ${label.toLowerCase()} yet`, list.length ? 'Try another word.' : isMember() ? 'Add the first one with the form.' : 'The GMs haven’t added any yet.'));
  };
  search.addEventListener('input', draw);
  draw();
  return el('div', { class: 'w-view library-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Your library'),
      el('p', {}, 'Short notes on monsters, items, classes, species and more from the books your group owns: enough to know what they are and what they do. Bestiary creatures turn up in encounters and dungeons; items in loot and shops; classes, subclasses and species in the Character Forge.')),
    el('nav', { class: 'subtabs', 'aria-label': 'Library sections' }, TABS.map(([k, l]) => el('a', { href: `#world/library/${k}`, 'aria-current': k === key ? 'page' : 'false' }, l, counts[k] ? el('span', { class: 'count' }, ` ${counts[k]}`) : null))),
    key === 'spells' && list.length ? el('p', { class: 'small' }, el('a', { href: '#world/spellcards/library' }, 'Print these as spell cards')) : null,
    el('div', { class: 'lib-layout' }, el('div', { class: 'lib-list' }, search, results), isMember() ? addForm(key, t, rerender) : null));
}
