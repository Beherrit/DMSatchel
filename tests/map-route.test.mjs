import test from 'node:test';
import assert from 'node:assert/strict';
import { legMiles, routeMiles, milesText } from '../js/map-route.js';

test('distances follow the scale and the map’s shape', () => {
  assert.equal(legMiles({ x: 0, y: 0 }, { x: 0.5, y: 0 }, 100), 50);
  assert.equal(legMiles({ x: 0, y: 0 }, { x: 0, y: 1 }, 100, 0.5), 50); // a wide map: its height is half its width
  assert.equal(Math.round(legMiles({ x: 0, y: 0 }, { x: 0.3, y: 0.4 }, 100)), 50);
});

test('a route adds its legs', () => {
  const r = routeMiles([{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.1, y: 0.2 }], 200, 1);
  assert.deepEqual(r.legs.map(Math.round), [20, 40]);
  assert.equal(Math.round(r.total), 60);
  assert.deepEqual(routeMiles([{ x: 0, y: 0 }], 100), { total: 0, legs: [] });
});

test('readable miles', () => {
  assert.equal(milesText(0.43), '0.4 miles');
  assert.equal(milesText(1), '1 mile');
  assert.equal(milesText(1234.6), '1,235 miles');
});

test('travelDayOptions: whole days per pace, nothing for a short hop', async () => {
  const { travelDayOptions } = await import('../js/map-route.js');
  const { travel } = await import('../js/encounters.js');
  assert.deepEqual(travelDayOptions(travel(60)), [['Fast', 2], ['Normal', 3], ['Slow', 4]]);
  assert.deepEqual(travelDayOptions(travel(5)), []);
});
