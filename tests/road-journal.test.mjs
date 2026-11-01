import test from 'node:test';
import assert from 'node:assert/strict';
import { roadJournal } from '../js/road-journal.js';

test('a day on the road, written up', () => {
  const j = roadJournal({ from: 'Brindle', to: 'Sedge', miles: 59.6, days: 4, pace: 'Normal', weather: 'Heavy rain, 12°C (54°F), wind calm or light.', slowed: 'heavy rain', arrived: '5 Thawmoon 1040' }, 4);
  assert.equal(j.name, 'On the road to Sedge'); assert.equal(j.kind, 'journal'); assert.deepEqual(j.fields, { kind: 'Party notes', date: '5 Thawmoon 1040' });
  assert.ok(j.body.startsWith('The party travelled from Brindle to Sedge: 60 miles in 4 days at a normal pace.'));
  assert.ok(j.body.includes('They set out in heavy rain, 12°C (54°F), wind calm or light, and heavy rain slowed them down.'));
  assert.ok(j.body.includes('Each ate 4 days’ worth of rations'));
  const k = roadJournal({ from: 'A', to: 'B', miles: 30, days: 1, pace: 'Fast' });
  assert.ok(k.body.includes('in 1 day at a fast pace.') && !k.body.includes('rations') && !k.body.includes('set out'));
});
