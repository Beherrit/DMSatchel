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
