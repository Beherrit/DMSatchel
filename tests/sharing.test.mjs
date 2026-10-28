import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanShare, sharedWith } from '../js/sharing.js';

test('share lists are whole member ids without repeats', () => {
  assert.deepEqual(cleanShare([7, '7', 8, -1, 'x', 2.5, null]), [7, 8]);
  assert.deepEqual(cleanShare('7'), []);
});

test('who an entry is shared with', () => {
  assert.equal(sharedWith({ shared_with: [7, 8] }, 7), true);
  assert.equal(sharedWith({ shared_with: [7, 8] }, '8'), true);
  assert.equal(sharedWith({ shared_with: [7] }, 9), false);
  assert.equal(sharedWith({ shared_with: null }, 7), false);
  assert.equal(sharedWith({ shared_with: [7] }, null), false);
});
