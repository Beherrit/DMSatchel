import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partyBonds, withBond } from '../js/bonds.js';

test('bonds are connections between characters with bond labels', () => {
  const a = { id: 'a', kind: 'character', name: 'Brann', links: [{ id: 'b', label: 'rival of' }, { id: 'n1', label: 'sibling of' }, { id: 'b', label: 'related to' }] };
  const b = { id: 'b', kind: 'character', name: 'Vex', links: [{ id: 'a', label: 'owes a debt to' }] };
  const n = { id: 'n1', kind: 'npc', name: 'Mabel', links: [] };
  assert.deepEqual(partyBonds([a, b, n]).map((x) => `${x.from.name} ${x.label} ${x.to.name}`), ['Brann rival of Vex', 'Vex owes a debt to Brann']);
  const links = withBond(a, 'b', 'sworn to protect');
  assert.deepEqual(links.filter((l) => l.id === 'b').map((l) => l.label), ['rival of', 'related to', 'sworn to protect'], 'a new bond is added beside the others');
  assert.equal(withBond(a, 'b', 'rival of').filter((l) => l.label === 'rival of').length, 1, 'the same bond is not doubled');
  assert.deepEqual(withBond(a, 'b', null).filter((l) => l.id === 'b').map((l) => l.label), ['related to'], 'removing keeps other connections');
});
