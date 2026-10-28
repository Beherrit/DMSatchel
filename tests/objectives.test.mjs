import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readObjectives, forPlayers, progress, addObjective, updateObjective, removeObjective, moveObjective } from '../js/objectives.js';

test('objectives: add, tick, hide, move, remove, and what players see', () => {
  let list = addObjective([], 'Find the bell');
  list = addObjective(list, 'Learn who drowned it', true);
  list = addObjective(list, 'Ring it at midnight');
  const [a, b, c] = list.map((o) => o.id);
  list = updateObjective(list, a, { done: true });
  assert.deepEqual(progress(list), { done: 1, total: 3, pct: 33 });
  list = moveObjective(list, c, -1);
  assert.deepEqual(list.map((o) => o.id), [a, c, b]);
  assert.equal(moveObjective(list, a, -1), list, 'cannot move past the top');
  const quest = { fields: { objectives: JSON.stringify(list) } };
  assert.equal(readObjectives(quest).length, 3);
  const seen = JSON.parse(forPlayers(quest.fields.objectives));
  assert.deepEqual(seen.map((o) => o.text), ['Find the bell', 'Ring it at midnight']);
  assert.equal(removeObjective(list, b).length, 2);
  assert.deepEqual(readObjectives({ fields: { objectives: 'nonsense' } }), []);
  assert.deepEqual(readObjectives({ fields: { objectives: '[{"text":"  "},{"text":"ok","done":1}]' } }), [{ id: '', text: 'ok', done: true, secret: false }]);
  assert.deepEqual(progress([]), { done: 0, total: 0, pct: 0 });
});
