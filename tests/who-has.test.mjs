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

test('everything: the party’s gear merged, with who has it', async () => {
  const { everything } = await import('../js/who-has.js');
  const list = everything([{ id: 'a', name: 'Ann', inventory: 'Rope\n2 Torches\nrope' }, { id: 'b', name: 'Bo', inventory: 'Chain mail, longsword, 2 torches' }], [{ item: 'Rope', qty: 1, holder: 'Bo' }, { item: 'Tent', qty: 0 }]);
  assert.deepEqual(list.map((x) => `${x.item}=${x.total}: ${x.holders.map((h) => `${h.who} ${h.qty}`).join(', ')}`), [
    'Chain mail=1: Bo 1', 'longsword=1: Bo 1', 'Rope=3: Ann 2, the treasury (with Bo) 1', 'Torches=4: Ann 2, Bo 2',
  ]);
  assert.deepEqual(everything([], []), []);
});
