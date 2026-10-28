import test from 'node:test';
import assert from 'node:assert/strict';
import { readGallery, cleanGallery, addPictures, setCaption, removePicture, movePicture, MAX_PICTURES } from '../js/gallery.js';

const A = '/api/images?id=0123456789abcdef', B = 'https://example.com/b.png';

test('only real image addresses are kept', () => {
  const raw = JSON.stringify([{ src: A, caption: '  North   gate ' }, { src: 'javascript:alert(1)' }, { src: B }, null, 'x']);
  assert.deepEqual(JSON.parse(cleanGallery(raw)), [{ src: A, caption: 'North gate' }, { src: B, caption: '' }]);
  assert.equal(cleanGallery('not json'), '');
  assert.equal(cleanGallery('[]'), '');
  assert.equal(readGallery({ fields: { gallery: raw } }).length, 2);
});

test('add, caption, move and remove; never more than twelve', () => {
  let l = addPictures([], [A, B]);
  l = setCaption(l, 1, 'Back door');
  l = movePicture(l, 1, -1);
  assert.deepEqual(l.map((p) => p.caption), ['Back door', '']);
  assert.deepEqual(movePicture(l, 0, -1), l);
  assert.equal(removePicture(l, 0)[0].src, A);
  assert.equal(addPictures(l, Array(20).fill(A)).length, MAX_PICTURES);
});
