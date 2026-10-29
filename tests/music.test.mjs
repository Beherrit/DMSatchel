import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanMusic, musicSite, musicFor } from '../js/music.js';

test('only https links are kept', () => {
  assert.equal(cleanMusic(' https://youtu.be/abc '), 'https://youtu.be/abc');
  assert.equal(cleanMusic('http://x.test/a'), '');
  assert.equal(cleanMusic('javascript:alert(1)'), '');
  assert.equal(cleanMusic('https://localhost/a'), '');
  assert.equal(cleanMusic('not a link'), '');
});

test('names the site, and finds the nearest music up the chain', () => {
  assert.equal(musicSite('https://www.youtube.com/watch?v=1'), 'YouTube');
  assert.equal(musicSite('https://open.spotify.com/playlist/1'), 'Spotify');
  assert.equal(musicSite('https://tabletopaudio.com/'), 'Tabletop Audio');
  assert.equal(musicSite('https://example.org/x'), 'example.org');
  const inn = { name: 'Inn', fields: {} }, town = { name: 'Town', fields: { music: 'https://youtu.be/t' } };
  assert.deepEqual(musicFor([inn, town]), { url: 'https://youtu.be/t', from: town });
  assert.equal(musicFor([inn]), null);
});
