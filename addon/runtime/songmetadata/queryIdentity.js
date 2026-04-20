function trimString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeComparisonText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstString(values) {
  for (const value of values) {
    const normalized = trimString(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function firstNormalized(values, normalizeValue) {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function normalizeSpotifyTrackId(value) {
  const normalized = trimString(value);
  if (!normalized) {
    return null;
  }

  const directIdMatch = normalized.match(/^[A-Za-z0-9]{22}$/);
  if (directIdMatch) {
    return directIdMatch[0];
  }

  const uriMatch = normalized.match(/^spotify:track:([A-Za-z0-9]{22})$/i);
  if (uriMatch) {
    return uriMatch[1];
  }

  const urlMatch = normalized.match(/spotify\.com\/track\/([A-Za-z0-9]{22})/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}

function normalizeSpotifyUri(value) {
  const trackId = normalizeSpotifyTrackId(value);
  return trackId ? `spotify:track:${trackId}` : null;
}

function normalizeSpotifyTrackUrl(value) {
  const trackId = normalizeSpotifyTrackId(value);
  return trackId ? `https://open.spotify.com/track/${trackId}` : null;
}

function normalizeIsrc(value) {
  const normalized = trimString(value);
  if (!normalized) {
    return null;
  }
  const compact = normalized.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(compact) ? compact : null;
}

function normalizeMarket(value) {
  const normalized = trimString(value);
  if (!normalized) {
    return null;
  }
  const market = normalized.toUpperCase();
  return /^[A-Z]{2}$/.test(market) ? market : null;
}

function deriveSourceProviderHint(input, raw) {
  const topLevelAffinity = isPlainObject(input?.metadataAffinity) ? input.metadataAffinity : null;
  const songAffinity = isPlainObject(input?.song?.metadataAffinity) ? input.song.metadataAffinity : null;
  if (trimString(topLevelAffinity?.providerFamily)) {
    return normalizeComparisonText(topLevelAffinity.providerFamily);
  }
  if (trimString(songAffinity?.providerFamily)) {
    return normalizeComparisonText(songAffinity.providerFamily);
  }
  if (isPlainObject(raw?.spotify)) {
    return 'spotify';
  }
  if (isPlainObject(raw?.vibra)) {
    return 'vibra';
  }
  return null;
}

function extractProviderIds(metadataAffinity) {
  const providerIds = isPlainObject(metadataAffinity?.providerIds) ? metadataAffinity.providerIds : null;
  return {
    spotifyTrackId: firstNormalized([
      providerIds?.spotifyTrackId,
      providerIds?.spotifyUri,
      providerIds?.spotifyTrackUrl,
      providerIds?.trackId,
      providerIds?.trackUri,
      providerIds?.trackUrl,
    ], normalizeSpotifyTrackId),
    spotifyUri: firstNormalized([
      providerIds?.spotifyUri,
      providerIds?.spotifyTrackId,
      providerIds?.spotifyTrackUrl,
      providerIds?.trackUri,
      providerIds?.trackId,
      providerIds?.trackUrl,
    ], normalizeSpotifyUri),
    spotifyTrackUrl: firstNormalized([
      providerIds?.spotifyTrackUrl,
      providerIds?.spotifyTrackId,
      providerIds?.spotifyUri,
      providerIds?.trackUrl,
      providerIds?.trackId,
      providerIds?.trackUri,
    ], normalizeSpotifyTrackUrl),
    isrc: normalizeIsrc(providerIds?.isrc),
    market: normalizeMarket(firstString([
      providerIds?.spotifyMarket,
      providerIds?.market,
      providerIds?.country,
    ])),
  };
}

function extractRawIdentity(raw) {
  if (!isPlainObject(raw)) {
    return {
      spotifyTrackId: null,
      spotifyUri: null,
      spotifyTrackUrl: null,
      isrc: null,
      market: null,
    };
  }

  const spotify = isPlainObject(raw?.spotify) ? raw.spotify : null;
  const track = isPlainObject(spotify?.track) ? spotify.track : null;
  const externalUrls = isPlainObject(track?.external_urls) ? track.external_urls : null;
  const rawTrackCandidate = firstString([
    track?.id,
    spotify?.id,
    track?.uri,
    spotify?.uri,
    externalUrls?.spotify,
    spotify?.url,
    spotify?.trackUrl,
  ]);

  return {
    spotifyTrackId: firstNormalized([
      track?.id,
      spotify?.id,
      track?.uri,
      spotify?.uri,
      externalUrls?.spotify,
      spotify?.url,
      spotify?.trackUrl,
    ], normalizeSpotifyTrackId),
    spotifyUri: firstNormalized([
      track?.uri,
      spotify?.uri,
      rawTrackCandidate,
    ], normalizeSpotifyUri),
    spotifyTrackUrl: firstNormalized([
      externalUrls?.spotify,
      spotify?.url,
      spotify?.trackUrl,
      rawTrackCandidate,
    ], normalizeSpotifyTrackUrl),
    isrc: normalizeIsrc(firstString([
      track?.external_ids?.isrc,
      spotify?.external_ids?.isrc,
    ])),
    market: normalizeMarket(firstString([
      spotify?.market,
      track?.market,
      spotify?.country,
    ])),
  };
}

export function resolveSpotifyQueryIdentity(input = {}) {
  const song = isPlainObject(input?.song) ? input.song : null;
  const topLevelAffinity = isPlainObject(input?.metadataAffinity) ? input.metadataAffinity : null;
  const songAffinity = isPlainObject(song?.metadataAffinity) ? song.metadataAffinity : null;
  const raw = isPlainObject(input?.raw) ? input.raw : null;
  const normalizedAffinity = extractProviderIds(topLevelAffinity);
  const nestedAffinity = extractProviderIds(songAffinity);
  const rawFallback = extractRawIdentity(raw);

  return {
    spotifyTrackId: normalizedAffinity.spotifyTrackId
      ?? nestedAffinity.spotifyTrackId
      ?? rawFallback.spotifyTrackId,
    spotifyUri: normalizedAffinity.spotifyUri
      ?? nestedAffinity.spotifyUri
      ?? rawFallback.spotifyUri,
    spotifyTrackUrl: normalizedAffinity.spotifyTrackUrl
      ?? nestedAffinity.spotifyTrackUrl
      ?? rawFallback.spotifyTrackUrl,
    isrc: normalizedAffinity.isrc
      ?? nestedAffinity.isrc
      ?? rawFallback.isrc,
    title: trimString(song?.title),
    artist: trimString(song?.artist),
    market: normalizedAffinity.market
      ?? nestedAffinity.market
      ?? rawFallback.market,
    diagnostics: {
      normalizedAffinitySpotifyTrackId: normalizedAffinity.spotifyTrackId,
      nestedAffinitySpotifyTrackId: nestedAffinity.spotifyTrackId,
      rawSpotifyTrackId: rawFallback.spotifyTrackId,
      normalizedAffinitySpotifyUri: normalizedAffinity.spotifyUri,
      nestedAffinitySpotifyUri: nestedAffinity.spotifyUri,
      rawSpotifyUri: rawFallback.spotifyUri,
      normalizedAffinitySpotifyTrackUrl: normalizedAffinity.spotifyTrackUrl,
      nestedAffinitySpotifyTrackUrl: nestedAffinity.spotifyTrackUrl,
      rawSpotifyTrackUrl: rawFallback.spotifyTrackUrl,
      normalizedAffinityIsrc: normalizedAffinity.isrc,
      nestedAffinityIsrc: nestedAffinity.isrc,
      rawIsrc: rawFallback.isrc,
      marketSource: normalizedAffinity.market
        ? 'metadata-affinity'
        : (nestedAffinity.market ? 'song-metadata-affinity' : (rawFallback.market ? 'raw' : 'none')),
      sourceProviderHint: deriveSourceProviderHint(input, raw),
    },
  };
}
