import test from 'node:test';
import assert from 'node:assert/strict';
import { likelyDuplicates, pairKey } from '../js/duplicates.js';
import { similarNames } from '../js/name-check.js';

const E = (id, kind, name, extra = {}) => ({ id, kind, name, ...extra });

test('finds same and near names, within a kind unless the name is the same', () => {
  const list = [E('1', 'npc', 'Bramwell'), E('2', 'npc', 'Bramwel'), E('3', 'location', 'Bramwell'), E('4', 'location', 'Bramwel Hall'),
    E('5', 'npc', 'The Gate'), E('6', 'location', 'Gate'), E('7', 'session', 'Session 12'), E('8', 'session', 'Session 13'),
    E('9', 'location', 'Room 1'), E('10', 'location', 'Room 2'), E('11', 'npc', 'Bramwell', { status: 'suggested' })];
  const d = likelyDuplicates(list);
  assert.deepEqual(d.map((p) => `${p.a.id}-${p.b.id}${p.exact ? '!' : ''}`), ['1-3!', '6-5!', '2-1']);
});

test('dismissed pairs stay hidden, whichever way round', () => {
  const list = [E('a', 'npc', 'Ann Gale'), E('b', 'npc', 'Ann Gael')];
  assert.equal(likelyDuplicates(list).length, 1);
  assert.equal(likelyDuplicates(list, [pairKey('b', 'a')]).length, 0);
});

test('numbered names are not near each other in the name check either', () => {
  assert.deepEqual(similarNames('Session 13', [E('s', 'session', 'Session 12')]).close, []);
  assert.equal(similarNames('Brindel', [E('b', 'settlement', 'Brindle')]).close.length, 1);
});

test('nearWord forgives a typo or two, whole or as a start', async () => {
  const { nearWord, wordsOf } = await import('../js/name-check.js');
  const toks = wordsOf('The Silverhand Brindle', 'north-road');
  assert.ok(nearWord('brimdle', toks)); assert.ok(nearWord('silvr', toks)); assert.ok(nearWord('nroth', toks));
  assert.ok(!nearWord('bri', toks)); assert.ok(!nearWord('dragon', toks));
});
