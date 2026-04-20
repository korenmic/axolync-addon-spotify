#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import addon from '../addon/addon.meta.mjs';
import { generateManifest } from './generate-manifest.mjs';
import { createStage1PackageScaffold, validateStage1PackageScaffold, assembleFinalStage1Package } from './lib/packageScaffold.mjs';
import { writeTrackedReportArtifacts } from './lib/reportArtifacts.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(rootDir, 'artifacts', 'output', 'local_js');
const manifest = generateManifest();
const reportArtifacts = writeTrackedReportArtifacts({ rootDir });
const scaffold = await createStage1PackageScaffold({
  rootDir,
  manifest,
  outputRoot,
});
const validation = await validateStage1PackageScaffold({
  manifest,
  packageDir: scaffold.packageDir,
});
const finalPackage = assembleFinalStage1Package({
  addonId: addon.addonId,
  outputRoot,
  packageDir: scaffold.packageDir,
});

process.stdout.write(`${JSON.stringify({
  manifestPath: scaffold.manifestPath,
  reportManifestPath: reportArtifacts.reportManifestPath,
  adapterInventoryPath: reportArtifacts.adapterInventoryPath,
  packageDir: scaffold.packageDir,
  zipPath: finalPackage.zipPath,
  files: validation.relativeFiles,
}, null, 2)}\n`);
