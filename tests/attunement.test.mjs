import test from 'node:test';
import assert from 'node:assert/strict';
import { readAttuned, setAttuned, attunedOf, attunedText } from '../js/attunement.js';

test('attuned items', () => {
  let l = setAttuned([], 'Cloak of Protection', true);
  l = setAttuned(l, 'Ring of Warmth', true);
  l = setAttuned(l, 'cloak of protection', true);
  assert.deepEqual(l, ['Ring of Warmth', 'cloak of protection']);
  assert.deepEqual(setAttuned(l, 'Ring of warmth', false), ['cloak of protection']);
  assert.deepEqual(attunedOf(l, ['Cloak of Protection']), ['cloak of protection']);
  assert.deepEqual(readAttuned({ attuned: ['A', '', 3] }), ['A', '3']); assert.deepEqual(readAttuned({}), []);
  assert.equal(attunedText(2), 'Attuned to 2 of 3'); assert.equal(attunedText(4), 'Attuned to 4 of 3: one too many');
});
