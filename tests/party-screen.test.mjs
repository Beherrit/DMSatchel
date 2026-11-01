import test from 'node:test';
import assert from 'node:assert/strict';
import { screenRows } from '../js/party-screen.js';

test('screenRows: play state first, built stats behind it', () => {
  const [a, b, c] = screenRows([
    { id: 'a', name: 'Ann', about: 'Elf wizard 3', play: { hp: 12, maxhp: 20, temp: 3, ac: 15, cp: 1234, inventory: 'Rope\n7 Rations (1 day)\nLute', exhaustion: 1, conditions: ['Poisoned'] }, stats: { hp: 18, ac: 12, passive: 13 } },
    { id: 'b', name: 'Bo', play: {}, stats: { hp: 9, ac: 16, passive: 11 } },
    { id: 'c', name: 'Cy', play: { hp: 0, inventory: '' } },
  ]);
  const { load, goods, ...rest } = a;
  assert.equal(goods, 50 + 175 + 1750); // rope, 7 rations and a lute, at half price
  assert.deepEqual(rest, { id: 'a', name: 'Ann', about: 'Elf wizard 3', hp: 12, max: 20, temp: 3, ac: 15, passive: 13, cp: 1234, carry: 'Rope, 7 × Rations (1 day), Lute', exhaustion: 1, conditions: ['Poisoned'] });
  assert.equal(load.lb, 21.4); assert.equal(load.capacity, null);
  assert.equal(b.hp, 9); assert.equal(b.max, 9); assert.equal(b.ac, 16); assert.equal(b.passive, 11); assert.equal(b.carry, '');
  assert.equal(c.hp, 0); assert.equal(c.max, null); assert.equal(c.ac, null); assert.equal(c.passive, null);
  assert.deepEqual(screenRows(null), []);
});
