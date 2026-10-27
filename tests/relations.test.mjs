import { test } from 'node:test';
import assert from 'node:assert/strict';
import { between, setBetween, tally, tensions } from '../js/relations.js';

const F = (id, links = []) => ({ id, kind: 'faction', name: id, links: links.map(([label, to, secret]) => ({ id: to, label, secret: Boolean(secret) })) });

test('a connection either way counts; secrets only for GMs', () => {
  const a = F('a', [['ally of', 'b']]), b = F('b', [['secretly works for', 'c']]), c = F('c');
  assert.equal(between(b, a).rel.key, 'ally');
  assert.equal(between(b, c).rel.key, 'secret');
  assert.equal(between(b, c, { withSecret: false }), null);
  assert.equal(between(a, c), null);
});

test('setting a relation replaces the old one on both sides and keeps other links', () => {
  const a = F('a', [['ally of', 'b'], ['located in', 'b']]), b = F('b', [['rival of', 'a']]);
  const { aLinks, bLinks } = setBetween(a, b, 'war');
  assert.deepEqual(aLinks.map((l) => l.label).sort(), ['at war with', 'located in']);
  assert.deepEqual(bLinks, []);
  const cleared = setBetween({ ...a, links: aLinks }, { ...b, links: bLinks }, null);
  assert.deepEqual(cleared.aLinks.map((l) => l.label), ['located in']);
});

test('tallies and tensions', () => {
  const p = F('p', [['ally of', 'x'], ['ally of', 'y']]), x = F('x', [['at war with', 'y']]), y = F('y');
  const t = tally([p, x, y]);
  assert.equal(t.get('p').ally, 2); assert.equal(t.get('y').war, 1);
  const ts = tensions([p, x, y]);
  assert.equal(ts.length, 1); assert.equal(ts[0].power.id, 'p'); assert.equal(ts[0].rel.key, 'war');
});
