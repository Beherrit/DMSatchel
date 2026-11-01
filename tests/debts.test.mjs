import test from 'node:test';
import assert from 'node:assert/strict';
import { readDebts, shiftDebt, balanceWith } from '../js/debts.js';

test('debts: lend, pay back, clear', () => {
  const ann = {}, bo = {};
  shiftDebt(ann, { id: 'b', name: 'Bo' }, 1000, 'for the boat', 't1'); shiftDebt(bo, { id: 'a', name: 'Ann' }, -1000, 'for the boat', 't1');
  assert.deepEqual(readDebts(ann), [{ id: 'b', name: 'Bo', cp: 1000, note: 'for the boat', at: 't1' }]);
  assert.equal(balanceWith(bo, 'a'), -1000);
  shiftDebt(ann, { id: 'b', name: 'Bo' }, -400, '', 't2');
  assert.equal(balanceWith(ann, 'b'), 600); assert.equal(readDebts(ann)[0].note, 'for the boat');
  shiftDebt(ann, { id: 'b', name: 'Bo' }, -600);
  assert.deepEqual(readDebts(ann), []); assert.deepEqual(ann.debts, {});
  assert.deepEqual(readDebts({ debts: [1, 2] }), []); assert.deepEqual(readDebts(null), []);
  const many = {}; for (let i = 1; i <= 45; i++) shiftDebt(many, { id: `c${i}`, name: `C${i}` }, i * 100);
  assert.equal(readDebts(many).length, 40); assert.equal(balanceWith(many, 'c1'), 0); assert.equal(balanceWith(many, 'c45'), 4500);
});
