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
