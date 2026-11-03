# 004: Project notes are public on GitHub but kept off the website

- **Date:** 2026-11-03
- **Status:** accepted

## Context
Adopting the 2nd-brain workflow adds notes files (PROJECT.md, CLAUDE.md, docs/) and GitHub Issues. The repo is public (see 001), and GitHub Pages would otherwise turn those Markdown files into pages on the live site.

## Decision
Keep the repo public, and add `_config.yml` with an `exclude:` list so the notes aren't published to the website. The site stays out of search engines via `robots.txt` and a `noindex` tag.

## Why
Making the repo private would take the free website offline. Nothing in the notes is sensitive.

## Consequences
- Never put private information in notes, commits or issues.
- New notes files or folders must be added to `exclude:` in `_config.yml`.
