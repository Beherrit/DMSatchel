import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanQuote, quotedMost, QUOTE_MAX } from '../js/quotes.js';

test('cleanQuote trims quote marks and spaces, and needs a line', () => {
  assert.deepEqual(cleanQuote({ text: '  “I lick the  door.” ', said_by: ' Pip ', session_id: 's1' }), { text: 'I lick the door.', said_by: 'Pip', session_id: 's1' });
  assert.deepEqual(cleanQuote({ text: '""' }), { error: 'Write the line first.' });
  assert.ok(cleanQuote({ text: 'x'.repeat(QUOTE_MAX + 1) }).error);
  assert.equal(cleanQuote({ text: 'Hi' }).session_id, null);
});

test('quotedMost counts by person, ignoring case', () => {
  assert.deepEqual(quotedMost([{ said_by: 'pip ' }, { said_by: 'Pip' }, { said_by: 'Bo' }, { said_by: '' }]), [['Pip', 2], ['Bo', 1]]);
});
