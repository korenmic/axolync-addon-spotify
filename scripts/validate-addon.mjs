#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import addon from '../addon/addon.meta.mjs';
import { buildManifestFromAddonDefinition } from './stage1-addon-authoring.mjs';
import { buildAdapterInventory, buildTrackedReportManifest } from './lib/reportArtifacts.mjs';
import { createStage1PackageScaffold, validateStage1PackageScaffold } from './lib/packageScaffold.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = buildManifestFromAddonDefinition(addon);
const trackedReportManifestPath = path.join(rootDir, 'report', 'addon-manifest.spotify.json');
const trackedInventoryPath = path.join(rootDir, 'adapter-inventory.json');

const trackedReportManifest = JSON.parse(fs.readFileSync(trackedReportManifestPath, 'utf8'));
const trackedInventory = JSON.parse(fs.readFileSync(trackedInventoryPath, 'utf8'));

if (JSON.stringify(trackedReportManifest) !== JSON.stringify(buildTrackedReportManifest())) {
  throw new Error('Tracked report/addon-manifest.spotify.json drift detected.');
}

if (JSON.stringify(trackedInventory) !== JSON.stringify(buildAdapterInventory())) {
  throw new Error('Tracked adapter-inventory.json drift detected.');
}

const validationOutputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'axolync-addon-spotify-validate-'));

try {
  const scaffold = await createStage1PackageScaffold({
    rootDir,
    manifest,
    outputRoot: validationOutputRoot,
  });
  const validation = await validateStage1PackageScaffold({
    manifest,
    packageDir: scaffold.packageDir,
  });
  process.stdout.write(`${JSON.stringify({
    ok: true,
    addonId: addon.addonId,
    adapterCount: manifest.addon.adapters.length,
    trackedReportManifestPath,
    trackedInventoryPath,
    fileCount: validation.relativeFiles.length,
  }, null, 2)}\n`);
} finally {
  fs.rmSync(validationOutputRoot, { recursive: true, force: true });
}
