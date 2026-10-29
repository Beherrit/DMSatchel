import test from 'node:test';
import assert from 'node:assert/strict';
import { CONDITION_TEXT, conditionLine } from '../js/conditions.js';
import { CONDITIONS } from '../js/conditions.js';

test('every condition on the sheet has a description', () => {
  for (const c of CONDITIONS) assert.ok(CONDITION_TEXT[c]?.length, c);
  assert.ok(CONDITION_TEXT.Exhaustion.length);
  assert.match(conditionLine('Poisoned'), /Disadvantage/);
  assert.equal(conditionLine('Nope'), '');
});
