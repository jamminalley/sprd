# 001: Static single page hosted on GitHub Pages

- **Date:** 2025-08-11 (recorded retroactively 2026-11-03)
- **Status:** accepted

## Context
The Speaking Portuguese group needed a simple, free place to share recommended resources.

## Decision
Build the directory as one self-contained `index.html` (HTML, CSS and JavaScript in one file, no framework, no build step) and host it free on GitHub Pages from the public `jamminalley/sprd` repo.

## Why
Free, no server to maintain, and edits go live by pushing one file.

## Consequences
- The repo must stay public (private-repo Pages needs a paid GitHub plan).
- All logic runs in the visitor's browser; anything needing a server goes to Google Apps Script instead.
