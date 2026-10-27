import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KINDS, KIND_ORDER, isKind } from '../js/world-schema.js';

test('every kind is listed once and has fields', () => {
  assert.deepEqual([...KIND_ORDER].sort(), Object.keys(KINDS).sort());
  for (const k of KIND_ORDER) {
    assert.ok(KINDS[k].label && KINDS[k].plural);
    const keys = KINDS[k].fields.map(([f]) => f);
    assert.equal(new Set(keys).size, keys.length, k);
    for (const [, , type, opts] of KINDS[k].fields) if (type === 'select') assert.ok(opts.length);
  }
  assert.ok(isKind('faction') && isKind('guild') && isKind('clan'));
  assert.ok(!isKind('__proto__'));
});
