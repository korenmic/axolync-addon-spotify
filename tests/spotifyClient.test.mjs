import test from 'node:test';
import assert from 'node:assert/strict';
import { querySpotifyDuration } from '../addon/runtime/songmetadata/spotifyClient.js';

test('returns scaffold diagnostics until the Spotify runtime client lands', async () => {
  const result = await querySpotifyDuration({
    identity: {
      spotifyTrackId: '6jX8HLc8uwNFs9R6M9t0nE',
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
  });

  assert.equal(result.durationMs, undefined);
  assert.equal(result.providerReason, 'not_implemented');
  assert.equal(result.providerDiagnostics.failureReason, 'not_implemented');
  assert.equal(result.providerDiagnostics.spotifyTrackId, '6jX8HLc8uwNFs9R6M9t0nE');
  assert.equal(result.providerDiagnostics.clientIdConfigured, false);
  assert.equal(result.providerDiagnostics.clientSecretConfigured, false);
});
