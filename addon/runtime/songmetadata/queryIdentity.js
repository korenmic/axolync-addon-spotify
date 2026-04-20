function trimString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function resolveSpotifyQueryIdentity(input = {}) {
  const song = isPlainObject(input?.song) ? input.song : null;

  return {
    spotifyTrackId: null,
    spotifyUri: null,
    spotifyTrackUrl: null,
    isrc: null,
    title: trimString(song?.title),
    artist: trimString(song?.artist),
    diagnostics: {
      normalizedAffinitySpotifyTrackId: null,
      nestedAffinitySpotifyTrackId: null,
      rawSpotifyTrackId: null,
      sourceProviderHint: null,
    },
  };
}
