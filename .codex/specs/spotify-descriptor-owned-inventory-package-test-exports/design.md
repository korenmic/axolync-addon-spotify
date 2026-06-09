# Spotify Descriptor-Owned Inventory Package And Test Exports Design

## Overview

Move Spotify addon inventory, package, and command metadata into descriptor exports.

## Design

- Add descriptor inventory exports for existing adapter catalog metadata.
- Add descriptor package exports for the existing addon ZIP.
- Add descriptor build, sanity, and full-test command exports.

## Non-Goals

- No SongMetadata runtime behavior changes.
- No package format changes.
