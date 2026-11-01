import test from 'node:test';
import assert from 'node:assert/strict';
import { readList, addToList, removeFromList, answers, listFirst, MAX_SHOPPING } from '../js/shopping.js';

test('a shopping list', () => {
  let l = readList({});
  l = addToList(l, ' Rope '); l = addToList(l, 'rope'); l = addToList(l, 'Healing potion'); l = addToList(l, '');
  assert.deepEqual(l, ['Rope', 'Healing potion']);
  assert.deepEqual(removeFromList(l, 0), ['Healing potion']);
  assert.equal(Array.from({ length: 30 }).reduce((acc, _, i) => addToList(acc, `x${i}`), []).length, MAX_SHOPPING);
  assert.ok(answers('rope', 'Hempen rope (50 ft)') && answers('healing potion', 'Potion of healing') && !answers('sword', 'Longsword'));
  const items = [{ name: 'Lantern' }, { name: 'Potion of healing' }, { name: 'Hempen rope' }];
  assert.deepEqual(listFirst(items, l).map((x) => `${x.name}${x.wanted ? '*' : ''}`), ['Potion of healing*', 'Hempen rope*', 'Lantern']);
  assert.deepEqual(readList({ shopping: ['A', '', 3] }), ['A', '3']);
});
