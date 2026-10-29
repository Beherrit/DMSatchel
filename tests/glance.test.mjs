import test from 'node:test';
import assert from 'node:assert/strict';
import { glanceOf } from '../js/glance.js';

test('a settlement at a glance', () => {
  const lord = { id: 'l', kind: 'npc', name: 'Lady Vex' }, guild = { id: 'g', kind: 'guild', name: 'Coin Guild' };
  const town = { id: 't', kind: 'settlement', name: 'Brindle', fields: { ruler: 'Lady Vex', size: 'Town', population: '2,400' } };
  const inside = [lord, { kind: 'npc', fields: { status: 'Dead' } }, { kind: 'npc' }, { kind: 'location', fields: { type: 'Shop' } }, { kind: 'location', fields: { type: 'Tavern' } },
    { kind: 'location', fields: { type: 'Ruin' } }, { kind: 'quest' }, { kind: 'quest', fields: { status: 'Completed' } }];
  const g = glanceOf(town, inside, { holder: { by: guild, inherited: true }, named: (n) => (n === 'Lady Vex' ? lord : null) });
  assert.deepEqual(g.facts.map((x) => [x.label, x.text, x.entry?.id || null]), [['Led by', 'Lady Vex', 'l'], ['Held by', 'Coin Guild', 'g'], ['Size', 'Town, 2,400', null]]);
  assert.equal(g.facts[1].note, 'through the land around it');
  assert.deepEqual(g.counts.map((c) => `${c.n} ${c.label}`), ['2 people', '2 shops', '1 open job']);
  // The leader and the holder being the same power shows once.
  const same = glanceOf({ fields: { ruler: 'Coin Guild' } }, [], { holder: { by: guild }, named: () => guild });
  assert.deepEqual(same.facts.map((x) => x.label), ['Led by']);
  assert.deepEqual(glanceOf({}, []).facts, []);
});
