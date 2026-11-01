import test from 'node:test';
import assert from 'node:assert/strict';
import { readTab, addTab, tabTotal, tabLine } from '../js/tab.js';

test('a tab at the tavern', () => {
  let j = addTab('', { who: 'Ann', item: 'Pale ale', qty: 2, cp: 8, at: 't1' });
  j = addTab(j, { who: 'Bo', item: 'Rabbit pie', cp: 12, at: 't2' });
  const list = readTab(j);
  assert.equal(list.length, 2); assert.equal(tabTotal(list), 20);
  assert.equal(tabLine(list[0]), 'Ann: 2 × Pale ale (8 cp)');
  assert.deepEqual(readTab('nope'), []);
});
