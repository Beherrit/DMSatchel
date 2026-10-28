import test from 'node:test';
import assert from 'node:assert/strict';
import { readGoals, goalsForOthers, addGoal, setGoal, removeGoal, activeGoals } from '../js/goals.js';

test('goals are read safely from the character', () => {
  const c = { fields: { goals: JSON.stringify([{ id: 'a', text: 'Find my sister', term: 'long', state: 'weird', secret: 1 }, { text: ' ' }, null]) } };
  assert.deepEqual(readGoals(c), [{ id: 'a', text: 'Find my sister', term: 'long', state: 'open', secret: true }]);
  assert.deepEqual(readGoals({ fields: { goals: 'not json' } }), []);
});

test('secret goals are kept from the rest of the party', () => {
  const raw = JSON.stringify([{ id: 'a', text: 'x', secret: true }, { id: 'b', text: 'y' }]);
  assert.deepEqual(JSON.parse(goalsForOthers(raw)).map((g) => g.id), ['b']);
});

test('add, advance, finish and remove', () => {
  let l = addGoal([], ' Pay off the debt ', 'long');
  l = addGoal(l, 'Win the duel', 'short', true);
  assert.deepEqual(activeGoals(l).map((g) => g.text), ['Win the duel', 'Pay off the debt']);
  l = setGoal(l, l[1].id, { state: 'done' }, 't1');
  assert.equal(l[1].at, 't1');
  assert.deepEqual(activeGoals(l).map((g) => g.text), ['Pay off the debt']);
  l = setGoal(l, l[1].id, { text: 'Win the duel fairly' }, 't2');
  assert.equal(l[1].at, 't1');
  assert.equal(removeGoal(l, l[0].id).length, 1);
});
