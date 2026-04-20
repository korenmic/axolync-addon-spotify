import { SpotifyApi } from '@spotify/web-api-ts-sdk';

function trimString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeDurationMs(value) {
  return Number.isFinite(value) && Number(value) > 0
    ? Math.round(Number(value))
    : null;
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

function normalizeMarket(value, fallback = 'US') {
  const normalized = trimString(value);
  if (!normalized) {
    return fallback;
  }
  const market = normalized.toUpperCase();
  return /^[A-Z]{2}$/.test(market) ? market : fallback;
}

function buildDiagnosticsBase(identity, settings) {
  return {
    spotifyTrackId: identity?.spotifyTrackId ?? null,
    spotifyUri: identity?.spotifyUri ?? null,
    spotifyTrackUrl: identity?.spotifyTrackUrl ?? null,
    isrc: identity?.isrc ?? null,
    title: identity?.title ?? null,
    artist: identity?.artist ?? null,
    market: identity?.market ?? null,
    authStrategy: 'client-credentials',
    clientIdConfigured: Boolean(trimString(settings?.client_id)),
    clientSecretConfigured: Boolean(trimString(settings?.client_secret)),
    defaultMarket: normalizeMarket(settings?.default_market, 'US'),
    allowSearchFallback: normalizeBoolean(settings?.allow_search_fallback, true),
    attemptedLanes: [],
  };
}

function failureResult(providerReason, providerDiagnostics) {
  providerDiagnostics.failureReason = providerReason;
  return {
    providerReason,
    providerDiagnostics,
  };
}

function successResult(durationMs, providerDiagnostics) {
  return {
    durationMs,
    providerDiagnostics,
  };
}

function createSpotifySdk(settings, config = {}) {
  return SpotifyApi.withClientCredentials(
    trimString(settings?.client_id),
    trimString(settings?.client_secret),
    [],
    config,
  );
}

function normalizeTrackRecord(track) {
  if (!track || typeof track !== 'object') {
    return null;
  }

  const durationMs = normalizeDurationMs(track.duration_ms);
  if (!durationMs) {
    return null;
  }

  return {
    id: trimString(track.id),
    uri: trimString(track.uri),
    url: trimString(track?.external_urls?.spotify),
    title: trimString(track.name),
    artist: Array.isArray(track.artists)
      ? track.artists
        .map((artist) => trimString(artist?.name))
        .filter(Boolean)
        .join(', ')
      : null,
    isrc: trimString(track?.external_ids?.isrc)?.toUpperCase() ?? null,
    durationMs,
  };
}

async function getTrackById(sdk, identity, market) {
  const track = await sdk.tracks.get(identity.spotifyTrackId, market);
  return normalizeTrackRecord(track);
}

async function searchTracks(sdk, identity, market) {
  const query = `track:"${identity.title}" artist:"${identity.artist}"`;
  const response = await sdk.search(query, ['track'], market, 10);
  const items = Array.isArray(response?.tracks?.items) ? response.tracks.items : [];
  return items.map(normalizeTrackRecord).filter(Boolean);
}

function isStrictIdentityMatch(track, identity) {
  if (!track?.title || !track?.artist || !identity?.title || !identity?.artist) {
    return false;
  }
  return normalizeComparisonText(track.title) === normalizeComparisonText(identity.title)
    && normalizeComparisonText(track.artist) === normalizeComparisonText(identity.artist);
}

function pickBestSearchTrack(candidates, identity) {
  const exactMatches = candidates.filter((candidate) => isStrictIdentityMatch(candidate, identity));
  if (exactMatches.length === 0) {
    return null;
  }
  if (identity?.isrc) {
    const isrcMatch = exactMatches.find((candidate) => candidate.isrc === identity.isrc);
    if (isrcMatch) {
      return {
        winner: isrcMatch,
        promotedByIsrc: true,
      };
    }
  }
  return {
    winner: exactMatches[0],
    promotedByIsrc: false,
  };
}

export async function querySpotifyDuration({
  identity,
  settings = {},
  sdkFactory = createSpotifySdk,
} = {}) {
  const providerDiagnostics = buildDiagnosticsBase(identity, settings);

  if (!providerDiagnostics.clientIdConfigured || !providerDiagnostics.clientSecretConfigured) {
    providerDiagnostics.attemptedLanes.push('none');
    return failureResult('auth_not_configured', providerDiagnostics);
  }

  if (!identity?.spotifyTrackId) {
    if (!providerDiagnostics.allowSearchFallback || !identity?.title || !identity?.artist) {
      providerDiagnostics.attemptedLanes.push('none');
      providerDiagnostics.searchSkipped = !providerDiagnostics.allowSearchFallback ? 'disabled-by-setting' : 'missing-identity';
      return failureResult('identity_not_supported', providerDiagnostics);
    }

    const market = normalizeMarket(identity?.market ?? settings?.default_market, providerDiagnostics.defaultMarket);
    providerDiagnostics.effectiveMarket = market;
    const sdk = sdkFactory(settings);
    providerDiagnostics.attemptedLanes.push('search');

    try {
      const searchResults = await searchTracks(sdk, identity, market);
      providerDiagnostics.searchResultCount = searchResults.length;
      const ranked = pickBestSearchTrack(searchResults, identity);
      if (!ranked) {
        providerDiagnostics.searchRejected = 'no-exact-match';
        return failureResult('duration_not_found', providerDiagnostics);
      }
      providerDiagnostics.winnerLane = 'search';
      providerDiagnostics.winnerTrackId = ranked.winner.id ?? null;
      providerDiagnostics.searchWinnerPromotedByIsrc = ranked.promotedByIsrc;
      return successResult(ranked.winner.durationMs, providerDiagnostics);
    } catch (error) {
      providerDiagnostics.searchError = trimString(error?.message) ?? 'unknown_error';
      return failureResult('provider_error', providerDiagnostics);
    }
  }

  const market = normalizeMarket(identity?.market ?? settings?.default_market, providerDiagnostics.defaultMarket);
  providerDiagnostics.effectiveMarket = market;

  const sdk = sdkFactory(settings);
  providerDiagnostics.attemptedLanes.push('track-id');

  try {
    const track = await getTrackById(sdk, identity, market);
    providerDiagnostics.trackLookupResult = track ? 'found' : 'missing';
    if (!track) {
      return failureResult('duration_not_found', providerDiagnostics);
    }
    providerDiagnostics.winnerLane = 'track-id';
    providerDiagnostics.winnerTrackId = track.id ?? identity.spotifyTrackId;
    return successResult(track.durationMs, providerDiagnostics);
  } catch (error) {
    providerDiagnostics.trackLookupError = trimString(error?.message) ?? 'unknown_error';
    return failureResult('provider_error', providerDiagnostics);
  }
}
