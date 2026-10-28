import test from 'node:test';
import assert from 'node:assert/strict';
import { readLine, inventoryLines, takeItem, giveItem } from '../js/handover.js';

test('reads counts written several ways', () => {
  assert.deepEqual(readLine('3 potions of healing'), { qty: 3, name: 'potions of healing' });
  assert.deepEqual(readLine('- Rope x2'), { qty: 2, name: 'Rope' });
  assert.deepEqual(readLine('Torch (5)'), { qty: 5, name: 'Torch' });
  assert.deepEqual(readLine('Lantern (from Bo)'), { qty: 1, name: 'Lantern' });
  assert.equal(inventoryLines('Rope\n\n  \nTorch').length, 2);
});

test('takes some or all of a line', () => {
  const inv = 'Longsword\n3 potions of healing\nRope x2';
  assert.deepEqual(takeItem(inv, 'potions of healing', 1), { text: 'Longsword\n2 potions of healing\nRope x2', name: 'potions of healing', qty: 1 });
  assert.equal(takeItem(inv, 'rope', 2).text, 'Longsword\n3 potions of healing');
  assert.equal(takeItem(inv, 'sword').name, 'Longsword');
  assert.match(takeItem(inv, 'rope', 3).error, /only 2/);
  assert.match(takeItem(inv, 'shield').error, /isn’t/);
});

test('gives with a note of who it came from', () => {
  assert.equal(giveItem('Dagger\n', 'potions of healing', 2, 'Pip'), 'Dagger\n2 potions of healing (from Pip)');
  assert.equal(giveItem('', 'Rope', 1), 'Rope');
});
