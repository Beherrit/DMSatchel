import test from 'node:test';
import assert from 'node:assert/strict';
import { posterOf, headlineFor, MAX_ON_POSTER, wantedFor } from '../js/poster.js';

test('headlines in the voice of the posters', () => {
  assert.equal(headlineFor({ name: 'Wolves at the mill' }), 'BOUNTY');
  assert.equal(headlineFor({ name: 'The miller’s daughter', summary: 'She has gone missing.' }), 'MISSING');
  assert.equal(headlineFor({ name: 'Caravan to Highmoor' }), 'GUARDS WANTED');
  assert.equal(headlineFor({ name: 'A letter for the abbot' }), 'COURIER NEEDED');
  assert.equal(headlineFor({ name: 'Mend the bridge' }), 'HELP WANTED');
});

test('only posted jobs, plain text, a full board says how many more', () => {
  const town = { name: 'Brindle', fields: { ruler: 'Lady Vex' } };
  const quests = [
    { id: 'a', kind: 'quest', name: 'Wolves at the mill', summary: 'Five **grey** wolves. See [[Old Tam]].', fields: { reward: '50 gp', patron: 'Old Tam' } },
    { id: 'b', kind: 'quest', name: 'Taken already', fields: { status: 'Active' } },
    { id: 'c', kind: 'quest', name: 'Just a rumor', fields: { status: 'Rumor' } },
    { id: 'd', kind: 'npc', name: 'Not a job' },
    { id: 'e', kind: 'quest', name: 'Hidden job', visibility: 'gm' },
  ];
  const p = posterOf(town, quests, { date: '3 Thawmoon 1040' });
  assert.equal(p.title, 'Notices of Brindle'); assert.equal(p.by, 'By leave of Lady Vex'); assert.equal(p.date, '3 Thawmoon 1040');
  assert.deepEqual(p.jobs.map((j) => [j.headline, j.name, j.reward, j.ask]), [['BOUNTY', 'Wolves at the mill', '50 gp', 'Old Tam']]);
  assert.ok(!/\*|\[\[/.test(p.jobs[0].text), p.jobs[0].text);
  const many = Array.from({ length: 11 }, (_, i) => ({ id: `q${i}`, kind: 'quest', name: `Job ${String(i).padStart(2, '0')}` }));
  const full = posterOf({ name: 'X' }, many);
  assert.equal(full.jobs.length, MAX_ON_POSTER); assert.equal(full.more, 3); assert.equal(full.by, '');
});

test('wanted posters', () => {
  const town = { id: 't', name: 'Brindle', fields: { ruler: 'Lady Vex' } };
  const N = (id, name, fields, extra = {}) => ({ id, kind: 'npc', name, fields, ...extra });
  const guild = { id: 'g', kind: 'guild', name: 'Coin Guild' };
  const all = [N('a', 'Black Jack', { bounty: '100 gp', bounty_by: 'Lady Vex', appearance: 'A scar across one **eye**.' }), N('b', 'Mad Ola', { bounty: '50 gp', bounty_by: 'coin guild' }),
    N('c', 'Far Away', { bounty: '20 gp', bounty_by: 'Highmoor' }), N('d', 'Hidden', { bounty: '5 gp' }, { visibility: 'gm' }), N('e', 'Gone', { bounty: '5 gp', bounty_by: 'Brindle', status: 'Dead' }),
    N('f', 'Local Thief', { bounty: '10 gp' }), N('h', 'Honest', {})];
  const inside = [guild, all[5], all[6]];
  const w = wantedFor(town, all, inside);
  assert.deepEqual(w.map((x) => x.name), ['Black Jack', 'Local Thief', 'Mad Ola']);
  assert.equal(w[0].text, 'A scar across one eye.'); assert.equal(w[0].reward, '100 gp'); assert.equal(w[0].by, 'Lady Vex');
  assert.equal(posterOf(town, [], { wanted: w }).wanted.length, 3);
  assert.deepEqual(posterOf(town, []).wanted, []);
});
