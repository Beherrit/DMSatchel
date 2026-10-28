import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanDates, cleanVote, tally, untilText, MAX_DATES } from '../js/schedule.js';

test('proposed dates are real, unique, sorted and capped', () => {
  const d = (n) => new Date(Date.UTC(2030, 0, n, 19)).toISOString();
  assert.deepEqual(cleanDates([d(9), 'soon', d(2), d(9), null]), [d(2), d(9)]);
  assert.equal(cleanDates(Array.from({ length: 20 }, (_, i) => d(i + 1))).length, MAX_DATES);
  assert.deepEqual(cleanDates('nope'), []);
});

test('answers are one per date and only yes, maybe, no or blank', () => {
  assert.deepEqual(cleanVote(['yes', 'bogus', 'no', 'maybe'], 3), ['yes', '', 'no']);
  assert.deepEqual(cleanVote(null, 2), ['', '']);
});

test('the best date has the most yeses, then maybes, then comes first', () => {
  const poll = { dates: ['a', 'b', 'c'], votes: { 1: ['yes', 'maybe', 'yes'], 2: ['no', 'yes', 'yes'], 3: ['maybe', 'yes', 'yes'] } };
  const t = tally(poll, [1, 2, 3, 4]);
  assert.equal(t.best, 2);
  assert.deepEqual(t.rows[2].yes, ['1', '2', '3']);
  assert.equal(tally({ dates: ['a', 'b'], votes: { 1: ['yes', 'yes'], 2: ['maybe', 'yes'] } }, []).best, 1);
  assert.equal(tally({ dates: ['a', 'b'], votes: { 1: ['yes', 'yes'] } }, []).best, 0, 'a tie goes to the earlier date');
  assert.deepEqual(t.missing, ['4']);
  assert.equal(tally({ dates: ['a'], votes: { 1: ['no'] } }, [1]).best, null);
  assert.equal(tally({ dates: ['a', 'b'], votes: { 1: ['yes', 'yes'] } }, []).best, 0);
  assert.deepEqual(tally({ dates: ['a'], votes: { 1: [''] } }, [1]).missing, ['1']);
});

test('days until a date read naturally', () => {
  const now = new Date(2030, 0, 10, 12);
  assert.equal(untilText(new Date(2030, 0, 10, 20).toISOString(), now), 'today');
  assert.equal(untilText(new Date(2030, 0, 11, 9).toISOString(), now), 'tomorrow');
  assert.equal(untilText(new Date(2030, 0, 15, 9).toISOString(), now), 'in 5 days');
  assert.equal(untilText(new Date(2030, 0, 8, 9).toISOString(), now), '2 days ago');
});

import { splitCoins, coinText } from '../js/economy.js';
test('loot splits by shares in whole copper, and the rest stays in the treasury', () => {
  const r = splitCoins(10000, [{ id: 'a', shares: 1 }, { id: 'b', shares: 1 }, { id: 'c', shares: 1 }]);
  assert.deepEqual(r.each.map((x) => x.cp), [3333, 3333, 3333]); assert.equal(r.left, 1);
  const h = splitCoins(900, [{ id: 'a', shares: 2 }, { id: 'b', shares: 1 }, { id: 'x', shares: 0 }]);
  assert.deepEqual(h.each, [{ id: 'a', cp: 600 }, { id: 'b', cp: 300 }]); assert.equal(h.left, 0);
  assert.deepEqual(splitCoins(0, [{ id: 'a', shares: 1 }]).each, []);
  assert.equal(splitCoins(500, []).left, 500);
  assert.equal(coinText(3333), '33 gp 3 sp 3 cp');
});

import { titleFrom } from '../js/note-title.js';
test('quick notes get a title from their first words', () => {
  assert.equal(titleFrom('Mabel lied about the bell.\nMore later.'), 'Mabel lied about the bell.');
  assert.equal(titleFrom('[[Mabel|the innkeeper]] knows'), 'Mabel knows');
  assert.ok(titleFrom('x'.repeat(30) + ' ' + 'y'.repeat(40)).endsWith('…'));
  assert.equal(titleFrom('   '), 'Note');
});
