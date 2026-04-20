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

test('falls back to strict Spotify search when no direct track id exists and picks the exact artist/title match', async () => {
  const result = await querySpotifyDuration({
    identity: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
    settings: {
      client_id: 'spotify-client-id',
      client_secret: 'spotify-client-secret',
      default_market: 'US',
    },
    sdkFactory: () => ({
      search: async (query, itemTypes, market, limit) => {
        assert.equal(query, 'track:"Without You" artist:"Harry Nilsson"');
        assert.deepEqual(itemTypes, ['track']);
        assert.equal(market, 'US');
        assert.equal(limit, 10);
        return {
          tracks: {
            items: [
              {
                id: 'wrong-live-version',
                name: 'Without You (Live)',
                artists: [{ name: 'Harry Nilsson Tribute Band' }],
                duration_ms: 240000,
              },
              {
                id: '6jX8HLc8uwNFs9R6M9t0nE',
                name: 'Without You',
                artists: [{ name: 'Harry Nilsson' }],
                external_ids: {
                  isrc: 'USRC17101019',
                },
                duration_ms: 201000,
              },
            ],
          },
        };
      },
    }),
  });

  assert.equal(result.durationMs, 201000);
  assert.equal(result.providerDiagnostics.winnerLane, 'search');
  assert.equal(result.providerDiagnostics.searchResultCount, 2);
  assert.equal(result.providerDiagnostics.searchWinnerPromotedByIsrc, false);
});

test('lets ISRC promote the correct exact search match when multiple exact-normalized tracks exist', async () => {
  const result = await querySpotifyDuration({
    identity: {
      title: 'Without You',
      artist: 'Harry Nilsson',
      isrc: 'USRC17101019',
    },
    settings: {
      client_id: 'spotify-client-id',
      client_secret: 'spotify-client-secret',
      default_market: 'US',
    },
    sdkFactory: () => ({
      search: async () => ({
        tracks: {
          items: [
            {
              id: 'fallback-without-isrc',
              name: 'Without You',
              artists: [{ name: 'Harry Nilsson' }],
              duration_ms: 200000,
            },
            {
              id: 'winner-with-isrc',
              name: 'Without You',
              artists: [{ name: 'Harry Nilsson' }],
              external_ids: {
                isrc: 'USRC17101019',
              },
              duration_ms: 201000,
            },
          ],
        },
      }),
    }),
  });

  assert.equal(result.durationMs, 201000);
  assert.equal(result.providerDiagnostics.winnerTrackId, 'winner-with-isrc');
  assert.equal(result.providerDiagnostics.searchWinnerPromotedByIsrc, true);
});

test('rejects longer Spotify search candidates that are not an exact normalized artist/title match', async () => {
  const result = await querySpotifyDuration({
    identity: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
    settings: {
      client_id: 'spotify-client-id',
      client_secret: 'spotify-client-secret',
      default_market: 'US',
    },
    sdkFactory: () => ({
      search: async () => ({
        tracks: {
          items: [
            {
              id: 'wrong-live-version',
              name: 'Without You (Live)',
              artists: [{ name: 'Harry Nilsson Tribute Band' }],
              duration_ms: 240000,
            },
          ],
        },
      }),
    }),
  });

  assert.equal(result.durationMs, undefined);
  assert.equal(result.providerReason, 'duration_not_found');
  assert.equal(result.providerDiagnostics.searchRejected, 'no-exact-match');
});
