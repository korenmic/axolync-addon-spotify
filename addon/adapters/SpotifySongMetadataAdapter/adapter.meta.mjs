import { defineAdapter } from '../../../scripts/stage1-addon-authoring.mjs';
import { SpotifySongMetadataAdapter } from './index.js';

export default defineAdapter({
  adapterId: 'spotify',
  label: 'Spotify SongMetadata',
  description: 'Stage 1 Spotify-backed SongMetadata adapter for canonical duration enrichment.',
  hostMode: 'local-js',
  supportedPlatforms: ['web', 'android', 'desktop', 'ios'],
  requiredPermissions: [],
  requiredHostCapabilities: [],
  gatingSettings: [],
  settings: [
    {
      settingId: 'client_id',
      label: 'Client ID',
      kind: 'string',
      description: 'Spotify client credentials app client id used for addon-owned token acquisition.',
      hiddenInUi: false,
      defaultValue: '',
    },
    {
      settingId: 'client_secret',
      label: 'Client Secret',
      kind: 'string',
      description: 'Spotify client credentials app client secret used for addon-owned token acquisition.',
      hiddenInUi: false,
      defaultValue: '',
    },
    {
      settingId: 'default_market',
      label: 'Default Market',
      kind: 'string',
      description: 'Fallback Spotify market used when the accepted match does not preserve one.',
      hiddenInUi: false,
      defaultValue: 'US',
    },
    {
      settingId: 'allow_search_fallback',
      label: 'Allow Search Fallback',
      kind: 'boolean',
      description: 'Allow bounded Spotify artist/title search when direct Spotify track identity is unavailable or unusable.',
      hiddenInUi: false,
      defaultValue: true,
    },
  ],
  implementation: {
    modulePath: 'adapters/SpotifySongMetadataAdapter/index.js',
    exportName: 'SpotifySongMetadataAdapter',
  },
  queryMethods: {
    songmetadata: ['query_song_metadata'],
  },
});
