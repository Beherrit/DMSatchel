import test from 'node:test';
import assert from 'node:assert/strict';
import { similarNames } from '../js/name-check.js';

const E = (id, name) => ({ id, name });
const world = [E('b', 'Brindle'), E('r', 'The Red Hand'), E('m', 'Mayor Aldous Vane'), E('o', 'Ox'), E('c', 'Café Lumière')];
const names = (r) => [r.exact.map((e) => e.id), r.close.map((e) => e.id)];

test('same name, ignoring case, "the" and punctuation', () => {
  assert.deepEqual(names(similarNames('brindle', world)), [['b'], []]);
  assert.deepEqual(names(similarNames('Red Hand', world)), [['r'], []]);
  assert.deepEqual(names(similarNames('cafe lumiere!', world)), [['c'], []]);
});

test('close names: a typo, a plural, or a name inside a longer one', () => {
  assert.deepEqual(names(similarNames('Brindel', world)), [[], ['b']]);
  assert.deepEqual(names(similarNames('Brindles', world)), [[], ['b']]);
  assert.deepEqual(names(similarNames('Aldous Vane', world)), [[], ['m']]);
});

test('short or unrelated names, and the entry itself, are left alone', () => {
  assert.deepEqual(names(similarNames('Ox', world)), [[], []]);
  assert.deepEqual(names(similarNames('Bramble', world)), [[], []]);
  assert.deepEqual(names(similarNames('Brindle', world, 'b')), [[], []]);
});
