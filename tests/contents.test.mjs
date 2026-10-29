import test from 'node:test';
import assert from 'node:assert/strict';
import { headingsOf, contentsOf } from '../js/contents.js';

test('headings get readable, unique ids', () => {
  const t = '## History\n\nOld.\n\n## The **Silver** Hand\n\n## History\n\n## [[Brindle|Our town]]\n\n## ???';
  assert.deepEqual(headingsOf(t), [
    { label: 'History', id: 'sec-history' }, { label: 'The Silver Hand', id: 'sec-the-silver-hand' }, { label: 'History', id: 'sec-history-2' },
    { label: 'Our town', id: 'sec-our-town' }, { label: '???', id: 'sec-part' }]);
});

test('contents only with three or more parts', () => {
  assert.deepEqual(contentsOf('## A\n\n## B'), []);
  assert.equal(contentsOf('## A\n\n## B\n\n## C').length, 3);
  assert.deepEqual(contentsOf(''), []);
});
