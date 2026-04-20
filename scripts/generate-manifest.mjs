#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import addon from '../addon/addon.meta.mjs';
import { buildManifestFromAddonDefinition } from './stage1-addon-authoring.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const outputArg = rawArgs[0] && !rawArgs[0].startsWith('--')
  ? rawArgs[0]
  : null;

export function generateManifest() {
  return buildManifestFromAddonDefinition(addon);
}

export function writeManifest(outputPath) {
  const resolvedOutputPath = path.resolve(rootDir, outputPath ?? 'artifacts/tmp/manifest.json');
  const manifest = generateManifest();
  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    manifest,
    outputPath: resolvedOutputPath,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { outputPath } = writeManifest(outputArg);
  process.stdout.write(`${outputPath}\n`);
}
