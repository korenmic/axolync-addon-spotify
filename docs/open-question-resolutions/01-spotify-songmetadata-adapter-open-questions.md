# Spotify SongMetadata Open Question Resolutions

This file records the plausible Stage 1 answers that existed for the seed and the answer that was chosen for implementation.

## Question 1

Where should Spotify auth live in the first implementation: browser-local PKCE, shared host, or remote metadata broker?

### Possible Answers

- `A` Shared host owns Spotify auth from day one.
- `B` A remote metadata broker owns Spotify auth from day one.
- `C` Stage 1 keeps the addon local because browser SongMetadata execution is currently local-only, and the addon uses official SDK client-credentials auth from addon settings. This is a practical bridge, not the final long-term security model.

### Chosen Answer

`C`

### Why This Was Chosen

- It is the only answer that fits the current browser Stage 1 execution model without inventing a larger new runtime host first.
- It still honors the user's direction to wrap the official maintained SDK instead of writing a bespoke client.
- It keeps the compromise explicit so later refactoring to a shared host stays easy.

## Question 2

Which accepted-match Spotify affinity inputs should be considered strong enough to allow this adapter to run before broader fallback adapters?

### Possible Answers

- `A` Only a normalized Spotify track id is strong enough.
- `B` Accept Spotify track id first, and also accept Spotify URI or track URL when they can be normalized to the same track id. ISRC may promote search confirmation but does not replace direct Spotify identity.
- `C` Let artist/title alone be strong enough to treat the match as Spotify-backed.

### Chosen Answer

`B`

### Why This Was Chosen

- It keeps direct Spotify identity authoritative.
- It preserves practical compatibility with upstream raws that may store Spotify URIs or URLs instead of a bare track id.
- It avoids over-claiming Spotify affinity from mere text similarity.

## Question 3

How conservative should Spotify search fallback be when no direct Spotify track id is available?

### Possible Answers

- `A` Any search hit with the right artist is good enough.
- `B` Require exact normalized artist match plus exact normalized title match after safe punctuation/whitespace folding, and let ISRC agreement promote the result when available. Otherwise emit no patch.
- `C` Let the longest plausible duration win among top search results.

### Chosen Answer

`B`

### Why This Was Chosen

- It keeps search fallback bounded and provider-specific instead of turning Spotify into a fuzzy global metadata matcher.
- It reduces the chance that longer but wrong tracks override the accepted song identity.
- It still leaves room for a legitimate search rescue when strong Spotify ids are absent.
