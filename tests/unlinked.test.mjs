import test from 'node:test';
import assert from 'node:assert/strict';
import { unlinkedIn, linkNames } from '../js/unlinked.js';

const E = (id, kind, name) => ({ id, kind, name });
const ents = [E('a', 'npc', 'Ann'), E('b', 'npc', 'Bramwell'), E('v', 'npc', 'Lord Vane'), E('w', 'npc', 'Vane'), E('i', 'location', 'The Bell'), E('s', 'session', 'Session 1')];

test('unlinkedIn finds plain names, not linked ones, whole words only', () => {
  const t = 'Met [[Bramwell]] at The Bell. Bramwell said Lord Vane is coming. Bramwellson laughed. Vane again.';
  assert.deepEqual(unlinkedIn(t, ents).map((x) => [x.entry.name, x.count]), [['Lord Vane', 1], ['Bramwell', 1], ['The Bell', 1], ['Vane', 1]]);
  assert.deepEqual(unlinkedIn('Ann waved.', ents), []); // short names are left alone
  assert.deepEqual(unlinkedIn('', ents), []);
});

test('linkNames links the plain mentions and keeps the links there', () => {
  const t = 'Met [[Bramwell]] at The Bell. Bramwell said Lord Vane is coming.';
  assert.equal(linkNames(t, [ents[1], ents[2], ents[4]]), 'Met [[Bramwell]] at [[The Bell]]. [[Bramwell]] said [[Lord Vane]] is coming.');
  assert.equal(linkNames('Lord Vane and Vane.', [ents[2], ents[3]]), '[[Lord Vane]] and [[Vane]].');
});
