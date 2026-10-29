import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanReading, readingFor, MAX_READING } from '../js/reading.js';

test('the reading list', () => {
  assert.deepEqual(cleanReading(['a', 'a', '', null, 'b', 'gone'], (id) => id !== 'gone'), ['a', 'b']);
  assert.equal(cleanReading(Array.from({ length: 20 }, (_, i) => `e${i}`)).length, MAX_READING);
  assert.deepEqual(cleanReading('nope'), []);
  const sees = (id) => id !== 'hidden';
  assert.deepEqual(readingFor(['a', 'hidden', 'b'], sees, new Set(['b'])), [{ id: 'a', read: false }, { id: 'b', read: true }]);
  assert.deepEqual(readingFor(['a', 'b'], () => true, new Map([['a', ['Pip']]])), [{ id: 'a', read_by: ['Pip'] }, { id: 'b', read_by: [] }]);
});
