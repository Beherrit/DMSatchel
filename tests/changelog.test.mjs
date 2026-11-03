import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changelog } from '../js/changelog.js';

test('changelog: shipped roadmap items, newest first', () => {
  const md = '# Roadmap\n\n## Now\n\n1. [x] **First thing.** Does a thing\n    over two lines.\n2. [ ] **Not yet.** Later.\n3. [x] **Third.** Done.\n\n## Log\n- 1 done\n';
  assert.deepEqual(changelog(md), [{ n: 3, title: 'Third', text: 'Done.' }, { n: 1, title: 'First thing', text: 'Does a thing over two lines.' }]);
  assert.deepEqual(changelog(''), []);
  const real = changelog(readFileSync(new URL('../ROADMAP.md', import.meta.url), 'utf8'));
  assert.ok(real.length > 250 && real[0].n > real[1].n && real.every((x) => x.title && x.text));
});

test('changelog strips inline markdown', () => {
  const [i] = changelog('5. [x] **A `b` c.** Uses **bold**, `code` and [a link](https://x.y).');
  assert.equal(i.title, 'A b c');
  assert.equal(i.text, 'Uses bold, code and a link.');
});

test('newSince counts changes past the last one seen', async () => {
  const { newSince, newest } = await import('../js/changelog.js');
  const items = [{ n: 7 }, { n: 5 }, { n: 3 }];
  assert.deepEqual(newSince(items, 5).map((i) => i.n), [7]);
  assert.deepEqual(newSince(items, '3').map((i) => i.n), [7, 5]);
  assert.deepEqual(newSince(items, null), []);
  assert.deepEqual(newSince(items, 'x'), []);
  assert.equal(newest(items), 7);
  assert.equal(newest([]), 0);
});
