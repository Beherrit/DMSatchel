import test from 'node:test';
import assert from 'node:assert/strict';
import { nightRoll, tableRows } from '../js/camp.js';
import { makeRng } from '../js/rng.js';

test('trouble in the night', () => {
  assert.deepEqual(nightRoll(makeRng('x'), 0, ['Wolves']), { happens: false, row: null, roll: null, die: 0 });
  const rows = tableRows('1. Wolves\n2) A lost child\n\n3. Nothing but rain');
  assert.deepEqual(rows, ['Wolves', 'A lost child', 'Nothing but rain']);
  let n = 0;
  for (let s = 0; s < 600; s++) { const r = nightRoll(makeRng(`n${s}`), 6, rows); if (r.happens) { n++; assert.ok(rows.includes(r.row) && r.roll >= 1 && r.roll <= 3 && r.die === 3); } }
  assert.ok(n > 60 && n < 150, `about 1 in 6: ${n}`);
  const bare = nightRoll(makeRng('n1'), 1, []); assert.equal(bare.happens, true); assert.equal(bare.row, null);
});
