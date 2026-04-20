#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeManifest } from './generate-manifest.mjs';
import { writeTrackedReportArtifacts } from './lib/reportArtifacts.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { outputPath: manifestPath } = writeManifest();
const reportArtifacts = writeTrackedReportArtifacts({ rootDir });

process.stdout.write(`${JSON.stringify({
  ok: true,
  manifestPath,
  reportManifestPath: reportArtifacts.reportManifestPath,
  adapterInventoryPath: reportArtifacts.adapterInventoryPath,
}, null, 2)}\n`);
