import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fogGrid, newFog, encodeFog, decodeFog, cleanFog, paintFog, fogHides, hiddenShare } from '../js/fog.js';

test('grid follows the map shape', () => {
  assert.deepEqual(fogGrid(1600, 1000), { cols: 64, rows: 40 });
  assert.deepEqual(fogGrid(500, 2000), { rows: 64, cols: 16 });
  assert.deepEqual(fogGrid(4000, 100), { cols: 64, rows: 8 });
});

test('fog bits survive encoding, and match Node’s base64', () => {
  for (const [cols, rows] of [[64, 40], [7, 3], [1, 1], [96, 96]]) {
    const cells = newFog(cols, rows, false);
    for (let i = 0; i < cells.length; i += 3) cells[i] = 1;
    const s = encodeFog(cells);
    assert.deepEqual([...decodeFog(s, cells.length)], [...cells]);
    const bytes = new Uint8Array(Math.ceil(cells.length / 8)); cells.forEach((v, i) => { if (v) bytes[i >> 3] |= 1 << (i & 7); });
    assert.equal(s, Buffer.from(bytes).toString('base64'));
    assert.ok(cleanFog({ on: true, cols, rows, bits: s }));
  }
  assert.equal(cleanFog({ on: true, cols: 4, rows: 4, bits: 'AAAAAAAA' }), null, 'wrong length');
  assert.equal(cleanFog({ cols: 500, rows: 4, bits: '' }), null);
  assert.equal(cleanFog({ cols: 2, rows: 2, bits: '<b>' }), null);
});

test('a brush reveals a round patch, and pins under fog are hidden', () => {
  const cols = 20, rows = 10, cells = newFog(cols, rows, true);
  const fog = { on: true, cols, rows };
  assert.ok(paintFog(cells, cols, rows, 0.5, 0.5, 3, 0) > 20);
  assert.equal(fogHides(fog, cells, 0.5, 0.5), false);
  assert.equal(fogHides(fog, cells, 0.05, 0.05), true);
  assert.equal(fogHides({ ...fog, on: false }, cells, 0.05, 0.05), false);
  assert.equal(fogHides(fog, cells, 1, 1), true, 'edges clamp');
  assert.ok(hiddenShare(cells) < 1 && hiddenShare(cells) > 0.5);
  assert.equal(paintFog(cells, cols, rows, 0.5, 0.5, 3, 0), 0, 'painting the same again changes nothing');
});
