import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLanguages, languagesOf, sharedWith, tongues, speaks } from '../js/languages.js';

test('splitLanguages and languagesOf: any separators, no repeats', () => {
  assert.deepEqual(splitLanguages('Common, Elvish; Dwarvish and Draconic.'), ['Common', 'Elvish', 'Dwarvish', 'Draconic']);
  assert.deepEqual(languagesOf({ fields: { languages: 'Common, elvish' } }, ['Elvish', 'Thieves’ Cant']), ['Common', 'elvish', 'Thieves’ Cant']);
  assert.deepEqual(languagesOf({}), []);
});

test('sharedWith, tongues and speaks', () => {
  const party = [{ who: 'Ann', languages: ['Common', 'Elvish'] }, { who: 'Bo', languages: ['Common', 'Dwarvish'] }, { who: 'Cy', languages: ['Orc'] }];
  assert.deepEqual(sharedWith(['dwarvish', 'Giant'], party), [{ who: 'Bo', shared: ['Dwarvish'] }]);
  assert.deepEqual(sharedWith(['Sylvan'], party), []);
  assert.deepEqual(tongues(party).map((t) => [t.language, t.speakers.join('+')]), [['Common', 'Ann+Bo'], ['Dwarvish', 'Bo'], ['Elvish', 'Ann'], ['Orc', 'Cy']]);
  assert.equal(speaks(['Thieves’ Cant'], "thieves' cant"), true);
});
