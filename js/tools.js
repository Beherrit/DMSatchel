// The table tools: NPCs, quests, names, places, organizations, descriptions, rumors and loot.
// Each tool mounts into its own panel and can save to the notebook or send a draft to the world.

import { makeRng } from './rng.js';
import { $, el, cap, fmt, copyText, fresh, traitList } from './dom.js';
import { personName, ANCESTRY_WEIGHTS, ANCESTRIES, townName, tavernName, shopName, shipName, groupName, lastName } from './names.js';
import * as D from './tables.js';
import { saveNote } from './notebook.js';

const r = makeRng(Date.now());
const pick = r.pick, pickW = r.pickW, d = r.dice, R = r.int;
const aOrAn = (s) => (/^[aeiou]/i.test(s) && !/^(uni|one)/i.test(s) ? 'an ' : 'a ') + s;
const randomAncestry = () => pickW(ANCESTRY_WEIGHTS);
const pname = (a) => personName(r, a || randomAncestry());

// Hand a draft entry to the world builder (world-ui.js listens).
export const sendToWorld = (entry) => window.dispatchEvent(new CustomEvent('world:draft', { detail: entry }));

function actions({ kind, title, text, world }) {
  return el('div', { class: 'btnrow' },
    el('button', { class: 'btn', type: 'button', onclick: () => saveNote(kind, title(), text()) }, 'Save to notebook'),
    el('button', { class: 'btn', type: 'button', onclick: () => copyText(text()) }, 'Copy'),
    world ? el('button', { class: 'btn world', type: 'button', onclick: () => sendToWorld(world()) }, 'Add to world') : null);
}

function panelHead(title, blurb) {
  return el('div', { class: 'panel-head' }, el('h2', {}, title), el('p', {}, blurb));
}
function select(id, label, options, value) {
  const s = el('select', { id }, options.map(([v, t]) => el('option', { value: v }, t)));
  if (value) s.value = value;
  return el('div', { class: 'field' }, el('label', { for: id }, label), s);
}
function seg(id, label, options, onChange) {
  const g = el('div', { class: 'seg', role: 'group', 'aria-label': label, id }, options.map(([v, t], i) => el('button', { type: 'button', 'aria-pressed': String(i === 0), 'data-v': v }, t)));
  g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; for (const x of g.children) x.setAttribute('aria-pressed', String(x === b)); onChange(b.dataset.v); });
  return g;
}
const ancestryOptions = () => [['any', 'Any'], ...ANCESTRIES.map((a) => [a, a])];

// ---- NPCs --------------------------------------------------------------------------------------

const NPC_LABELS = { look: 'Look', personality: 'Personality', mannerism: 'Mannerism', voice: 'Voice', want: 'Wants', secret: 'Secret', attitude: 'Attitude' };
function mountNpc(root) {
  let npc;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('NPC Generator', 'Roll a whole character, or reroll a single line with ↻. Save the keepers, or add them to the shared world.'),
    el('div', { class: 'controls' }, select('npc-anc', 'Ancestry', ancestryOptions()),
      select('npc-role', 'Role', [['any', 'Any'], ['common', 'Commoner'], ['trade', 'Trade & craft'], ['shady', 'Shady'], ['authority', 'Authority'], ['faith', 'Faith & magic']]),
      el('button', { class: 'btn primary', type: 'button', onclick: () => roll() }, 'New NPC')), card);
  const rollField = (f) => {
    if (f === 'name') npc.name = pname(npc.anc);
    else if (f === 'job') npc.job = pick(D.ROLES[npc.roleGroup]);
    else npc[f] = pick(D.NPC[f]);
  };
  const text = () => `${npc.name} (${npc.anc} ${npc.job})\n${Object.entries(NPC_LABELS).map(([k, l]) => `${l}: ${cap(npc[k])}`).join('\n')}`;
  function roll() {
    const a = $('#npc-anc').value, g = $('#npc-role').value;
    npc = { anc: a === 'any' ? randomAncestry() : a, roleGroup: g === 'any' ? pick(Object.keys(D.ROLES)) : g };
    ['name', 'job', ...Object.keys(NPC_LABELS)].forEach(rollField);
    render(true);
  }
  function render(isNew) {
    card.replaceChildren(
      el('div', { class: 'eyebrow' }, `${npc.anc} · ${cap(npc.job)}`),
      el('div', { class: 'entry-head' }, el('h3', { class: 'card-title' }, npc.name), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Reroll name', onclick: () => { rollField('name'); render(); } }, '↻')),
      traitList(Object.entries(NPC_LABELS).map(([k, l]) => [k, l, cap(npc[k]), () => { rollField(k); render(); }])),
      actions({ kind: 'NPC', title: () => npc.name, text, world: () => ({ kind: 'npc', name: npc.name, summary: `${cap(npc.job)}. ${cap(npc.personality)}.`,
        fields: { ancestry: npc.anc, role: cap(npc.job), status: 'Alive', appearance: cap(npc.look), personality: `${cap(npc.personality)}. ${cap(npc.mannerism)}.`, voice: cap(npc.voice), wants: cap(npc.want) },
        secret: cap(npc.secret) + '.', body: `Attitude toward the party: ${npc.attitude}.` }) }));
    if (isNew) fresh(card);
  }
  roll();
}

// ---- Quests ------------------------------------------------------------------------------------

const Q_LABELS = { patron: 'Patron', goal: 'The job', antagonist: 'Opposition', complication: 'Complication', twist: 'Twist', reward: 'Reward' };
function magicItem(tier) { const rr = pickW(D.RARITY_W[tier]); return { r: rr, name: pick(D.MAGIC[rr]).replace('{weapon}', pick(D.WEAPONS)).replace('{armor}', pick(D.ARMORS)) }; }
function mountQuest(root) {
  let q;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('Quest Builder', 'Who asks, what they want, what’s really going on, and what it pays. Reroll any part you don’t like.'),
    el('div', { class: 'controls' }, select('q-tier', 'Party level', [['0', 'Levels 1–4'], ['1', 'Levels 5–10'], ['2', 'Levels 11–16'], ['3', 'Levels 17–20']]),
      el('button', { class: 'btn primary', type: 'button', onclick: () => roll() }, 'New quest')), card);
  $('#q-tier', root).addEventListener('change', () => { rollField('reward'); render(); });
  function rollField(f) {
    const tier = +$('#q-tier').value;
    if (f === 'goal') { for (const k of ['item', 'person', 'place', 'dest', 'mystery', 'monster']) q[k] = pick(D.Q[k]); q.goalFn = R(D.Q.goal.length); }
    else if (f === 'reward') {
      const [lo, hi] = D.REWARD_GP[tier]; const gp = Math.round((lo + r.next() * (hi - lo)) / 10) * 10;
      const extra = r.chance(0.5) ? `, plus ${aOrAn(magicItem(tier).name)}` : pick([', plus a favor owed by the patron', ', plus free lodging in town for life', ', plus a deed to a run-down property', ', plus an introduction at court', '']);
      q.reward = `${fmt(gp)} gp${extra}`;
    } else q[f] = pick(D.Q[f]);
  }
  const vals = () => ({ patron: cap(q.patron), goal: D.Q.goal[q.goalFn](q), antagonist: cap(q.antagonist), complication: q.complication, twist: q.twist, reward: q.reward });
  const text = () => { const v = vals(); return `${q.title}\n${Object.entries(Q_LABELS).map(([k, l]) => `${l}: ${v[k]}`).join('\n')}`; };
  function roll() {
    q = {}; Object.keys(Q_LABELS).forEach(rollField);
    q.title = pick(['The ', 'The ', '']) + pick(['Silent', 'Drowned', 'Gilded', 'Hollow', 'Ashen', 'Broken', 'Last', 'Crimson', 'Whispering', 'Forgotten']) + ' ' + pick(['Bell', 'Crown', 'Debt', 'Road', 'Lantern', 'Oath', 'Harvest', 'Tide', 'Door', 'Heir']);
    render(true);
  }
  function render(isNew) {
    const v = vals();
    card.replaceChildren(el('div', { class: 'eyebrow' }, $('#q-tier').selectedOptions[0].text), el('h3', { class: 'card-title' }, q.title),
      traitList(Object.entries(Q_LABELS).map(([k, l]) => [k, l, v[k], () => { rollField(k); render(); }])),
      actions({ kind: 'Quest', title: () => q.title, text, world: () => ({ kind: 'quest', name: q.title, summary: v.goal,
        fields: { status: 'Available', patron: v.patron, reward: v.reward, stakes: `Opposition: ${v.antagonist}. Complication: ${v.complication}` }, secret: `Twist: ${v.twist}` }) }));
    if (isNew) fresh(card);
  }
  roll();
}

// ---- Names -------------------------------------------------------------------------------------

function mountNames(root) {
  const out = el('div', { class: 'names' });
  const ancWrap = select('n-anc', 'Ancestry', ancestryOptions());
  root.append(panelHead('Name Generator', 'Ten at a time. Save the keepers so you remember who the party met.'),
    el('div', { class: 'controls' }, select('n-kind', 'Kind', [['people', 'People'], ['towns', 'Towns & villages'], ['taverns', 'Taverns & inns'], ['shops', 'Shops'], ['ships', 'Ships'], ['groups', 'Guilds & factions']]), ancWrap,
      select('n-gender', 'Names for', [['any', 'Anyone'], ['f', 'Women'], ['m', 'Men']]),
      el('button', { class: 'btn primary', type: 'button', onclick: () => gen() }, 'Generate')), out);
  $('#n-kind', root).addEventListener('change', () => gen());
  function gen() {
    const kind = $('#n-kind').value, anc = $('#n-anc').value, g = $('#n-gender').value;
    ancWrap.hidden = kind !== 'people'; $('#n-gender').parentElement.hidden = kind !== 'people';
    out.replaceChildren();
    const seen = new Set();
    for (let i = 0, tries = 0; i < 10 && tries < 80; tries++) {
      let name, sub = '', world = null;
      if (kind === 'people') { const a = anc === 'any' ? randomAncestry() : anc; name = personName(r, a, g); sub = a; world = { kind: 'npc', name, fields: { ancestry: a, status: 'Alive' } }; }
      else if (kind === 'towns') { name = townName(r); sub = pick(['hamlet', 'village', 'village', 'town', 'market town', 'city', 'fortress town', 'port']); world = { kind: 'settlement', name, fields: { size: cap(sub.split(' ').pop()) === 'Port' ? 'Town' : ['Hamlet', 'Village', 'Town', 'City'].find((s) => sub.toLowerCase().includes(s.toLowerCase())) || 'Town' } }; }
      else if (kind === 'taverns') { name = tavernName(r); sub = pick(['tavern', 'inn', 'alehouse', 'roadhouse', 'inn & stables']); world = { kind: 'location', name, fields: { type: 'Tavern' } }; }
      else if (kind === 'shops') { name = shopName(r); sub = 'shop'; world = { kind: 'location', name, fields: { type: 'Shop' } }; }
      else if (kind === 'ships') { name = shipName(r); sub = pick(['caravel', 'cog', 'galleon', 'fishing sloop', 'river barge', 'smuggler’s cutter']); world = { kind: 'item', name, fields: { type: `Ship (${sub})`, rarity: 'Mundane' } }; }
      else { name = groupName(r); sub = pick(['secret society', 'merchant guild', 'knightly order', 'thieves’ guild', 'scholars', 'cult', 'mercenary company']); world = { kind: /guild/.test(sub) ? 'guild' : 'faction', name }; }
      if (seen.has(name)) continue; seen.add(name); i++;
      out.append(el('div', { class: 'name' }, el('span', {}, name, el('small', {}, sub)), el('span', { class: 'name-actions' },
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Save ${name}`, onclick: () => saveNote('Name', name, cap(sub)) }, 'Save'),
        el('button', { class: 'btn small ghost world', type: 'button', 'aria-label': `Add ${name} to world`, onclick: () => sendToWorld(world) }, '+ World'))));
    }
    fresh(out);
  }
  gen();
}

// ---- Places ------------------------------------------------------------------------------------

function mountPlaces(root) {
  let type = 'town', p;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('Places', 'A settlement, a tavern or a shop, with an owner, a mood and something going on.'),
    el('div', { class: 'controls' }, seg('p-type', 'Place type', [['town', 'Settlement'], ['tavern', 'Tavern'], ['shop', 'Shop']], (v) => { type = v; roll(); render(true); }),
      el('button', { class: 'btn primary', type: 'button', onclick: () => { roll(); render(true); } }, 'Generate')), card);
  function roll(f) {
    if (!f) p = { type };
    const all = !f;
    if (type === 'town') {
      if (all || f === 'name') p.name = townName(r);
      if (all || f === 'size') p.size = pick(D.TOWN.size);
      if (all || f === 'known') p.known = pick(D.TOWN.known);
      if (all || f === 'leader') p.leader = pick(D.TOWN.leader);
      if (all || f === 'problem') p.problem = pick(D.TOWN.problem);
      if (all || f === 'spots') p.spots = r.sample(D.TOWN.spots, 3).join('; ');
      if (all || f === 'tavern') p.tavern = tavernName(r);
    } else if (type === 'tavern') {
      if (all || f === 'name') p.name = tavernName(r);
      if (all || f === 'owner') { const a = randomAncestry(); p.owner = `${pname(a)}, ${a.toLowerCase()}, ${pick(D.NPC.personality)}`; }
      if (all || f === 'quality') p.quality = pick(D.TAVERN.quality);
      if (all || f === 'special') p.special = pick(D.TAVERN.special);
      if (all || f === 'vibe') p.vibe = pick(D.TAVERN.vibe);
      if (all || f === 'rumor') p.rumor = pick(D.TABLES.rumor.items);
    } else {
      if (all || f === 'owner') { const a = randomAncestry(); p.ownerName = pname(a); p.owner = `${p.ownerName}, ${a.toLowerCase()}`; p.name = shopName(r, p.ownerName); }
      if (all || f === 'kind') p.kind = pick(Object.keys(D.SHOP.type));
      if (all || f === 'quirk') p.quirk = pick(D.SHOP.quirk);
      if (all || f === 'kind' || f === 'stock') p.stock = r.sample(D.SHOP.type[p.kind], 5);
    }
  }
  const rows = () => (p.type === 'town'
    ? [['size', 'Size', `${p.size[0]} · ${p.size[1]}`], ['known', 'Known for', cap(p.known)], ['leader', 'Led by', cap(p.leader)], ['problem', 'Trouble', cap(p.problem)], ['spots', 'Landmarks', cap(p.spots)], ['tavern', 'Tavern', p.tavern]]
    : p.type === 'tavern'
      ? [['owner', 'Owner', p.owner], ['quality', 'Quality', `${p.quality[0]} · ${p.quality[1]}`], ['special', 'House special', cap(p.special)], ['vibe', 'Tonight', cap(p.vibe)], ['rumor', 'Overheard', p.rumor]]
      : [['owner', 'Owner', p.owner], ['kind', 'Type', p.kind], ['quirk', 'Quirk', `The owner ${p.quirk}.`]]);
  const text = () => `${p.name}\n${rows().map(([, l, v]) => `${l}: ${v}`).join('\n')}${p.type === 'shop' ? `\nFor sale:\n${p.stock.map(([n, c]) => `  ${n} — ${c}`).join('\n')}` : ''}`;
  const world = () => (p.type === 'town'
    ? { kind: 'settlement', name: p.name, summary: `${p.size[0]} known for ${p.known}.`, fields: { size: p.size[0] === 'Hamlet' ? 'Hamlet' : p.size[0], population: p.size[1], ruler: cap(p.leader), known_for: cap(p.known), trouble: cap(p.problem), landmarks: `${cap(p.spots)}; ${p.tavern}` } }
    : p.type === 'tavern'
      ? { kind: 'location', name: p.name, summary: `${p.quality[0]} tavern. House special: ${p.special}.`, fields: { type: 'Tavern', owner: p.owner, features: `${cap(p.vibe)}. Prices: ${p.quality[1]}.` }, body: `Overheard: ${p.rumor}` }
      : { kind: 'location', name: p.name, summary: `${p.kind}. The owner ${p.quirk}.`, fields: { type: 'Shop', owner: p.owner, features: p.stock.map(([n, c]) => `${n} (${c})`).join('; ') } });
  function render(isNew) {
    const kindLabel = { town: 'Settlement', tavern: 'Tavern', shop: 'Shop' }[p.type];
    card.replaceChildren(el('div', { class: 'eyebrow' }, kindLabel),
      el('div', { class: 'entry-head' }, el('h3', { class: 'card-title' }, p.name), p.type !== 'shop' ? el('button', { class: 'reroll', type: 'button', 'aria-label': 'Reroll name', onclick: () => { roll('name'); render(); } }, '↻') : null),
      traitList(rows().map(([k, l, v]) => [k, l, v, () => { roll(k); render(); }])),
      p.type === 'shop' ? el('div', { class: 'eyebrow' }, 'For sale') : null,
      p.type === 'shop' ? el('ul', { class: 'loot-list' }, p.stock.map(([n, c]) => el('li', {}, el('span', {}, n), el('span', { class: 'v' }, c)))) : null,
      actions({ kind: kindLabel, title: () => p.name, text, world }));
    if (isNew) fresh(card);
  }
  roll(); render();
}

// ---- Organizations -----------------------------------------------------------------------------

function mountOrgs(root) {
  let type = 'faction', o;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('Factions, Guilds & Clans', 'Powers that want things. Roll one, reroll any line, then add it to the shared world so every GM can use it.'),
    el('div', { class: 'controls' }, seg('o-type', 'Organization type', [['faction', 'Faction'], ['guild', 'Guild'], ['clan', 'Clan / House']], (v) => { type = v; roll(); render(true); }),
      el('button', { class: 'btn primary', type: 'button', onclick: () => { roll(); render(true); } }, 'Generate')), card);
  const T = D.ORGS;
  const nameFrom = (tpl, extra = {}) => tpl.replace('{Adj}', pick(T.faction.adj)).replace('{Noun}', pick(T.faction.noun)).replace('{Surname}', extra.surname || lastName(r, 'Human')).replace('{Trade}', extra.trade || '').replace('{Town}', townName(r));
  function roll(f) {
    const all = !f; if (all) o = { type };
    if (type === 'faction') {
      if (all || f === 'kind') o.kind = pick(T.faction.types);
      if (all || f === 'kind' || f === 'name') o.name = nameFrom(pick(T.faction.names[o.kind]));
      for (const [k, list] of [['leader', T.faction.leaders], ['goal', T.faction.goals], ['methods', T.faction.methods], ['resources', T.faction.resources], ['symbol', T.faction.symbols], ['motto', T.faction.mottos], ['secret', T.faction.secrets], ['ranks', T.faction.ranks]]) if (all || f === k) o[k] = pick(list);
      if (all || f === 'hq') o.hq = `${pick(['a fortified manor in', 'the cellars beneath', 'a temple in', 'a counting-house in', 'a ship anchored off', 'a tower above', 'an abandoned mine near'])} ${townName(r)}`;
    } else if (type === 'guild') {
      if (all || f === 'trade') o.trade = pick(T.guild.trades);
      if (all || f === 'trade' || f === 'name') o.name = nameFrom(pick(T.guild.names), { trade: o.trade });
      if (all || f === 'leader') o.leader = `${pname()}, ${pick(T.guild.leaders)}`;
      for (const [k, list] of [['services', T.guild.services], ['dues', T.guild.dues], ['quirk', T.guild.quirks], ['ranks', T.faction.ranks]]) if (all || f === k) o[k] = pick(list);
      if (all || f === 'hall') o.hall = `${pick(['a timber-framed hall on', 'a stone guildhall facing', 'three floors above', 'a converted chapel on'])} the ${pick(['market square', 'river', 'old gate', 'harbor', 'high street'])} in ${townName(r)}`;
    } else {
      if (all || f === 'people') o.people = pick(T.clan.peoples);
      if (all || f === 'people' || f === 'name') { o.surname = lastName(r, o.people).replace(/^(the |of )/i, '') || lastName(r, 'Human'); o.name = nameFrom(pick(T.clan.names[o.people] || T.clan.names.other), { surname: o.surname }); }
      if (all || f === 'head') o.head = `${personName(r, o.people)}, ${pick(['the stern matriarch', 'a young heir under pressure', 'a war-scarred patriarch', 'a scheming regent', 'an elder who is losing their memory', 'a beloved, reckless lord'])}`;
      for (const [k, list] of [['seat', T.clan.seats], ['tradition', T.clan.traditions], ['feud', T.clan.feuds], ['heraldry', T.clan.heraldry], ['motto', T.clan.mottos]]) if (all || f === k) o[k] = pick(list);
    }
  }
  const rows = () => (o.type === 'faction'
    ? [['kind', 'Type', o.kind], ['leader', 'Leader', cap(o.leader)], ['hq', 'Headquarters', cap(o.hq)], ['goal', 'Goal', `To ${o.goal}.`], ['methods', 'Methods', cap(o.methods)], ['resources', 'Resources', cap(o.resources)], ['symbol', 'Symbol', cap(o.symbol)], ['motto', 'Motto', o.motto], ['ranks', 'Ranks', o.ranks], ['secret', 'Secret', o.secret]]
    : o.type === 'guild'
      ? [['trade', 'Trade', o.trade], ['leader', 'Guildmaster', o.leader], ['hall', 'Guildhall', cap(o.hall)], ['services', 'Offers members', cap(o.services)], ['dues', 'Dues', cap(o.dues)], ['ranks', 'Ranks', o.ranks], ['quirk', 'Secret or quirk', o.quirk]]
      : [['people', 'People', o.people], ['head', 'Head of the family', o.head], ['seat', 'Seat', cap(o.seat)], ['heraldry', 'Heraldry', cap(o.heraldry)], ['motto', 'Motto', o.motto], ['tradition', 'Tradition', o.tradition], ['feud', 'Feuds & alliances', cap(o.feud)]]);
  const text = () => `${o.name}\n${rows().map(([, l, v]) => `${l}: ${v}`).join('\n')}`;
  const world = () => (o.type === 'faction'
    ? { kind: 'faction', name: o.name, summary: `${o.kind} faction that wants to ${o.goal}.`, fields: { type: o.kind, leader: cap(o.leader), headquarters: cap(o.hq), goals: `To ${o.goal}.`, methods: cap(o.methods), resources: cap(o.resources), symbol: cap(o.symbol), motto: o.motto, ranks: o.ranks }, secret: o.secret }
    : o.type === 'guild'
      ? { kind: 'guild', name: o.name, summary: `The guild of ${o.trade.toLowerCase()}.`, fields: { trade: o.trade, leader: o.leader, hall: cap(o.hall), services: cap(o.services), dues: cap(o.dues), ranks: o.ranks }, secret: o.quirk }
      : { kind: 'clan', name: o.name, summary: `${o.people} family seated at ${o.seat}.`, fields: { ancestry: o.people, head: o.head, seat: cap(o.seat), heraldry: cap(o.heraldry), motto: o.motto, traditions: o.tradition, feuds: cap(o.feud) } });
  function render(isNew) {
    card.replaceChildren(el('div', { class: 'eyebrow' }, { faction: 'Faction', guild: 'Guild', clan: 'Clan / House' }[o.type]),
      el('div', { class: 'entry-head' }, el('h3', { class: 'card-title' }, o.name), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Reroll name', onclick: () => { roll('name'); render(); } }, '↻')),
      traitList(rows().map(([k, l, v]) => [k, l, v, () => { roll(k); render(); }])),
      actions({ kind: 'Organization', title: () => o.name, text, world }));
    if (isNew) fresh(card);
  }
  roll(); render();
}

// ---- Descriptions ------------------------------------------------------------------------------

const D_LABELS = { see: 'You see', hear: 'You hear', smell: 'You smell', feel: 'You feel' };
function mountDescribe(root) {
  let ds;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('Descriptions', 'Sights, sounds, smells and the feel of a place, rolled fresh each time. Read them straight off the page.'),
    el('div', { class: 'controls' }, select('d-env', 'Setting', Object.keys(D.ENV).map((k) => [k, k])), select('d-time', 'Time', ['Dawn', 'Midday', 'Dusk', 'Night'].map((t) => [t, t]), 'Dusk'),
      el('button', { class: 'btn primary', type: 'button', onclick: () => { roll(); render(true); } }, 'Describe')), card);
  $('#d-env', root).addEventListener('change', () => { roll(); render(true); });
  $('#d-time', root).addEventListener('change', () => { ds.time = $('#d-time').value; render(); });
  function roll(f) {
    const e = D.ENV[$('#d-env').value];
    if (!f) ds = { env: $('#d-env').value };
    for (const k of Object.keys(D_LABELS)) if (!f || f === k) ds[k] = pick(e[k]);
    ds.time = $('#d-time').value;
  }
  const text = () => `${ds.env}, ${ds.time.toLowerCase()} (${D.TIME_NOTE[ds.time]})\n${Object.entries(D_LABELS).map(([k, l]) => `${l}: ${ds[k]}`).join('\n')}`;
  function render(isNew) {
    card.replaceChildren(el('div', { class: 'eyebrow' }, `${ds.env} · ${ds.time}`), el('p', { class: 'card-sub' }, `${cap(D.TIME_NOTE[ds.time])}.`),
      traitList(Object.entries(D_LABELS).map(([k, l]) => [k, l, el('span', { class: 'flavor' }, `${cap(ds[k])}.`), () => { roll(k); render(); }])),
      el('p', { class: 'readaloud' }, `${cap(D.TIME_NOTE[ds.time])}. You see ${ds.see}. You hear ${ds.hear}, and the air smells of ${ds.smell}. ${cap(ds.feel)}.`),
      actions({ kind: 'Description', title: () => `${ds.env} at ${ds.time.toLowerCase()}`, text }));
    if (isNew) fresh(card);
  }
  roll(); render();
}

// ---- Rumors & hooks ----------------------------------------------------------------------------

function mountHooks(root) {
  const feed = el('div', { class: 'feed' });
  const btn = (key, label) => el('button', { class: 'btn primary', type: 'button', onclick: () => rollTable(key) }, label);
  root.append(panelHead('Rumors & Hooks', 'Overheard gossip, adventure seeds, social complications and odd trinkets for pockets and treasure piles.'),
    el('div', { class: 'btnrow' }, btn('rumor', 'Tavern rumor (d20)'), btn('hook', 'Plot hook (d20)'), btn('trinket', 'Trinket (d20)'), btn('complication', 'Social complication (d12)'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => feed.replaceChildren() }, 'Clear')), feed);
  function rollTable(key) {
    const t = D.TABLES[key]; const n = 1 + R(t.die); const text = t.items[(n - 1) % t.items.length];
    const short = text.length > 70 ? `${text.slice(0, 68).trim()}…` : text;
    const world = key === 'hook' ? { kind: 'quest', name: short.replace(/^“|”$/g, ''), summary: text, fields: { status: 'Rumor' } }
      : key === 'rumor' ? { kind: 'lore', name: short.replace(/^“|”$/g, ''), summary: text, fields: { category: 'Other', source: 'Tavern gossip' } }
        : key === 'trinket' ? { kind: 'item', name: short.replace(/\.$/, ''), summary: text, fields: { rarity: 'Mundane', type: 'Trinket' } } : null;
    feed.prepend(el('div', { class: 'entry fresh' },
      el('div', { class: 'entry-head' }, el('span', { class: 'eyebrow' }, t.label), el('span', { class: 'roll' }, `d${t.die} → ${n}`)),
      el('p', { class: 'flavor' }, text),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn small', type: 'button', onclick: () => saveNote(t.label, short, text) }, 'Save'),
        el('button', { class: 'btn small', type: 'button', onclick: () => copyText(text) }, 'Copy'),
        world ? el('button', { class: 'btn small world', type: 'button', onclick: () => sendToWorld(world) }, 'Add to world') : null)));
  }
  rollTable('hook'); rollTable('rumor');
}

// ---- Loot --------------------------------------------------------------------------------------

function mountLoot(root) {
  let mode = 'pocket', loot;
  const card = el('article', { class: 'card fresh' });
  root.append(panelHead('Loot', 'A pocketful from one creature, or a full hoard. Magic items are SRD names, weighted by tier.'),
    el('div', { class: 'controls' }, select('l-tier', 'Challenge', [['0', 'CR 0–4'], ['1', 'CR 5–10'], ['2', 'CR 11–16'], ['3', 'CR 17+']]),
      seg('l-mode', 'Loot size', [['pocket', 'Pocket'], ['hoard', 'Hoard']], (v) => { mode = v; roll(); }),
      el('button', { class: 'btn primary', type: 'button', onclick: () => roll() }, 'Roll loot')), card);
  const tierLabel = () => $('#l-tier').selectedOptions[0].text;
  function roll() {
    const tier = +$('#l-tier').value, hoard = mode === 'hoard';
    const coins = [];
    for (const [c, n, s, m, ch] of D.COINS[mode][tier]) if (r.chance(ch)) coins.push([c, d(n, s) * m]);
    if (!coins.length) { const [c, n, s, m] = D.COINS[mode][tier][0]; coins.push([c, d(n, s) * m]); }
    const vals = [];
    if (hoard && r.chance(tier === 0 ? 0.6 : 0.85)) {
      const [table, values, [n, s]] = pick(D.VALUABLES[tier]); const v = pick(values); const count = d(n, s);
      const tally = {}; for (let i = 0; i < count; i++) { const nm = pick(table[v]); tally[nm] = (tally[nm] || 0) + 1; }
      for (const [nm, q] of Object.entries(tally)) vals.push({ name: (q > 1 ? `${q} × ` : '') + nm, each: v, value: v * q, kind: table === D.GEMS ? 'gem' : 'art' });
    }
    const items = [];
    const nItems = hoard ? [Math.max(0, d(1, 4) - 2), d(1, 3), d(1, 4), d(1, 4) + 1][tier] : (r.chance(0.12) ? 1 : 0);
    for (let i = 0; i < nItems; i++) items.push(hoard ? magicItem(tier) : { r: 'common', name: pick(D.MAGIC.common) });
    const extra = r.chance(hoard ? 0.5 : 0.35) ? pick(D.TABLES.trinket.items) : null;
    const total = coins.reduce((a, [c, q]) => a + q * D.GP[c], 0) + vals.reduce((a, v) => a + v.value, 0);
    loot = { tier, hoard, coins, vals, items, extra, where: pick(D.CONTAINERS), total };
    render(true);
  }
  const text = () => {
    const l = loot, lines = [`${l.hoard ? 'Hoard' : 'Pocket loot'} (${tierLabel()}), found ${l.where}`, `Coins: ${l.coins.map(([c, q]) => `${fmt(q)} ${c}`).join(', ')}`];
    for (const v of l.vals) lines.push(`${cap(v.name)} (${fmt(v.each)} gp each)`);
    for (const it of l.items) lines.push(`${it.name} [${D.RARITY_LABEL[it.r]}]`);
    if (l.extra) lines.push(`Trinket: ${l.extra}`);
    lines.push(`Total (coins + valuables): ${fmt(Math.round(l.total))} gp`);
    return lines.join('\n');
  };
  function render(isNew) {
    const l = loot;
    card.replaceChildren(el('div', { class: 'eyebrow' }, `${l.hoard ? 'Treasure hoard' : 'Pocket loot'} · ${tierLabel()}`), el('p', { class: 'card-sub' }, `Found ${l.where}.`),
      el('div', { class: 'coins' }, l.coins.map(([c, q]) => el('span', { class: 'coin' }, `${fmt(q)} ${c}`))),
      l.vals.length ? [el('div', { class: 'eyebrow' }, l.vals[0].kind === 'gem' ? 'Gemstones' : 'Art objects'), el('ul', { class: 'loot-list' }, l.vals.map((v) => el('li', {}, el('span', {}, cap(v.name)), el('span', { class: 'v' }, `${fmt(v.each)} gp ea`))))] : null,
      l.items.length ? [el('div', { class: 'eyebrow' }, 'Magic items'), el('ul', { class: 'loot-list' }, l.items.map((it) => el('li', {}, el('span', {}, it.name), el('span', { class: `pill r-${it.r}` }, D.RARITY_LABEL[it.r]))))] : null,
      l.extra ? [el('div', { class: 'eyebrow' }, 'Also'), el('p', { class: 'flavor' }, l.extra)] : null,
      el('div', {}, 'Total coin and valuables: ', el('span', { class: 'total' }, `${fmt(Math.round(l.total))} gp`)),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn', type: 'button', onclick: () => saveNote('Loot', `${l.hoard ? 'Hoard' : 'Pocket loot'}, ${fmt(Math.round(l.total))} gp`, text()) }, 'Save to notebook'),
        el('button', { class: 'btn', type: 'button', onclick: () => copyText(text()) }, 'Copy'),
        l.items.length ? el('button', { class: 'btn world', type: 'button', onclick: () => sendToWorld({ kind: 'item', name: l.items[0].name, fields: { rarity: { veryrare: 'Very rare' }[l.items[0].r] || cap(l.items[0].r), type: 'Magic item' }, summary: `Found ${l.where}.` }) }, 'Add first item to world') : null));
    if (isNew) fresh(card);
  }
  roll();
}

export const TOOLS = [
  { id: 'npc', label: 'NPCs', mount: mountNpc },
  { id: 'quest', label: 'Quests', mount: mountQuest },
  { id: 'orgs', label: 'Factions', mount: mountOrgs },
  { id: 'names', label: 'Names', mount: mountNames },
  { id: 'places', label: 'Places', mount: mountPlaces },
  { id: 'describe', label: 'Descriptions', mount: mountDescribe },
  { id: 'hooks', label: 'Rumors & Hooks', mount: mountHooks },
  { id: 'loot', label: 'Loot', mount: mountLoot },
];
