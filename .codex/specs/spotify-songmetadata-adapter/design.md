# Design

## Overview

The addon ships one local Stage 1 `SongMetadata` adapter named `spotify`. It wraps `@spotify/web-api-ts-sdk` and uses a provider-local planner:

1. resolve Spotify identity hints from normalized `metadataAffinity`
2. recover track id / URI / URL / ISRC from preserved accepted `raw` payloads when available
3. build an SDK client from addon settings
4. query direct track lookup first
5. run bounded search fallback only when direct track lookup is unavailable
6. emit `{ durationMs }` plus diagnostics

## Repo Shape

- `addon/addon.meta.mjs`
- `addon/adapters/SpotifySongMetadataAdapter/adapter.meta.mjs`
- `addon/adapters/SpotifySongMetadataAdapter/index.js`
- `addon/runtime/songmetadata/*`
- `build-profiles/defaults.toml`
- `scripts/*`
- `tests/*`
- tracked `adapter-inventory.json`
- tracked `report/addon-manifest.spotify.json`

## Runtime Modules

### `queryIdentity.js`

Resolves:

- `spotifyTrackId`
- `spotifyTrackUrl`
- `spotifyUri`
- `isrc`
- `title`
- `artist`
- `market`

### `spotifyClient.js`

Wraps `@spotify/web-api-ts-sdk` and exposes:

- `getTrack`
- `searchTracks`

The first auth strategy is client credentials from addon settings. The module is intentionally isolated so later migration to a shared host or injected token provider is easy.

### `resultRanking.js`

Ranks:

1. valid direct track-id result
2. bounded search result with exact-enough artist/title match

Search cannot outrank a valid direct Spotify track hit solely by being longer.

### `providerDiagnostics.js`

Builds a compact diagnostics object with:

- auth strategy
- present track identity hints
- winner lane
- fallback usage
- failure reason

## Validation Strategy

- unit tests for Spotify track id normalization
- unit tests for search strictness and ISRC promotion
- adapter tests for `query_song_metadata`
- package validation and tracked report artifact validation

## Release Posture

The first implementation is functional but intentionally candid:

- it is local Stage 1 because browser SongMetadata currently requires local execution
- it uses addon-owned client credentials as a bridge
- later migration to a shared host remains an explicit follow-on option
