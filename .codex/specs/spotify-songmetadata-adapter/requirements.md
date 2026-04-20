# Requirements

## Goal

Ship a Stage 1 local `SongMetadata` addon that enriches missing canonical duration for Spotify-affine accepted matches by wrapping Spotify's official TypeScript Web API SDK and combining direct track lookup with bounded search fallback inside one adapter.

## Functional Requirements

### FR1. Stage 1 addon packaging

The repo must ship as a dedicated Stage 1 addon package for the `SongMetadata` lane with one adapter that exposes `query_song_metadata`.

### FR2. Local Stage 1 auth bridge

Because current browser SongMetadata execution is local-only, the first implementation must use addon-owned Spotify client-credentials settings locally while keeping the design easy to migrate to a shared host later.

### FR3. Strong Spotify identity

The adapter must treat these as strong direct Spotify identity inputs:

1. normalized `spotifyTrackId`
2. Spotify URI or track URL that normalizes to the same track id

Artist/title alone must not claim direct Spotify identity.

### FR4. Conservative search fallback

When no direct Spotify track id is available, search fallback may run only if:

- the adapter still has enough accepted identity context to search safely
- artist and title normalize to an exact-enough match
- ISRC may promote confirmation when available

Otherwise the adapter must emit no patch.

### FR5. Additive output only

The adapter must return additive SongMetadata patch truth only:

- positive integer `durationMs` when found
- no song replacement
- no broader title normalization in Stage 1

### FR6. Diagnostics

The adapter must expose truthful provider-local diagnostics showing:

- auth mode used
- whether a direct track id was available
- whether search fallback ran
- why no patch was emitted

## Non-Goals

- scrape-style Spotify URL helper integration
- user-scoped Spotify playback data
- broader metadata rewriting
- shared-host orchestration in this seed
