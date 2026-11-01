import test from 'node:test';
import assert from 'node:assert/strict';
import { readAsks, addAsk, dropAsk, shelfLine } from '../js/shop-asks.js';
import { stockItems } from '../js/purchase.js';

test('ask the shopkeeper', () => {
  let j = addAsk('', { by: 'Ann', item: 'Grappling hook', at: 't1' });
  j = addAsk(j, { by: 'Bo', item: 'Spyglass', at: 't2' });
  j = addAsk(j, { by: 'Cy', item: 'grappling HOOK', at: 't3' });
  assert.deepEqual(readAsks(j), [{ at: 't2', by: 'Bo', item: 'Spyglass' }, { at: 't3', by: 'Cy', item: 'grappling HOOK' }]);
  assert.deepEqual(readAsks(dropAsk(j, 'spyglass')).map((x) => x.item), ['grappling HOOK']);
  assert.equal(addAsk(j, { item: '  ' }), j);
  assert.equal(shelfLine('Grappling hook', 200), 'Grappling hook | 2 gp | 1 in stock');
  assert.deepEqual(stockItems(shelfLine('Spyglass', 100000, 2)).map((x) => [x.name, x.cp, x.qty]), [['Spyglass', 100000, 2]]);
  assert.deepEqual(stockItems(shelfLine('Chalk', 1)).map((x) => [x.name, x.cp]), [['Chalk', 1]]);
});
