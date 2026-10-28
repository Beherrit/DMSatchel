import test from 'node:test';
import assert from 'node:assert/strict';
import { inline, blocks, stripMarks } from '../js/rich.js';

test('inline marks and links', () => {
  assert.deepEqual(inline('Meet **[[Ann]]** at *dawn*, not _dusk_.'), [
    { t: 'text', v: 'Meet ' }, { t: 'b', c: [{ t: 'link', name: 'Ann', label: 'Ann' }] }, { t: 'text', v: ' at ' },
    { t: 'i', c: [{ t: 'text', v: 'dawn' }] }, { t: 'text', v: ', not ' }, { t: 'i', c: [{ t: 'text', v: 'dusk' }] }, { t: 'text', v: '.' }]);
  assert.deepEqual(inline('[[Mayor Vane|the mayor]]'), [{ t: 'link', name: 'Mayor Vane', label: 'the mayor' }]);
});

test('things that are not formatting stay as they are', () => {
  assert.deepEqual(inline('2 * 3 * 4 and snake_case_name and a * star'), [{ t: 'text', v: '2 * 3 * 4 and snake_case_name and a * star' }]);
});

test('blocks: lists, headings, read-aloud boxes and paragraphs', () => {
  const b = blocks('## The Inn\n\nYou enter.\nIt is dark.\n\n> The fire crackles.\n> A man waves.\n\n- Ale\n- Stew\n\n1. Ask\n2. Pay');
  assert.deepEqual(b.map((x) => x.t), ['h', 'p', 'quote', 'ul', 'ol']);
  assert.equal(b[1].lines.length, 2);
  assert.equal(b[2].lines[1][0].v, 'A man waves.');
  assert.equal(b[3].items[1][0].v, 'Stew');
});

test('stripping the marks', () => {
  assert.equal(stripMarks('**Bold** [[Ann|she]] said *hi*\n> boxed\n## Head'), 'Bold she said hi\nboxed\nHead');
});
