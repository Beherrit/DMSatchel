import test from 'node:test';
import assert from 'node:assert/strict';
import { payroll, wageOf, isHired } from '../js/hirelings.js';

test('the payroll', () => {
  const N = (name, fields) => ({ kind: 'npc', name, fields });
  const list = [N('Tam', { hired: 'yes', wage: '2 sp' }), N('Ola', { hired: 'yes', wage: '2 gp' }), N('Gone', { hired: 'yes', wage: '2 gp', status: 'Dead' }), N('Free', { wage: '5 gp' }), { kind: 'character', name: 'Pip', fields: { hired: 'yes' } }];
  const p = payroll(list, 3);
  assert.deepEqual(p.list.map((x) => [x.entry.name, x.wage]), [['Ola', 200], ['Tam', 20]]);
  assert.equal(p.perDay, 220); assert.equal(p.total, 660);
  assert.equal(payroll(list, -1).total, 0);
  assert.equal(wageOf(N('x', { wage: 'nonsense' })), 0);
  assert.equal(isHired(N('x', { hired: 'no' })), false);
});
