import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCr, libraryCreatures, libraryItems, ruleOptions } from '../js/library.js';
import { rollEncounter, xpFor, TERRAINS } from '../js/encounters.js';

test('challenge ratings in the ways people write them', () => {
  assert.equal(parseCr('1/4'), 0.25); assert.equal(parseCr('½'), 0.5); assert.equal(parseCr('CR 5'), 5); assert.equal(parseCr('0'), 0);
  assert.equal(parseCr('0.125'), 0.125); assert.equal(parseCr('dragon'), null); assert.equal(parseCr(''), null); assert.equal(parseCr('99'), null);
});

const E = (id, kind, name, fields = {}, extra = {}) => ({ id, kind, name, fields, tags: [], ...extra });
const world = [
  E('m1', 'creature', 'Bog Hag', { cr: '3', type: 'Fey', terrain: 'swamp, marsh' }),
  E('m2', 'creature', 'Stray Thing', { cr: '1/2', type: 'Monstrosity' }),
  E('m3', 'creature', 'No CR', { type: 'Beast' }),
  E('i1', 'item', 'Lantern of Echoes', { rarity: 'Rare', type: 'Wondrous item', source: 'My Book', attunement: 'Requires attunement' }),
  E('i2', 'item', 'Family Sword', { rarity: 'Rare' }),
  E('r1', 'rule', 'Path of the Storm', { category: 'Subclass', class: 'Barbarian' }),
];

test('bestiary entries become encounter creatures', () => {
  const cs = libraryCreatures(world);
  assert.deepEqual(cs.map((c) => c.name), ['Bog Hag', 'Stray Thing']);
  assert.deepEqual(cs[0].terrains, ['swamp']); assert.equal(cs[0].type, 'fey');
  assert.deepEqual(cs[1].terrains, TERRAINS);
  const enc = rollEncounter({ terrain: ['swamp'], level: 5, size: 4, extra: cs, only: true, seed: 'lib' });
  assert.ok(enc.groups.every((g) => ['Bog Hag', 'Stray Thing'].includes(g.name) && g.entryId));
  assert.ok(enc.xp <= 750 * 4 && enc.xp === enc.groups.reduce((t, g) => t + g.count * xpFor(g.cr), 0));
});

test('only sourced items join the loot pool; rules options by category', () => {
  const items = libraryItems(world);
  assert.equal(items.length, 1); assert.equal(items[0].rarity, 'r'); assert.equal(items[0].attunement, 'Requires attunement');
  assert.equal(ruleOptions(world, 'Subclass').length, 1);
});
