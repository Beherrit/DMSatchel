import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../js/rng.js';
import { neighbors, spreadRumors, reach, retell, truthOf } from '../js/rumors.js';

const E = (id, kind, name, extra = {}) => ({ id, kind, name, fields: {}, links: [], parent_id: null, ...extra });
const world = [
  E('r', 'region', 'The Marches'), E('a', 'area', 'Blackfen', { parent_id: 'r' }), E('b', 'area', 'Highmoor', { parent_id: 'r' }),
  E('t1', 'settlement', 'Brindle', { parent_id: 'a' }), E('t2', 'settlement', 'Fenmoor', { parent_id: 'a' }), E('t3', 'settlement', 'Cragton', { parent_id: 'b' }),
  E('t4', 'settlement', 'Faraway', { links: [{ id: 't1', label: 'trades with' }] }), E('n1', 'npc', 'Mabel'), E('n2', 'npc', 'Old Bram'),
  E('x', 'rumor', 'Wolves', { parent_id: 't1', summary: 'Mabel saw 3 wolves on the old road.' }),
];

test('neighbors: linked, same area, same region', () => {
  const n = neighbors(world.find((e) => e.id === 't1'), world);
  assert.equal(n.get('t4'), 0.6); assert.equal(n.get('t2'), 0.5); assert.equal(n.get('t3'), 0.25); assert.ok(!n.has('t1'));
});

test('rumors spread over rounds and reach every connected town', () => {
  const rng = makeRng('spread');
  let entries = world.map((e) => ({ ...e, fields: { ...e.fields } }));
  for (let i = 0; i < 12; i++) {
    for (const c of spreadRumors(entries, rng)) entries = entries.map((e) => (e.id === c.rumor.id ? { ...e, fields: { ...e.fields, spread: JSON.stringify(c.spread) } } : e));
  }
  const r = reach(entries.find((e) => e.id === 'x'));
  assert.deepEqual(Object.keys(r).sort(), ['t1', 't2', 't3', 't4']);
  assert.equal(r.t1.hops, 0);
  assert.ok(Object.values(r).every((v) => typeof v.text === 'string' && v.text.length));
});

test('retellings say where they came from and keep changing', () => {
  const rng = makeRng('tell');
  const t = retell('Mabel saw 3 wolves on the old road.', { rng, from: 'Brindle', names: ['Mabel', 'Old Bram'] });
  assert.match(t, /Brindle/);
  assert.equal(truthOf({ secret: 'Truth: Partly true. The wolves are real.' }), 'Partly true');
  assert.equal(truthOf({ secret: '' }), null);
});
