import test from 'node:test';
import assert from 'node:assert/strict';
import { livingCosts, perDay, LIFESTYLES } from '../js/lifestyle.js';

test('living costs come out of each purse, never below nothing', () => {
  assert.equal(perDay('Modest'), 100); assert.equal(perDay('Aristocratic'), 1000); assert.equal(perDay('nonsense'), 100);
  assert.equal(LIFESTYLES.length, 7);
  const r = livingCosts([{ id: 'a', name: 'Ann', cp: 5000 }, { id: 'b', name: 'Bo', cp: 250 }], 7, 'Modest');
  assert.deepEqual(r.each.map((x) => [x.name, x.owed, x.paid, x.short]), [['Ann', 700, 700, 0], ['Bo', 700, 250, 450]]);
  assert.equal(r.total, 950);
  assert.equal(livingCosts([{ id: 'a', cp: 10 }], 3, 'Wretched').total, 0);
  assert.equal(livingCosts([{ id: 'a', cp: 10 }], -2, 'Modest').total, 0);
});

test('or the treasury pays for everyone', () => {
  assert.deepEqual(livingCosts([{ id: 'a' }, { id: 'b' }], 5, 'Comfortable', 10000), { each: [], total: 2000, paid: 2000, short: 0 });
  assert.deepEqual(livingCosts([{ id: 'a' }, { id: 'b' }], 5, 'Comfortable', 1500), { each: [], total: 2000, paid: 1500, short: 500 });
});
