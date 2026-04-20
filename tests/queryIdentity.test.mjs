import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSpotifyQueryIdentity } from '../addon/runtime/songmetadata/queryIdentity.js';

test('keeps title and artist in the initial scaffold even before Spotify identity extraction lands', () => {
  const result = resolveSpotifyQueryIdentity({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
  });

  assert.equal(result.title, 'Without You');
  assert.equal(result.artist, 'Harry Nilsson');
  assert.equal(result.spotifyTrackId, null);
  assert.equal(result.spotifyUri, null);
  assert.equal(result.spotifyTrackUrl, null);
  assert.equal(result.isrc, null);
});
