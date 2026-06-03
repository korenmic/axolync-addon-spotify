# Seed 02 - Spotify Descriptor-Owned Inventory Package And Test Exports

## Summary

Remove descriptor fallback warnings for the Spotify SongMetadata addon by moving inventory, package, and test command metadata into the repo descriptor.

## Product Context

Spotify is an installable SongMetadata addon. Builder should not rely on legacy fallback data for its package, catalog inventory, or tests.

## Technical Constraints

- Preserve package output and adapter inventory metadata.
- Preserve existing test behavior.
- Do not change runtime provider behavior.

## Required Outcome

- Builder resolves Spotify inventories, package exports, and build/sanity/full-test commands from the descriptor.
- Spotify descriptor fallback warnings disappear.
- Focused validation proves descriptor-owned discovery.

## Open Questions

- None.
