// Where are they now?: an NPC's day, written the way a GM would ("Mornings: the forge; evenings: the Bell; nights:
// home", or hours, "8–12: the market"), read against the world's clock (minutes past midnight). The parts of the day
// match the clock's own (clock.js). Pure.

const DAY = 1440;
const WORDS = [
  [/^(the )?dead of night$|^late nights?$|^small hours$/, [[0, 300]]],
  [/^dawns?$|^sunrise$|^first light$/, [[300, 420]]],
  [/^mornings?$/, [[420, 660]]],
  [/^middays?$|^noons?$|^lunch(time)?$/, [[660, 780]]],
  [/^afternoons?$/, [[780, 1020]]],
  [/^evenings?$/, [[1020, 1140]]],
  [/^dusks?$|^sunset$/, [[1140, 1260]]],
  [/^nights?$|^at night$|^overnight$/, [[1260, DAY], [0, 300]]],
  [/^(by )?days?$|^daytime$|^working hours$/, [[420, 1020]]],
  [/^all day$/, [[300, 1260]]],
];
const OTHER = /^(otherwise|always|else|the rest of the time|any other time|all other times|other times)$/;

const hour = (h, m, ap) => {
  let x = Number(h) % 24;
  if (ap) { x = Number(h) % 12; if (/p/i.test(ap)) x += 12; }
  return x * 60 + (Number(m) || 0);
};

// One "when" phrase → ranges [[from, to]] (to may pass midnight: split), or 'other', or null.
function when(raw) {
  const w = raw.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
  if (OTHER.test(w)) return 'other';
  const t = /^(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*(?:-|–|—|to|till|until)\s*(\d{1,2}|noon|midnight)(?::(\d\d))?\s*(am|pm)?$/.exec(w);
  if (t) {
    const from = hour(t[1], t[2], t[3] || (t[6] && Number(t[1]) <= Number(t[4]) ? t[6] : ''));
    const to = t[4] === 'noon' ? 720 : t[4] === 'midnight' ? DAY : hour(t[4], t[5], t[6]);
    if (from === to) return [[0, DAY]];
    return to > from ? [[from, to]] : [[from, DAY], [0, to]];
  }
  for (const [re, ranges] of WORDS) if (re.test(w)) return ranges;
  return null;
}

// text → [{ label, place, ranges }] in the order written; 'otherwise' lines have ranges 'other'.
export function parseRoutine(text) {
  const out = [];
  for (const part of String(text || '').split(/[;\n]+/)) {
    const m = /^\s*(.+?)\s*:(?!\d\d)\s*(.+?)\s*\.?\s*$/.exec(part); // the colon that isn't inside a time ("13:30")
    if (!m) continue;
    const place = m[2].replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim();
    const labels = m[1].split(/\s*(?:,|\band\b|&)\s*/).filter(Boolean);
    let ranges = [], other = false;
    for (const l of labels) { const r = when(l); if (r === 'other') other = true; else if (r) ranges.push(...r); }
    if (other) out.push({ label: m[1].trim(), place, ranges: 'other' });
    else if (ranges.length && place) out.push({ label: m[1].trim(), place, ranges });
  }
  return out;
}

// Where they are at this minute of the day → { place, label, until } (until: minutes, when this part of the day ends,
// or null for "otherwise"), or null when the routine doesn't say.
export function whereAt(text, minutes) {
  const m = ((Math.round(Number(minutes) || 0) % DAY) + DAY) % DAY;
  const list = parseRoutine(text);
  for (const x of list) {
    if (x.ranges === 'other') continue;
    const hit = x.ranges.find(([a, b]) => m >= a && m < b);
    if (hit) {
      // Run on through touching ranges (night: 21:00–24:00 then 00:00–05:00).
      let end = hit[1];
      for (let i = 0; i < 3; i++) { const next = x.ranges.find(([a]) => a === end % DAY && end % DAY !== hit[0]); if (!next) break; end = next[1] + (end >= DAY ? DAY : 0); }
      return { place: x.place, label: x.label, until: end % DAY };
    }
  }
  const other = list.find((x) => x.ranges === 'other');
  return other ? { place: other.place, label: other.label, until: null } : null;
}

// Who's about town: the NPCs whose routine puts them inside a place right now. npcs: [{ id, name, routine }];
// resolve(name) → a place or null; inside(place) → whether it's in (or is) the town. → [{ npc, place, until }] by name.
export function aboutTown(npcs, minutes, resolve, inside) {
  const out = [];
  for (const n of npcs || []) {
    const w = whereAt(n.routine, minutes);
    const p = w && resolve(w.place);
    if (p && inside(p)) out.push({ npc: n, place: p, until: w.until });
  }
  return out.sort((a, b) => a.npc.name.localeCompare(b.npc.name));
}

// The regulars: NPCs whose routine brings them to a place at some hour. npcs: [{ id, name, routine }];
// isHere(name) → whether a routine's place is this one. → [{ npc, when: ['Afternoons and evenings', …] }] by name.
export function regularsAt(npcs, isHere) {
  const out = [];
  for (const n of npcs || []) {
    const when = parseRoutine(n.routine).filter((x) => isHere(x.place)).map((x) => x.label);
    if (when.length) out.push({ npc: n, when });
  }
  return out.sort((a, b) => a.npc.name.localeCompare(b.npc.name));
}

// Routine as you type: the lines a routine can't read (no "when: where", or a "when" it doesn't know).
export function unreadable(text) {
  return String(text || '').split(/[;\n]+/).map((p) => p.trim()).filter(Boolean).filter((p) => !parseRoutine(p).length);
}

// Roll a routine: a likely day for an NPC from their role and the places about (places: [{ name, type }], type as a
// location's: Tavern, Shop, Temple, Castle, Landmark…). rng from rng.js. → routine text.
const WORK = [
  [/smith|farrier|armou?rer|weaponsmith/i, (p) => p.find((x) => x.type === 'Shop' && /forge|smith|anvil|hammer/i.test(x.name)) || p.find((x) => x.type === 'Shop')],
  [/inn|tavern|barkeep|barmaid|brewer|cook|landlord|landlady|server/i, (p) => p.find((x) => x.type === 'Tavern')],
  [/priest|cleric|acolyte|monk|nun|abbot|oracle/i, (p) => p.find((x) => x.type === 'Temple')],
  [/guard|watch|soldier|captain|knight|sergeant|lord|lady|steward/i, (p) => p.find((x) => x.type === 'Castle') || p.find((x) => x.type === 'Landmark')],
  [/merchant|trader|shop|clerk|baker|butcher|tailor|cobbler|jewel|chandler|apothecary|alchemist|herbalist/i, (p) => p.find((x) => x.type === 'Shop')],
];
const OUTDOORS = [[/farm|herd|shepherd|plough/i, 'the fields'], [/hunt|woodcut|forester|ranger|trapper/i, 'the woods'], [/fisher|sailor|boat|dock/i, 'the docks'], [/thief|cutpurse|smuggler|beggar|urchin/i, 'the market']];

export function rollRoutine(rng, role = '', places = []) {
  const list = (places || []).filter((x) => x && x.name);
  const shuffled = list.map((x) => [rng.next ? rng.next() : Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
  let work = null;
  for (const [re, find] of WORK) if (re.test(role)) { work = find(shuffled)?.name || null; break; }
  if (!work) for (const [re, spot] of OUTDOORS) if (re.test(role)) { work = spot; break; }
  if (!work) work = rng.pick(['about town', 'the market', ...(shuffled.filter((x) => x.type === 'Shop').slice(0, 2).map((x) => x.name))]);
  const tavern = shuffled.find((x) => x.type === 'Tavern')?.name;
  const evening = tavern && tavern !== work ? (rng.pick([true, true, false]) ? tavern : 'home') : 'home';
  if (tavern && tavern === work) return `Mornings: the market; afternoons, evenings, dusk and nights: ${work}; otherwise: home`;
  if (/thief|cutpurse|smuggler/i.test(role) && tavern) return `By day: ${work}; evenings, dusk and nights: ${tavern}; otherwise: home`;
  return `By day: ${work}; ${evening === 'home' ? 'otherwise: home' : `evenings and dusk: ${evening}; otherwise: home`}`;
}

// The town by the hour: where each NPC is at a few hours of the day, inside a town. npcs: [{ id, name, routine }];
// resolve(name) → a place or null; inside(place) → bool. → { hours: [{ label, m }], rows: [{ npc, cells: [place|null] }] }
// (only NPCs who are somewhere in the town at least once), by name.
export const DAY_HOURS = [{ label: 'Morning', m: 9 * 60 }, { label: 'Afternoon', m: 15 * 60 }, { label: 'Evening', m: 18 * 60 }, { label: 'Night', m: 23 * 60 }];
export function townByHour(npcs, resolve, inside, hours = DAY_HOURS) {
  const rows = [];
  for (const n of npcs || []) {
    const cells = hours.map((h) => { const w = whereAt(n.routine, h.m); const p = w && resolve(w.place); return p && inside(p) ? p : null; });
    if (cells.some(Boolean)) rows.push({ npc: n, cells });
  }
  return { hours, rows: rows.sort((a, b) => a.npc.name.localeCompare(b.npc.name)) };
}

// The NPC's day: where the routine puts them at each of the day's hours → [{ label, m, place (text, or null) }].
export const dayOf = (routine, hours = DAY_HOURS) => hours.map((h) => ({ ...h, place: whereAt(routine, h.m)?.place || null }));

// A night out: who isn't here now but whose routine brings them here before `until` (minutes, may pass midnight),
// checked every half hour. isHere(placeText) → bool. → [{ npc, at (minutes, when they arrive) }] by arrival.
export function dueLater(npcs, isHere, from, until) {
  const out = [];
  const end = until > from ? until : until + 1440;
  for (const n of npcs || []) {
    const now = whereAt(n.routine, from);
    if (now && isHere(now.place)) continue;
    for (let t = Math.ceil((from + 1) / 30) * 30; t <= end; t += 30) {
      const w = whereAt(n.routine, t % 1440);
      if (w && isHere(w.place)) { out.push({ npc: n, at: t % 1440 }); break; }
    }
  }
  return out.sort((a, b) => ((a.at - from + 1440) % 1440) - ((b.at - from + 1440) % 1440) || a.npc.name.localeCompare(b.npc.name));
}

// A tavern's busiest hour: of the hours it's open (8 in the morning to 2 at night), the one when most people's
// routines put them here. → { m, count } or null when nobody comes.
export function busiestHour(npcs, isHere, from = 8 * 60, to = 26 * 60) {
  let best = null;
  for (let t = from; t < to; t += 60) {
    const m = t % 1440, count = (npcs || []).filter((n) => { const w = whereAt(n.routine, m); return w && isHere(w.place); }).length;
    if (count && (!best || count > best.count)) best = { m, count };
  }
  return best;
}

// Who knows whom: other NPCs whose routines put them in the same place (one the world knows, so not "home") at the
// same hours, checked hour by hour. resolve(placeText) → a place { id, name } or null.
// → [{ other, place, hours }] for two hours a day or more, the most first.
export function crossPaths(npc, others, resolve) {
  const mine = Array.from({ length: 24 }, (_, h) => { const w = whereAt(npc.routine, h * 60); return w ? resolve(w.place) : null; });
  const out = [];
  for (const o of others || []) {
    if (o.id === npc.id) continue;
    const at = new Map();
    for (let h = 0; h < 24; h++) {
      const p = mine[h]; if (!p) continue;
      const w = whereAt(o.routine, h * 60), q = w ? resolve(w.place) : null;
      if (q && q.id === p.id) at.set(p.id, { place: p, hours: (at.get(p.id)?.hours || 0) + 1 });
    }
    const best = [...at.values()].sort((a, b) => b.hours - a.hours)[0];
    if (best && best.hours >= 2) out.push({ other: o, place: best.place, hours: best.hours });
  }
  return out.sort((a, b) => b.hours - a.hours || a.other.name.localeCompare(b.other.name));
}

// Who's at the taverns: from aboutTown's list ([{ npc, place, until }]), group the people at each tavern (a back room
// counts: tavernOf walks up from a place to its tavern, or null). taverns: every tavern in town, so quiet ones show
// too. → [{ tavern, people: [{ npc, until }] }], busiest first, then by name.
export function atTaverns(list, taverns, tavernOf) {
  const by = new Map(taverns.map((t) => [t.id, { tavern: t, people: [] }]));
  for (const x of list) {
    const t = tavernOf(x.place);
    if (!t) continue;
    if (!by.has(t.id)) by.set(t.id, { tavern: t, people: [] });
    by.get(t.id).people.push({ npc: x.npc, until: x.until });
  }
  return [...by.values()].sort((a, b) => b.people.length - a.people.length || String(a.tavern.name).localeCompare(String(b.tavern.name)));
}
