import test from 'node:test';
import assert from 'node:assert/strict';
import { SpotifySongMetadataAdapter } from '../addon/adapters/SpotifySongMetadataAdapter/index.js';

test('returns scaffold diagnostics while Spotify runtime lookup is still being implemented', async () => {
  const adapter = new SpotifySongMetadataAdapter();
  const result = await adapter.query_song_metadata({
    song: {
      title: 'Without You',
      artist: 'Harry Nilsson',
    },
  });

  assert.equal(result.durationMs, undefined);
  assert.equal(result.providerReason, 'not_implemented');
  assert.equal(result.providerDiagnostics.failureReason, 'not_implemented');
  assert.equal(result.providerDiagnostics.title, 'Without You');
  assert.equal(result.providerDiagnostics.artist, 'Harry Nilsson');
});
