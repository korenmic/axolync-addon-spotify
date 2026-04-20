import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineAddon } from '../scripts/stage1-addon-authoring.mjs';
import spotifyAdapter from './adapters/SpotifySongMetadataAdapter/adapter.meta.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

export default defineAddon({
  addonId: 'axolync-addon-spotify',
  name: 'Axolync Spotify Addon',
  version: packageJson.version,
  contractsVersion: '2.0.0',
  description: 'Stage 1 Spotify-backed SongMetadata addon for canonical duration enrichment.',
  requirements: [],
  adapters: [spotifyAdapter],
});
