import test from 'node:test';
import assert from 'node:assert/strict';
import { answersOf, isRight, readSolved, addSolver, hintsOf, shownHints } from '../js/riddle.js';

test('isRight: any case, spacing, punctuation, a leading article, several answers', () => {
  assert.ok(isRight('  An Echo! ', 'echo'));
  assert.ok(isRight('the river', 'A river|stream'));
  assert.ok(isRight('Stream.', 'A river|stream'));
  assert.ok(isRight('café', 'cafe'));
  assert.ok(!isRight('rivers', 'river'));
  assert.ok(!isRight('', 'echo'));
  assert.deepEqual(answersOf('a | b ||'), ['a', 'b']);
});

test('solvers and hints', () => {
  let s = addSolver('', 'Pip', 't1'); s = addSolver(JSON.stringify(s), 'Bo', 't2'); s = addSolver(JSON.stringify(s), 'Pip', 't3');
  assert.deepEqual(s, [{ name: 'Pip', at: 't1' }, { name: 'Bo', at: 't2' }]);
  assert.deepEqual(readSolved('nonsense'), []);
  assert.deepEqual(shownHints('It answers back\nIn caves\n\nIt has no voice of its own', 2), ['It answers back', 'In caves']);
  assert.deepEqual(shownHints('a\nb', 9), ['a', 'b']);
  assert.equal(hintsOf('').length, 0);
});
