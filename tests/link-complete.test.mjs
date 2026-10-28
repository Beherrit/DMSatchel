import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLink, rankNames, finishLink } from '../js/link-complete.js';

test('finds an unfinished [[ before the cursor', () => {
  assert.deepEqual(openLink('Met [[Mab', 9), { start: 4, query: 'Mab' });
  assert.deepEqual(openLink('Met [[', 6), { start: 4, query: '' });
  assert.equal(openLink('Met [[Mabel]] then', 18), null);
  assert.equal(openLink('Met [[Mab\nel', 12), null);
  assert.equal(openLink('no link here', 5), null);
});

test('ranks names: starts with, then a word, then anywhere', () => {
  const E = (name) => ({ name });
  const names = rankNames([E('Old Bell Tower'), E('Bellamy'), E('Drowned Bell'), E('Tabella'), E('Mabel')], 'bel').map((e) => e.name);
  assert.deepEqual(names, ['Bellamy', 'Drowned Bell', 'Old Bell Tower', 'Mabel', 'Tabella']);
  assert.equal(rankNames([E('a'), E('b')], '', 1).length, 1);
});

test('puts the chosen name in, reusing a closing ]] if there', () => {
  assert.deepEqual(finishLink('Met [[Mab and', 9, { start: 4, query: 'Mab' }, 'Mabel'), { text: 'Met [[Mabel]] and', caret: 13 });
  assert.deepEqual(finishLink('Met [[Mab]] and', 9, { start: 4, query: 'Mab' }, 'Mabel'), { text: 'Met [[Mabel]] and', caret: 13 });
});
