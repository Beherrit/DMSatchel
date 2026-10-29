import test from 'node:test';
import assert from 'node:assert/strict';
import { REACTIONS, isReaction, reactionsOut, toggleReaction } from '../js/reactions.js';

test('toggling and showing reactions', () => {
  let r = toggleReaction(null, '😂', 7, 'Pip', true);
  r = toggleReaction(r, '😂', 8, 'Bo', true);
  r = toggleReaction(r, '👍', 7, 'Pip', true);
  assert.deepEqual(reactionsOut(r, 7), [{ emoji: '👍', count: 1, names: ['Pip'], mine: true }, { emoji: '😂', count: 2, names: ['Pip', 'Bo'], mine: true }]);
  r = toggleReaction(r, '👍', 7, 'Pip', false);
  assert.deepEqual(Object.keys(r), ['😂']);
  assert.equal(reactionsOut(r, 9)[0].mine, false);
  assert.deepEqual(reactionsOut('junk', 1), []);
  assert.ok(isReaction('🎲') && !isReaction('💩') && REACTIONS.length === 5);
});
