import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchItems } from '../js/inventory-items.js';

test('known items are found in free-text inventories', () => {
  const items = [{ name: 'Potion of Healing' }, { name: 'Potion of Greater Healing' }, { name: 'Bag of Holding' }, { name: 'Ring' }, { name: 'Gauntlets of Ogre Power' }, { name: 'Storm’s Edge' }];
  const inv = 'Longsword, potion of greater healing x2\nBag of Holding (rope, torches)\nRing of keys\nstorm\'s edge (sword)\nPotion of Healing';
  assert.deepEqual(matchItems(inv, items).map((x) => x.name), ['Potion of Greater Healing', 'Bag of Holding', 'Storm’s Edge', 'Potion of Healing']);
  assert.deepEqual(matchItems('Gauntlets of Ogre Powerful', items), [], 'whole words only');
  assert.deepEqual(matchItems('', items), []);
  assert.deepEqual(matchItems('bag of holding, bag of holding', items).length, 1, 'each item once');
});
