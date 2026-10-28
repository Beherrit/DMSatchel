import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCustomList, readCustom, customForPlayers, fieldsWith, secretCustomKeys } from '../js/custom-fields.js';
import { KINDS } from '../js/world-schema.js';

test('fields get stable x_ keys from their labels', () => {
  const r = cleanCustomList('npc', [{ label: '  Deity ' }, { label: 'Danger level', type: 'select', options: 'Low, High, Low' }, { label: '' }]);
  assert.deepEqual(r.list, [{ key: 'x_deity', label: 'Deity', type: 'text' }, { key: 'x_danger_level', label: 'Danger level', type: 'select', options: ['Low', 'High'] }]);
  const renamed = cleanCustomList('npc', [{ key: 'x_deity', label: 'Patron god', gmOnly: true }]);
  assert.deepEqual(renamed.list, [{ key: 'x_deity', label: 'Patron god', type: 'text', gmOnly: true }]);
});

test('clashing keys get a number; bad input is refused', () => {
  assert.deepEqual(cleanCustomList('npc', [{ label: 'Home!' }, { label: 'Home?' }]).list.map((f) => f.key), ['x_home', 'x_home_2']);
  assert.match(cleanCustomList('npc', [{ label: 'Deity' }, { label: 'deity' }]).error, /two fields/);
  assert.match(cleanCustomList('npc', [{ label: KINDS.npc.fields[1][1] }]).error, /already have/);
  assert.match(cleanCustomList('npc', [{ label: 'Mood', type: 'select', options: 'Calm' }]).error, /two choices/);
  assert.match(cleanCustomList('npc', Array.from({ length: 13 }, (_, i) => ({ label: `F${i}` }))).error, /Up to 12/);
  assert.match(cleanCustomList('nope', []).error, /Unknown/);
  assert.equal(cleanCustomList('npc', [{ key: 'title', label: 'Sneaky' }]).list[0].key, 'x_sneaky');
});

test('players are not told about GM-only fields', () => {
  const c = readCustom({ npc: [{ key: 'x_a', label: 'A' }, { key: 'x_b', label: 'B', gmOnly: true }], location: [{ key: 'x_c', label: 'C', gmOnly: true }], junk: [{ label: 'x' }] });
  assert.deepEqual(Object.keys(c), ['npc', 'location']);
  assert.deepEqual(customForPlayers(c), { npc: [{ key: 'x_a', label: 'A', type: 'text' }] });
  assert.deepEqual(secretCustomKeys('npc', c), ['x_b']);
});

test('a kind’s fields with the world’s own appended', () => {
  const f = fieldsWith('npc', { npc: [{ key: 'x_a', label: 'A', type: 'select', options: ['1', '2'] }] });
  assert.equal(f.length, KINDS.npc.fields.length + 1);
  assert.deepEqual(f.at(-1), ['x_a', 'A', 'select', ['1', '2'], { custom: true }]);
  assert.equal(fieldsWith('npc', null).length, KINDS.npc.fields.length);
});
