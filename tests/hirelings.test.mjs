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

test('payWages: what the treasury can cover, and what is owed', async () => {
  const { payWages, owedTo } = await import('../js/hirelings.js');
  const gil = { name: 'Gil' }, mags = { name: 'Mags' };
  const list = [{ entry: gil, wage: 20 }, { entry: mags, wage: 200 }];
  assert.deepEqual(payWages(list, 3, 10000), { paid: [{ entry: gil, cp: 60 }, { entry: mags, cp: 600 }], owed: [], total: 660, short: 0 });
  const lean = payWages(list, 3, 300);
  assert.deepEqual(lean.paid, [{ entry: gil, cp: 60 }, { entry: mags, cp: 240 }]); assert.deepEqual(lean.owed, [{ entry: mags, cp: 360 }]); assert.equal(lean.short, 360);
  assert.deepEqual(payWages(list, 2, -50).owed.map((x) => x.cp), [40, 400]);
  assert.equal(owedTo({ fields: { owed: '360' } }), 360); assert.equal(owedTo({ fields: {} }), 0);
});
