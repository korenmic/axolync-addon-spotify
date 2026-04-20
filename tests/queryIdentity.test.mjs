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

test('prefers normalized metadata-affinity Spotify track id before nested or raw fallback', () => {
  const result = resolveSpotifyQueryIdentity({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
      metadataAffinity: {
        providerFamily: 'spotify',
        providerIds: {
          spotifyTrackId: 'nested-track-id-would-be-invalid',
          spotifyUri: 'spotify:track:1111111111111111111111',
        },
      },
    },
    metadataAffinity: {
      providerFamily: 'spotify',
      providerIds: {
        spotifyTrackId: '6jX8HLc8uwNFs9R6M9t0nE',
        isrc: 'USRC17101019',
        spotifyMarket: 'il',
      },
    },
    raw: {
      spotify: {
        track: {
          id: '4uLU6hMCjMI75M1A2tKUQC',
          external_ids: {
            isrc: 'GBAYE6800011',
          },
        },
      },
    },
  });

  assert.equal(result.spotifyTrackId, '6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.spotifyUri, 'spotify:track:6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.spotifyTrackUrl, 'https://open.spotify.com/track/6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.isrc, 'USRC17101019');
  assert.equal(result.market, 'IL');
  assert.equal(result.diagnostics.normalizedAffinitySpotifyTrackId, '6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.diagnostics.nestedAffinitySpotifyTrackId, '1111111111111111111111');
  assert.equal(result.diagnostics.rawSpotifyTrackId, '4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(result.diagnostics.sourceProviderHint, 'spotify');
});

test('recovers Spotify identity from preserved raw payloads when normalized affinity is absent', () => {
  const result = resolveSpotifyQueryIdentity({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
    raw: {
      spotify: {
        track: {
          uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
          external_urls: {
            spotify: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=test',
          },
          external_ids: {
            isrc: 'USRC17101019',
          },
        },
        market: 'us',
      },
    },
  });

  assert.equal(result.spotifyTrackId, '4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(result.spotifyUri, 'spotify:track:4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(result.spotifyTrackUrl, 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(result.isrc, 'USRC17101019');
  assert.equal(result.market, 'US');
  assert.equal(result.diagnostics.sourceProviderHint, 'spotify');
});
