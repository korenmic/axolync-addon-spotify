import test from 'node:test';
import assert from 'node:assert/strict';
import { querySpotifyDuration } from '../addon/runtime/songmetadata/spotifyClient.js';

test('uses the official client-credentials wrapper for direct track lookup', async () => {
  const result = await querySpotifyDuration({
    identity: {
      spotifyTrackId: '6jX8HLc8uwNFs9R6M9t0nE',
      title: 'Without You',
      artist: 'Harry Nilsson',
      market: 'IL',
    },
    settings: {
      client_id: 'spotify-client-id',
      client_secret: 'spotify-client-secret',
      default_market: 'US',
    },
    sdkFactory: (settings) => {
      assert.equal(settings.client_id, 'spotify-client-id');
      assert.equal(settings.client_secret, 'spotify-client-secret');
      return {
        tracks: {
          get: async (trackId, market) => {
            assert.equal(trackId, '6jX8HLc8uwNFs9R6M9t0nE');
            assert.equal(market, 'IL');
            return {
              id: trackId,
              uri: 'spotify:track:6jX8HLc8uwNFs9R6M9t0nE',
              external_urls: {
                spotify: 'https://open.spotify.com/track/6jX8HLc8uwNFs9R6M9t0nE',
              },
              duration_ms: 201000,
            };
          },
        },
      };
    },
  });

  assert.equal(result.durationMs, 201000);
  assert.equal(result.providerDiagnostics.winnerLane, 'track-id');
  assert.equal(result.providerDiagnostics.effectiveMarket, 'IL');
  assert.deepEqual(result.providerDiagnostics.attemptedLanes, ['track-id']);
});

test('returns auth_not_configured when Spotify client credentials are absent', async () => {
  const result = await querySpotifyDuration({
    identity: {
      spotifyTrackId: '6jX8HLc8uwNFs9R6M9t0nE',
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
  });

  assert.equal(result.durationMs, undefined);
  assert.equal(result.providerReason, 'auth_not_configured');
  assert.equal(result.providerDiagnostics.failureReason, 'auth_not_configured');
  assert.deepEqual(result.providerDiagnostics.attemptedLanes, ['none']);
});
