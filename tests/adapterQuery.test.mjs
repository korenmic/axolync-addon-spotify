import test from 'node:test';
import assert from 'node:assert/strict';
import { SpotifySongMetadataAdapter } from '../addon/adapters/SpotifySongMetadataAdapter/index.js';

test('returns auth_not_configured until addon-owned Spotify credentials are provided', async () => {
  const adapter = new SpotifySongMetadataAdapter();
  const result = await adapter.query_song_metadata({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
  });

  assert.equal(result.durationMs, undefined);
  assert.equal(result.providerReason, 'auth_not_configured');
  assert.equal(result.providerDiagnostics.failureReason, 'auth_not_configured');
  assert.equal(result.providerDiagnostics.title, 'Without You');
  assert.equal(result.providerDiagnostics.artist, 'Harry Nilsson');
});

test('forwards normalized Spotify identity hints into the provider query implementation', async () => {
  let receivedIdentity = null;
  const adapter = new SpotifySongMetadataAdapter({
    queryDurationImpl: async ({ identity }) => {
      receivedIdentity = identity;
      return {
        durationMs: 201000,
        providerDiagnostics: {
          winnerLane: 'track-id',
        },
      };
    },
  });

  const result = await adapter.query_song_metadata({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
    metadataAffinity: {
      providerFamily: 'spotify',
      providerIds: {
        spotifyTrackUrl: 'https://open.spotify.com/track/6jX8HLc8uwNFs9R6M9t0nE?si=test',
      },
    },
  });

  assert.equal(receivedIdentity.spotifyTrackId, '6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(receivedIdentity.spotifyUri, 'spotify:track:6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(receivedIdentity.spotifyTrackUrl, 'https://open.spotify.com/track/6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.durationMs, 201000);
  assert.equal(result.providerDiagnostics.winnerLane, 'track-id');
});
