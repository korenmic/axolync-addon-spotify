import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdapterInventory, buildTrackedReportManifest } from '../scripts/lib/reportArtifacts.mjs';

test('tracked report artifacts describe one shippable Stage 1 SongMetadata addon', () => {
  const manifest = buildTrackedReportManifest();
  const inventory = buildAdapterInventory();

  assert.equal(manifest.addon.addon_id, 'axolync-addon-spotify');
  assert.equal(manifest.addon.contracts_version, '2.0.0');
  assert.equal(manifest.addon.adapters.length, 1);
  assert.deepEqual(manifest.addon.adapters[0].query_methods.songmetadata, ['query_song_metadata']);
  assert.equal(inventory.pluginId, 'axolync-addon-spotify');
  assert.equal(inventory.adapters[0].runtimeCodeState, 'placeholder');
  assert.equal(inventory.adapters[0].shippableInRelease, false);
});
