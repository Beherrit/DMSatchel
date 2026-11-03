import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoutine, whereAt } from '../js/routine.js';

const R = 'Mornings: the forge; Afternoons and evenings: [[The Bell]]; Nights: home';
const h = (x) => x * 60;

test('whereAt: parts of the day', () => {
  assert.deepEqual(whereAt(R, h(8)), { place: 'the forge', label: 'Mornings', until: 660 });
  assert.deepEqual(whereAt(R, h(15)), { place: 'The Bell', label: 'Afternoons and evenings', until: 1140 });
  assert.deepEqual(whereAt(R, h(23)), { place: 'home', label: 'Nights', until: 300 });
  assert.deepEqual(whereAt(R, h(2)), { place: 'home', label: 'Nights', until: 300 });
  assert.equal(whereAt(R, h(12)), null); // midday isn't covered
  assert.equal(whereAt('', h(8)), null);
});

test('whereAt: hours, otherwise, and nonsense', () => {
  const r = '8-12: the market\n13:30–17:00: the docks\n9pm to 2am: the Gutter\nOtherwise: wandering';
  assert.equal(whereAt(r, h(9)).place, 'the market');
  assert.equal(whereAt(r, h(14)).place, 'the docks');
  assert.equal(whereAt(r, h(23)).place, 'the Gutter');
  assert.equal(whereAt(r, h(1)).place, 'the Gutter');
  assert.deepEqual(whereAt(r, h(19)), { place: 'wandering', label: 'Otherwise', until: null });
  assert.equal(whereAt('8am-noon: temple', h(11)).place, 'temple');
  assert.equal(whereAt('By day: the walls; dead of night: the crypt', h(3)).place, 'the crypt');
  assert.deepEqual(parseRoutine('just a sentence; Fridays: the market; morning:'), []);
});

test('aboutTown: NPCs somewhere inside a town now', async () => {
  const { aboutTown } = await import('../js/routine.js');
  const places = { 'the forge': { id: 'f', parent: 't' }, 'the bell': { id: 'b', parent: 't' }, 'the mill': { id: 'm', parent: 'x' } };
  const resolve = (n) => places[n.toLowerCase()] || null;
  const inside = (p) => p.parent === 't';
  const npcs = [{ id: 1, name: 'Bram', routine: 'Mornings: the Forge; evenings: the Bell' }, { id: 2, name: 'Ada', routine: 'Always: the Mill' }, { id: 3, name: 'Cole', routine: 'Mornings: the Bell' }];
  assert.deepEqual(aboutTown(npcs, 8 * 60, resolve, inside).map((x) => `${x.npc.name}@${x.place.id}`), ['Bram@f', 'Cole@b']);
  assert.deepEqual(aboutTown(npcs, 18 * 60, resolve, inside).map((x) => `${x.npc.name}@${x.place.id}`), ['Bram@b']);
  assert.deepEqual(aboutTown([], 0, resolve, inside), []);
});

test('regularsAt: who comes here, and when', async () => {
  const { regularsAt } = await import('../js/routine.js');
  const npcs = [{ id: 1, name: 'Bram', routine: 'Mornings: the Forge; afternoons and evenings: the Bell' }, { id: 2, name: 'Ada', routine: 'Always: the Mill' }, { id: 3, name: 'Cole', routine: 'Dawn: The Bell; nights: the Bell' }];
  const isBell = (p) => /^(the )?bell$/i.test(p.trim());
  assert.deepEqual(regularsAt(npcs, isBell).map((x) => `${x.npc.name}: ${x.when.join(', ')}`), ['Bram: afternoons and evenings', 'Cole: Dawn, nights']);
  assert.deepEqual(regularsAt([], isBell), []);
});

test('unreadable: the lines a routine cannot read', async () => {
  const { unreadable } = await import('../js/routine.js');
  assert.deepEqual(unreadable('Mornings: the forge; Fridays: the market\nsleeps a lot; 9-17: the docks; Otherwise: home'), ['Fridays: the market', 'sleeps a lot']);
  assert.deepEqual(unreadable(''), []);
});

test('rollRoutine: a likely day from the role and the places about', async () => {
  const { rollRoutine, whereAt, unreadable } = await import('../js/routine.js');
  const { makeRng } = await import('../js/rng.js');
  const places = [{ name: 'The Bell', type: 'Tavern' }, { name: 'Anvil & Tongs', type: 'Shop' }, { name: 'Shrine of Dawn', type: 'Temple' }, { name: 'Pickle Stall', type: 'Shop' }];
  for (let i = 0; i < 20; i++) {
    const smith = rollRoutine(makeRng(`s${i}`), 'Blacksmith', places);
    assert.equal(whereAt(smith, 9 * 60).place, 'Anvil & Tongs', smith);
    assert.equal(whereAt(smith, 2 * 60).place, 'home');
    assert.deepEqual(unreadable(smith), []);
    const keep = rollRoutine(makeRng(`k${i}`), 'Innkeeper', places);
    assert.equal(whereAt(keep, 20 * 60).place, 'The Bell', keep);
    assert.equal(whereAt(rollRoutine(makeRng(`p${i}`), 'Village priest', places), 10 * 60).place, 'Shrine of Dawn');
    assert.equal(whereAt(rollRoutine(makeRng(`f${i}`), 'Farmer', places), 10 * 60).place, 'the fields');
    assert.deepEqual(unreadable(rollRoutine(makeRng(`x${i}`), '', [])), []);
  }
});

test('townByHour: who is where through the day', async () => {
  const { townByHour } = await import('../js/routine.js');
  const places = { 'the forge': { id: 'f', name: 'The Forge', parent: 't' }, 'the bell': { id: 'b', name: 'The Bell', parent: 't' }, 'the mill': { id: 'm', name: 'The Mill', parent: 'x' } };
  const resolve = (n) => places[n.toLowerCase()] || null;
  const inside = (p) => p.parent === 't';
  const npcs = [{ id: 1, name: 'Bram', routine: 'By day: the Forge; evenings and dusk: the Bell; otherwise: home' }, { id: 2, name: 'Ada', routine: 'Always: the Mill' }];
  const t = townByHour(npcs, resolve, inside);
  assert.deepEqual(t.hours.map((h) => h.label), ['Morning', 'Afternoon', 'Evening', 'Night']);
  assert.deepEqual(t.rows.map((r) => [r.npc.name, r.cells.map((c) => c?.id || '-').join('')]), [['Bram', 'ffb-']]);
});

test('dayOf: an NPC’s whole day', async () => {
  const { dayOf } = await import('../js/routine.js');
  assert.deepEqual(dayOf('By day: the Forge; evenings and dusk: the Bell; otherwise: home').map((x) => `${x.label}:${x.place}`), ['Morning:the Forge', 'Afternoon:the Forge', 'Evening:the Bell', 'Night:home']);
  assert.deepEqual(dayOf('Mornings: the market').map((x) => x.place), ['the market', null, null, null]);
});

test('dueLater: who comes in later tonight', async () => {
  const { dueLater } = await import('../js/routine.js');
  const isBell = (p) => /bell/i.test(p);
  const npcs = [{ id: 1, name: 'Bram', routine: 'By day: the Forge; evenings and dusk: the Bell; otherwise: home' }, { id: 2, name: 'Cole', routine: 'Nights: the Bell; otherwise: home' }, { id: 3, name: 'Here', routine: 'Always: the Bell' }, { id: 4, name: 'Ada', routine: 'Always: the Mill' }];
  assert.deepEqual(dueLater(npcs, isBell, 15 * 60, 2 * 60).map((x) => `${x.npc.name}@${x.at}`), ['Bram@1020', 'Cole@1260']);
  assert.deepEqual(dueLater(npcs, isBell, 22 * 60, 2 * 60).map((x) => x.npc.name), []);
});

test('busiestHour: when a tavern is fullest', async () => {
  const { busiestHour } = await import('../js/routine.js');
  const isBell = (p) => /bell/i.test(p);
  const npcs = [{ routine: 'Evenings and dusk: the Bell' }, { routine: 'Evenings: the Bell; nights: home' }, { routine: 'Nights: the Bell' }, { routine: 'Always: the Mill' }];
  assert.deepEqual(busiestHour(npcs, isBell), { m: 17 * 60, count: 2 });
  assert.equal(busiestHour([{ routine: 'Always: the Mill' }], isBell), null);
});

test('crossPaths: who knows whom', async () => {
  const { crossPaths } = await import('../js/routine.js');
  const places = { 'the bell': { id: 'b', name: 'The Bell' }, 'the forge': { id: 'f', name: 'The Forge' } };
  const resolve = (n) => places[n.toLowerCase()] || null;
  const bram = { id: 1, name: 'Bram', routine: 'By day: the Forge; evenings and dusk: the Bell; otherwise: home' };
  const others = [bram, { id: 2, name: 'Mags', routine: 'Evenings: the Bell; otherwise: home' }, { id: 3, name: 'Tom', routine: 'By day: the Forge' }, { id: 4, name: 'Homebody', routine: 'Always: home' }];
  assert.deepEqual(crossPaths(bram, others, resolve).map((x) => `${x.other.name}@${x.place.name}:${x.hours}`), ['Tom@The Forge:10', 'Mags@The Bell:2']);
});

test('atTaverns groups people by tavern, back rooms included, quiet taverns kept', async () => {
  const { atTaverns } = await import('../js/routine.js');
  const bell = { id: 'b', name: 'The Bell' }, fox = { id: 'f', name: 'The Fox' }, back = { id: 'r', parent: 'b' }, smithy = { id: 's' };
  const tavernOf = (p) => (p.id === 'b' || p.parent === 'b' ? bell : p.id === 'f' ? fox : null);
  const list = [{ npc: { name: 'Ada' }, place: bell, until: 600 }, { npc: { name: 'Bram' }, place: back, until: null }, { npc: { name: 'Cy' }, place: smithy, until: null }];
  const g = atTaverns(list, [fox, bell], tavernOf);
  assert.deepEqual(g.map((x) => [x.tavern.name, x.people.map((p) => p.npc.name)]), [['The Bell', ['Ada', 'Bram']], ['The Fox', []]]);
  assert.deepEqual(atTaverns([], [], tavernOf), []);
});

test('ownerDay groups the day by where the owner is', async () => {
  const { ownerDay } = await import('../js/routine.js');
  const here = (p) => /forge/i.test(p);
  assert.deepEqual(ownerDay('By day: the Forge; evenings: the Bell; otherwise: home', here), [
    { labels: ['Morning', 'Afternoon'], here: true, place: null },
    { labels: ['Evening'], here: false, place: 'the Bell' },
    { labels: ['Night'], here: false, place: 'home' },
  ]);
  assert.deepEqual(ownerDay('Mornings: the Forge; nights: the Forge', here), [
    { labels: ['Morning', 'Night'], here: true, place: null },
    { labels: ['Afternoon', 'Evening'], here: false, place: null },
  ]);
});
