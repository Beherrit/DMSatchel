import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPoll, castVote, tallyPoll } from '../js/polls.js';

test('a poll needs a question and two different choices', () => {
  assert.deepEqual(cleanPoll({ question: ' Where  next? ', options: 'The crypt\n\nThe tower\nThe crypt' }), { question: 'Where next?', options: ['The crypt', 'The tower'] });
  assert.match(cleanPoll({ question: '', options: ['a', 'b'] }).error, /question/);
  assert.match(cleanPoll({ question: 'x', options: ['a', 'a'] }).error, /two/);
  assert.equal(cleanPoll({ question: 'x', options: Array.from({ length: 12 }, (_, i) => `o${i}`) }).options.length, 8);
});

test('vote, change your mind, take it back', () => {
  let v = castVote({}, 7, 1, 2).votes;
  v = castVote(v, 8, 0, 2).votes;
  v = castVote(v, 7, 0, 2).votes;
  assert.deepEqual(v, { 7: 0, 8: 0 });
  assert.deepEqual(castVote(v, 8, null, 2).votes, { 7: 0 });
  assert.match(castVote(v, 7, 5, 2).error, /choices/);
});

test('tally with ties', () => {
  assert.deepEqual(tallyPoll({ options: ['a', 'b', 'c'], votes: { 1: 0, 2: 2, 3: 0, 4: 2 } }), { counts: [2, 0, 2], total: 4, leaders: [0, 2] });
  assert.deepEqual(tallyPoll({ options: ['a', 'b'], votes: {} }).leaders, []);
});
