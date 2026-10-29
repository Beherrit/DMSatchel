import test from 'node:test';
import assert from 'node:assert/strict';
import { qrMatrix, qrVersion, qrPath } from '../js/qr.js';

// Decoding is checked with an independent decoder (jsQR) outside the test suite; here, the shape of the code.
test('picks the smallest version and draws the fixed patterns', () => {
  assert.deepEqual([qrVersion(14), qrVersion(15), qrVersion(62), qrVersion(63), qrVersion(213), qrVersion(214)], [1, 2, 4, 5, 10, 0]);
  const m = qrMatrix('https://dmsatchel.vercel.app/#join/PLAY-BBBB-2222');
  assert.equal(m.length, 33); // version 4
  const finder = (x, y) => [0, 6].every((d) => m[y][x + d] && m[y + d][x]) && m[y + 1][x + 1] === false && m[y + 3][x + 3];
  assert.ok(finder(0, 0) && finder(26, 0) && finder(0, 26));
  for (let i = 8; i < 25; i++) assert.equal(m[6][i], i % 2 === 0); // timing
  assert.equal(m[25][8], true); // the always-dark module
  assert.deepEqual(qrMatrix('same'), qrMatrix('same'));
  assert.equal(qrMatrix('x'.repeat(300)), null);
  assert.equal(qrPath([[true, false], [false, true]]).size, 10);
});
