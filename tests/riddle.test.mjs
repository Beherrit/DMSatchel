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

test('wrong guesses: newest last, the last 30', async () => {
  const { addGuess, readGuesses } = await import('../js/riddle.js');
  let g = addGuess('', 'Pip', ' a shadow ', 't1'); g = addGuess(JSON.stringify(g), 'Bo', 'silence', 't2');
  assert.deepEqual(g, [{ name: 'Pip', text: 'a shadow', at: 't1' }, { name: 'Bo', text: 'silence', at: 't2' }]);
  let many = ''; for (let i = 0; i < 40; i++) many = JSON.stringify(addGuess(many, 'x', `g${i}`, String(i)));
  assert.equal(readGuesses(many).length, 30); assert.equal(readGuesses(many)[0].text, 'g10');
});
