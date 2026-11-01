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
  { const r = livingCosts([{ id: 'a' }, { id: 'b' }], 5, 'Comfortable', 10000); assert.deepEqual([r.total, r.paid, r.short], [2000, 2000, 0]); }
  { const r = livingCosts([{ id: 'a' }, { id: 'b' }], 5, 'Comfortable', 1500); assert.deepEqual([r.total, r.paid, r.short], [2000, 1500, 500]); }
});

test('each character’s own lifestyle', () => {
  const chars = [{ id: 'n', name: 'Noble', cp: 100000, lifestyle: 'Wealthy' }, { id: 'r', name: 'Ranger', cp: 1000, lifestyle: 'Wretched' }, { id: 'x', name: 'Plain', cp: 1000 }, { id: 'y', name: 'Odd', cp: 1000, lifestyle: 'Royal' }];
  const r = livingCosts(chars, 2, 'Modest');
  assert.deepEqual(r.each.map((x) => [x.name, x.lifestyle, x.owed]), [['Noble', 'Wealthy', 800], ['Ranger', 'Wretched', 0], ['Plain', 'Modest', 200], ['Odd', 'Modest', 200]]);
  assert.equal(livingCosts(chars, 2, 'Modest', 100000).total, 1200);
});
