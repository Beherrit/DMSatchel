import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionText } from '../js/session-text.js';

test('sessionText: plain text for a chat', () => {
  const s = { name: 'Session 2', summary: 'The bell rang.', body: '## The inn\nMet [[Ann]] at the [[Inn|old inn]]. **Loud** night.\n> Read this aloud', fields: { played_on: '2026-11-01', world_date: '5 Thawmoon 1040', next: 'Find [[Bo]].' } };
  assert.equal(sessionText(s), 'Session 2 (2026-11-01 · 5 Thawmoon 1040)\n\nThe bell rang.\n\nThe inn\nMet Ann at the old inn. Loud night.\nRead this aloud\n\nNext time: Find Bo.');
  assert.equal(sessionText({ name: 'Session 1', body: '' }), 'Session 1');
  assert.equal(sessionText(null), '');
});
