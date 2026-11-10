import test from 'node:test';
import assert from 'node:assert/strict';
import { journalWriters } from '../js/journal-streaks.js';

test('journalWriters: entries, the best run of sessions and the run going now', () => {
  const sessions = ['s1', 's2', 's3', 's4', 's5'];
  const w = journalWriters(sessions, [
    { author: 'Pip', about: ['s1'] }, { author: 'Pip', about: ['s2'] }, { author: 'Pip', about: ['s3'] }, { author: 'Pip', about: ['s5'] },
    { author: 'Bo', about: ['s4', 's5'] }, { author: 'Bo', about: [] }, { author: '', about: ['s1'] },
  ]);
  assert.deepEqual(w, [{ author: 'Pip', entries: 4, best: 3, now: 1 }, { author: 'Bo', entries: 2, best: 2, now: 2 }]);
  assert.deepEqual(journalWriters([], []), []);
});
