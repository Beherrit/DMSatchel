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
