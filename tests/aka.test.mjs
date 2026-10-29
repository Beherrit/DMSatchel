import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAka, akaOf, MAX_AKA } from '../js/aka.js';
import { similarNames } from '../js/name-check.js';
import { searchEntries } from '../js/search.js';

test('other names are cleaned and listed', () => {
  assert.equal(cleanAka(' The Red Widow ;the red widow\nLady  Vex | Old Vex ', 'Lady Vex'), 'The Red Widow; Old Vex');
  assert.equal(cleanAka(Array.from({ length: 10 }, (_, i) => `N${i}`).join(';')).split('; ').length, MAX_AKA);
  assert.equal(cleanAka(''), '');
  assert.deepEqual(akaOf({ fields: { aka: 'The Red Widow; Old Vex' } }), ['The Red Widow', 'Old Vex']);
  assert.deepEqual(akaOf({}), []);
});

test('the name check and search know them', () => {
  const vex = { id: 'v', kind: 'npc', name: 'Lady Vex', fields: { aka: 'The Red Widow' } }, tam = { id: 't', kind: 'npc', name: 'Old Tam', fields: {} };
  assert.deepEqual(similarNames('The Red Widow', [vex, tam]).exact.map((e) => e.id), ['v']);
  assert.deepEqual(similarNames('The Red Widdow', [vex, tam]).close.map((e) => e.id), ['v']);
  // An exact other name ranks with exact names, ahead of a mention in someone's summary.
  const fan = { id: 'f', kind: 'npc', name: 'Bard', summary: 'Sings of the red widow', fields: {} };
  assert.deepEqual(searchEntries([fan, vex], { q: 'the red widow' }).map((e) => e.id), ['v', 'f']);
});
