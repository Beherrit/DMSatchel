import test from 'node:test';
import assert from 'node:assert/strict';
import { shopsDue } from '../js/restock.js';

test('which shops are due a delivery', () => {
  const S = (name, fields) => ({ name, kind: 'location', fields });
  const list = [S('Smithy', { stock: 'x', restocked: '100' }), S('Bakery', { stock: 'x', restocked: '95' }), S('Old Shop', { stock: 'x' }), S('Empty', { restocked: '1' }), S('Odd', { stock: 'x', restocked: 'soon' })];
  assert.deepEqual(shopsDue(list, 103).map((s) => s.name), ['Bakery', 'Odd', 'Old Shop']);
  assert.deepEqual(shopsDue(list, 107).map((s) => s.name), ['Bakery', 'Odd', 'Old Shop', 'Smithy']);
  assert.deepEqual(shopsDue(list, 103, 3).map((s) => s.name), ['Bakery', 'Odd', 'Old Shop', 'Smithy']);
});
