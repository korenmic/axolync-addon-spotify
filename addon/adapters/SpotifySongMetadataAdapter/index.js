import { resolveSpotifyQueryIdentity } from '../../runtime/songmetadata/queryIdentity.js';
import { querySpotifyDuration } from '../../runtime/songmetadata/spotifyClient.js';

export class SpotifySongMetadataAdapter {
  constructor(options = {}) {
    this.queryDurationImpl = options.queryDurationImpl ?? querySpotifyDuration;
  }

  async query_song_metadata(input = {}) {
    const identity = resolveSpotifyQueryIdentity(input);
    const result = await this.queryDurationImpl({
      identity,
      settings: input?.settings ?? {},
    });
    return {
      ...result,
      providerDiagnostics: {
        ...identity.diagnostics,
        spotifyTrackId: identity.spotifyTrackId,
        spotifyUri: identity.spotifyUri,
        spotifyTrackUrl: identity.spotifyTrackUrl,
        isrc: identity.isrc,
        title: identity.title,
        artist: identity.artist,
        ...(result?.providerDiagnostics ?? {}),
      },
    };
  }
}
