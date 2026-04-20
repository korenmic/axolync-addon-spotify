export async function querySpotifyDuration({
  identity,
  settings = {},
} = {}) {
  return {
    providerReason: 'not_implemented',
    providerDiagnostics: {
      spotifyTrackId: identity?.spotifyTrackId ?? null,
      spotifyUri: identity?.spotifyUri ?? null,
      spotifyTrackUrl: identity?.spotifyTrackUrl ?? null,
      isrc: identity?.isrc ?? null,
      title: identity?.title ?? null,
      artist: identity?.artist ?? null,
      clientIdConfigured: typeof settings?.client_id === 'string' && settings.client_id.trim().length > 0,
      clientSecretConfigured: typeof settings?.client_secret === 'string' && settings.client_secret.trim().length > 0,
      defaultMarket: settings?.default_market ?? 'US',
      allowSearchFallback: settings?.allow_search_fallback ?? true,
      failureReason: 'not_implemented',
    },
  };
}
