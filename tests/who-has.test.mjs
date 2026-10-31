import test from 'node:test';
import assert from 'node:assert/strict';
import { whoHas } from '../js/who-has.js';

test('who has it', () => {
  const chars = [{ id: 'p', name: 'Pip', inventory: '2 Rope (from Smithy)\nLongsword\nSilk rope' }, { id: 'b', name: 'Bo', inventory: '- Potion of healing x3\nShield' }];
  const stash = [{ item: 'Rope', qty: 5, holder: 'Bo' }, { item: 'Gold idol', qty: 0, holder: '' }];
  assert.deepEqual(whoHas('rope', chars, stash).map((x) => [x.who, x.item, x.qty]), [['Pip', 'Rope', 2], ['Pip', 'Silk rope', 1], ['the treasury (Bo carries it)', 'Rope', 5]]);
  assert.deepEqual(whoHas('potion heal', chars, stash).map((x) => [x.who, x.qty]), [['Bo', 3]]);
  assert.deepEqual(whoHas('sword', chars, stash), []); // not "Longsword"
  assert.deepEqual(whoHas('idol', chars, stash), []); // none left in the treasury
  assert.deepEqual(whoHas('  ', chars, stash), []);
});
