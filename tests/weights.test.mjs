import test from 'node:test';
import assert from 'node:assert/strict';
import { weightOf, coinWeight, capacityOf, loadOf } from '../js/weights.js';

test('weightOf: names as players write them', () => {
  assert.equal(weightOf('Rations (1 day)'), 2);
  assert.equal(weightOf('Chain mail'), 55);
  assert.equal(weightOf('Elven chain mail'), 55);
  assert.equal(weightOf('+1 Longsword'), 3);
  assert.equal(weightOf('Arrows (20)'), 1);
  assert.equal(weightOf('arrows'), 0.05);
  assert.equal(weightOf('Iron spikes (10)'), 5);
  assert.equal(weightOf('Potions of healing'), 0.5);
  assert.equal(weightOf('Dungeoneer’s pack'), 55);
  assert.equal(weightOf('Torches'), 1);
  assert.equal(weightOf('Hempen rope (50 feet)'), 5);
  assert.equal(weightOf('Mystery box'), null);
});

test('coins at fifty to the pound, carrying capacity, and the load', () => {
  assert.deepEqual(coinWeight(2350), { coins: 28, lb: 0.56 });
  assert.deepEqual(coinWeight(0), { coins: 0, lb: 0 });
  assert.equal(capacityOf(15), 225); assert.equal(capacityOf(10, 'Tiny'), 75); assert.equal(capacityOf(18, 'Large'), 540); assert.equal(capacityOf(null), null);
  assert.deepEqual(loadOf({ inventory: 'Chain mail\n20 arrows\n7 Rations (1 day)\nMystery box', cp: 2350 }, 15), { lb: 70.6, items: 70, coins: 0.6, unknown: ['Mystery box'], capacity: 225, over: false });
  assert.equal(loadOf({ inventory: 'Plate armor\n4 Barrel' }, 8).over, true);
  assert.equal(loadOf({}, null).capacity, null);
  const kit = loadOf({ inventory: 'Chain mail, greatsword, flail, 8 javelins, dungeoneer’s pack, 4 GP' }, 15);
  assert.equal(kit.items, 55 + 6 + 2 + 16 + 55); assert.equal(kit.coins, 0.1); assert.deepEqual(kit.unknown, []);
  assert.equal(loadOf({ inventory: '8 javelins, rope' }).items, 21);
});

test('loadText', async () => {
  const { loadText } = await import('../js/weights.js');
  assert.equal(loadText({ lb: 70.6, capacity: 225, unknown: ['Mystery box'], over: false }), 'Carrying 70.6 lb of 225 lb (not counted: Mystery box)');
  assert.equal(loadText({ lb: 290, capacity: 225, unknown: [], over: true }), 'Over carrying capacity: 290 lb of 225 lb');
  assert.equal(loadText({ lb: 12, capacity: null, unknown: ['a', 'b', 'c', 'd', 'e', 'f'], over: false }), 'Carrying 12 lb (not counted: a, b, c, d and 2 more)');
});

test('overloaded: who is too heavy for the road', async () => {
  const { overloaded, overloadedText } = await import('../js/weights.js');
  const list = overloaded([{ name: 'Hand', play: { inventory: 'Plate armor\n4 Barrel' }, str: 8 }, { name: 'Vex', play: { inventory: 'Rope' }, str: 15 }, { name: 'Odd', play: { inventory: 'Plate armor\n9 Barrel' } }]);
  assert.deepEqual(list, [{ name: 'Hand', lb: 345, capacity: 120 }]);
  assert.equal(overloadedText(list), 'Too heavy for the road: Hand carries 345 lb (can carry 120 lb).');
  assert.equal(overloadedText([]), '');
});

test('loadAfter: would buying it make them too heavy?', async () => {
  const { loadAfter } = await import('../js/weights.js');
  const r = loadAfter({ inventory: 'Chain mail', cp: 0 }, 'Barrel', 3, 0, 15);
  assert.equal(r.before.over, false); assert.equal(r.after.over, true); assert.equal(r.after.lb, 55 + 210);
  assert.equal(loadAfter({ inventory: '' }, 'Rope', 1, 0, 15).after.over, false);
});
