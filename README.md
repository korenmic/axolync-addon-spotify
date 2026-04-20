# Axolync Spotify Addon

Home for the Stage 1 Spotify-backed SongMetadata addon.

Current scope:

- one Spotify-backed SongMetadata adapter
- stage 1 focus on additive `durationMs` enrichment only
- implementation wraps the maintained official Spotify TypeScript SDK rather than re-implementing Spotify Web API calls by hand
- direct Spotify track identity outranks bounded search fallback

This repo does not ship runtime code yet.
