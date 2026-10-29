import test from 'node:test';
import assert from 'node:assert/strict';
import { rsvpSummary, rsvpOpen } from '../js/rsvp.js';

test('answers count only for the date they were given for', () => {
  const next = '2026-10-31T19:00:00.000Z';
  const members = [{ id: 1, name: 'Ann', rsvp: { for: '2026-10-31T19:00:00Z', answer: 'yes' } }, { id: 2, name: 'Bo', rsvp: { for: next, answer: 'no' } },
    { id: 3, name: 'Cy', rsvp: { for: '2026-10-24T19:00:00Z', answer: 'yes' } }, { id: 4, name: 'Di' }];
  assert.deepEqual(rsvpSummary(members, next, 3), { mine: null, yes: ['Ann'], no: ['Bo'], waiting: ['Cy', 'Di'] });
  assert.equal(rsvpSummary(members, next, 1).mine, 'yes');
  assert.ok(rsvpOpen(next, Date.parse('2026-10-30T00:00:00Z')) && !rsvpOpen(next, Date.parse('2026-11-02T00:00:00Z')) && !rsvpOpen(null));
});
