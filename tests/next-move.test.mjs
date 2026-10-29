import test from 'node:test';
import assert from 'node:assert/strict';
import { tallyMoves } from '../js/next-move.js';

test('what the party wants to do next', () => {
  const Q = { a: { id: 'a', kind: 'quest', name: 'Wolves', fields: { status: 'Active' } }, b: { id: 'b', kind: 'quest', name: 'Lost Ring', fields: {} }, c: { id: 'c', kind: 'quest', name: 'Old', fields: { status: 'Completed' } }, n: { id: 'n', kind: 'npc', name: 'Tam' } };
  const t = tallyMoves([{ name: 'Pip', quest_id: 'a' }, { name: 'Bo', quest_id: 'b' }, { name: 'Ann', quest_id: 'a' }, { name: 'Cy', quest_id: 'c' }, { name: 'Di', quest_id: 'n' }, { name: 'Ed', quest_id: 'zz' }, { name: 'Fy', quest_id: null }], (id) => Q[id]);
  assert.deepEqual(t.picks.map((p) => [p.quest.name, p.names]), [['Wolves', ['Ann', 'Pip']], ['Lost Ring', ['Bo']]]);
  assert.equal(t.split, true); assert.equal(t.total, 3);
  assert.equal(tallyMoves([{ name: 'Pip', quest_id: 'a' }], (id) => Q[id]).split, false);
  assert.deepEqual(tallyMoves(null, () => null), { picks: [], split: false, total: 0 });
});
