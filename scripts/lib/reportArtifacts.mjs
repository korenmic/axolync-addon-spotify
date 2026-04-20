import fs from 'node:fs';
import path from 'node:path';
import addon from '../../addon/addon.meta.mjs';
import { buildManifestFromAddonDefinition } from '../stage1-addon-authoring.mjs';

export function buildTrackedReportManifest() {
  return buildManifestFromAddonDefinition(addon);
}

export function buildAdapterInventory() {
  return {
    pluginId: addon.addonId,
    adapters: addon.adapters.map((adapter) => ({
      id: adapter.adapterId,
      label: adapter.label,
      runtimeCodeState: 'local-js',
      shippableInRelease: true,
      shippableInDebug: true,
      hiddenInUi: false,
      defaultEnabled: true,
      notes: 'Stage 1 Spotify-backed SongMetadata adapter using the official TypeScript SDK for direct track lookup with strict bounded search fallback.',
    })),
  };
}

function writeJson(outputPath, payload) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return outputPath;
}

export function writeTrackedReportArtifacts({ rootDir }) {
  const reportManifestPath = writeJson(
    path.join(rootDir, 'report', 'addon-manifest.spotify.json'),
    buildTrackedReportManifest(),
  );
  const adapterInventoryPath = writeJson(
    path.join(rootDir, 'adapter-inventory.json'),
    buildAdapterInventory(),
  );

  return {
    reportManifestPath,
    adapterInventoryPath,
  };
}
