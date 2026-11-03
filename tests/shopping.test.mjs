import test from 'node:test';
import assert from 'node:assert/strict';
import { readList, addToList, removeFromList, answers, listFirst, MAX_SHOPPING } from '../js/shopping.js';

test('a shopping list', () => {
  let l = readList({});
  l = addToList(l, ' Rope '); l = addToList(l, 'rope'); l = addToList(l, 'Healing potion'); l = addToList(l, '');
  assert.deepEqual(l, ['Rope', 'Healing potion']);
  assert.deepEqual(removeFromList(l, 0), ['Healing potion']);
  assert.equal(Array.from({ length: 30 }).reduce((acc, _, i) => addToList(acc, `x${i}`), []).length, MAX_SHOPPING);
  assert.ok(answers('rope', 'Hempen rope (50 ft)') && answers('healing potion', 'Potion of healing') && !answers('sword', 'Longsword'));
  const items = [{ name: 'Lantern' }, { name: 'Potion of healing' }, { name: 'Hempen rope' }];
  assert.deepEqual(listFirst(items, l).map((x) => `${x.name}${x.wanted ? '*' : ''}`), ['Potion of healing*', 'Hempen rope*', 'Lantern']);
  assert.deepEqual(readList({ shopping: ['A', '', 3] }), ['A', '3']);
});

test('a packing list: rations for the trip', async () => {
  const { withRations, answers } = await import('../js/shopping.js');
  assert.ok(answers('Rations × 3', 'Rations (1 day)'));
  assert.ok(answers('2 rope', 'Hempen rope (50 feet)'));
  assert.deepEqual(withRations(['Rope', 'rations'], 3), ['Rope', 'Rations × 3']);
  assert.deepEqual(withRations(['Rope', 'Rations × 1'], 4), ['Rope', 'Rations × 4']);
  assert.deepEqual(withRations([], 2), ['Rations × 2']);
  assert.deepEqual(withRations(['Rations × 2'], 0), []);
});

test('shopsFor: the shops that stock it, cheapest first', async () => {
  const { shopsFor } = await import('../js/shopping.js');
  const shops = [{ id: 'a', name: 'Smithy', stock: 'Rope | 2 gp | 3 in stock\nLantern | 5 gp | 1 in stock' }, { id: 'b', name: 'Chandler', stock: 'Hempen rope (50 ft) | 1 gp | available' }, { id: 'c', name: 'Baker', stock: 'Bread | 2 cp | available' }];
  assert.deepEqual(shopsFor('rope', shops).map((x) => `${x.shop.name}:${x.item}:${x.cp}`), ['Chandler:Hempen rope (50 ft):100', 'Smithy:Rope:200']);
  assert.deepEqual(shopsFor('Rations × 2', shops), []);
});

test('tripPlan groups everyone\'s lists by shop', async () => {
  const { tripPlan } = await import('../js/shopping.js');
  const shops = [{ id: 's', name: 'Smithy', stock: 'Rope | 2 gp | 3\nDagger | 2 gp | 1' }, { id: 'c', name: 'Chandler', stock: 'Hempen rope (50 ft) | 1 gp | 5' }];
  const plan = tripPlan([{ who: 'Ann', lines: ['rope', 'Unicorn horn'] }, { who: 'Bo', lines: ['dagger'] }], shops);
  assert.deepEqual(plan.stops.map((s) => [s.shop.name, s.wants.map((w) => `${w.who}:${w.item}:${w.cp}`)]), [['Smithy', ['Ann:Rope:200', 'Bo:Dagger:200']], ['Chandler', ['Ann:Hempen rope (50 ft):100']]]);
  assert.deepEqual(plan.missing, [{ who: 'Ann', line: 'Unicorn horn' }]);
  assert.deepEqual(tripPlan([], shops), { stops: [], missing: [] });
});
