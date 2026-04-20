# Spotify SongMetadata Adapter

Implement a Stage 1 `SongMetadata` addon that enriches `canonicalDurationMs` for accepted Spotify-affine song matches by wrapping Spotify's official TypeScript Web API SDK and combining direct track-id lookup with bounded search fallback inside one adapter.

This seed intentionally collapses the previously split Spotify research into one real adapter direction. Direct track lookup, search fallback, and provider-affine duration enrichment should belong to one Spotify adapter, while scrape-style helper paths such as `spotify-url-info` remain out of scope for the first implementation.

## Product Context

Axolync's new `SongMetadata` lane exists to enrich accepted SongSense matches before `LyricFlow` and `SyncEngine` consume them. Spotify is a legitimate provider-backed source of canonical duration because the official track object exposes `duration_ms`, and accepted detections may preserve Spotify ids, ISRC values, or enough affinity to search safely when direct ids are missing.

The right first Spotify implementation is not three different adapters. It is one adapter that uses the official `spotify-web-api-ts-sdk` wrapper and tries the strongest Spotify-specific lookup first, then a bounded search fallback only when necessary. This keeps policy centralized, keeps provider ownership explicit, and avoids both homegrown HTTP glue and scrape-style instability.

This adapter is more operationally complex than iTunes because auth ownership matters. That is why the seed should stay honest: the value is real, but the first implementation must choose how Axolync wants Spotify credentials and token refresh to be owned.

## Technical Constraints

- The adapter must live in a dedicated addon repo and target the `SongMetadata` lane only.
- The implementation should wrap `https://github.com/spotify/spotify-web-api-ts-sdk` instead of writing a bespoke Spotify HTTP client.
- The adapter should combine direct track-id lookup and bounded search fallback inside one adapter, not split them into separate addons.
- Stage 1 scope is only `canonicalDurationMs`; no broader metadata rewriting or title canonicalization should be added here.
- The adapter must respect browser-owned SongMetadata dispatch policy: one query burst per accepted detection object, not repeated on sync churn.
- The adapter must only run when browser policy allows Spotify-affine metadata enrichment for the accepted match.
- Direct Spotify track identifiers should outrank any broader artist/title search lane.
- Search fallback must stay conservative and should not behave like a generic provider-agnostic fuzzy matcher.
- Scrape-style helper paths such as `spotify-url-info` are intentionally out of scope for this first implementation seed.
- The seed should prefer wrapping the official Spotify TypeScript SDK even if a later implementation ends up hosting it outside the browser for auth reasons.

## Open Questions

These questions are resolved for the first implementation. See [open question resolutions](../open-question-resolutions/01-spotify-songmetadata-adapter-open-questions.md).

1. The first implementation will stay local because current browser SongMetadata execution is local-only. It will use the official Spotify SDK with addon-owned client-credentials settings as a practical bridge, not as the final long-term security model.
2. Strong Spotify affinity comes from a normalized Spotify track id first, and also from Spotify URI / track URL forms that normalize to the same track id. ISRC may promote search confirmation but does not replace direct Spotify identity.
3. Search fallback must stay conservative: require exact normalized artist match plus exact normalized title match after safe punctuation/whitespace folding, and let ISRC agreement promote the result when available. Otherwise emit no patch.
