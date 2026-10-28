import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTag, chainUp, movable, tagsAmong } from '../js/bulk.js';

const E = (id, parent_id = null, tags = []) => ({ id, parent_id, tags });
const world = [E('r'), E('t', 'r', ['town', 'key']), E('l', 't', ['key']), E('n', 'l'), E('x', null, ['key'])];

test('tags are trimmed, lower-cased and lose a leading #', () => {
  assert.equal(cleanTag('  #Key NPC '), 'key npc');
  assert.equal(cleanTag('##'), '');
  assert.equal(cleanTag('a'.repeat(99)).length, 40);
});

test('a place and the places above it cannot move inside it', () => {
  assert.deepEqual([...chainUp((id) => world.find((e) => e.id === id)?.parent_id, 'l')], ['l', 't', 'r']);
  const m = movable(world, ['r', 't', 'n', 'x', 'l', 'gone'], 'l');
  assert.deepEqual(m.stay, ['r', 't', 'l']);
  assert.deepEqual(m.ok, ['x']); // n is already in l
});

test('moving out of every place', () => {
  assert.deepEqual(movable(world, ['t', 'x'], null), { ok: ['t'], stay: [] });
});

test('loops in the data do not hang', () => {
  const loop = [E('a', 'b'), E('b', 'a'), E('c')];
  assert.deepEqual(movable(loop, ['c'], 'a'), { ok: ['c'], stay: [] });
});

test('tags among the picked entries, most common first', () => {
  assert.deepEqual(tagsAmong(world, ['t', 'l', 'n']), [{ tag: 'key', n: 2 }, { tag: 'town', n: 1 }]);
});
