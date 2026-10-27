import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relations, familyOf, relativesOf, layout } from '../js/family.js';

const P = (id, name, links = []) => ({ id, kind: 'npc', name, links: links.map(([label, to]) => ({ label, id: to })) });
const people = [
  P('g1', 'Old Aldric', [['married to', 'g2'], ['parent of', 'p1'], ['parent of', 'p2']]), P('g2', 'Old Bea'),
  P('p1', 'Corin', [['married to', 's1']]), P('s1', 'Dana'), P('p2', 'Edda'),
  P('k1', 'Finn', [['child of', 'p1'], ['child of', 's1']]), P('k2', 'Gwen', [['sibling of', 'k1']]),
  P('x', 'Stranger'),
];

test('relations read every family label', () => {
  const r = relations(people);
  assert.equal(r.parents.length, 4); assert.equal(r.spouses.length, 2); assert.equal(r.siblings.length, 1);
});

test('a family is everyone connected by blood or marriage', () => {
  const f = familyOf('k2', people);
  assert.deepEqual([...f].sort(), ['g1', 'g2', 'k1', 'k2', 'p1', 'p2', 's1']);
  assert.ok(!f.has('x'));
});

test('relatives of one person, siblings through shared parents', () => {
  const r = relativesOf('p1', people);
  assert.deepEqual(r.parents, ['g1']); assert.deepEqual(r.children, ['k1']); assert.deepEqual(r.spouses, ['s1']); assert.deepEqual(r.siblings, ['p2']);
});

test('generations stack and spouses sit together', () => {
  const { rows, pos } = layout([...familyOf('g1', people)], people);
  assert.equal(rows.length, 3);
  assert.equal(pos.get('g1').y, 0); assert.equal(pos.get('g2').y, 0); assert.equal(pos.get('s1').y, 1); assert.equal(pos.get('k2').y, 2);
  assert.equal(Math.abs(pos.get('p1').x - pos.get('s1').x), 1);
});
