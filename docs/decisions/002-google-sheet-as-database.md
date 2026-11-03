# 002: Google Sheet (fed by a Google Form) as the database

- **Date:** 2025-08 (recorded retroactively 2026-11-03)
- **Status:** accepted

## Context
The directory's content changes as members recommend new resources, and non-technical people need to be able to manage it.

## Decision
Keep the content in a Google Sheet with two tabs: "Directory" (one row per resource) and "Recommendations" (members' comments). Members submit through a Google Form that feeds the sheet. The tabs are published to the web as CSV, and the page loads and parses them (with Papa Parse) on every visit.

## Why
No database or admin screen to build. Editing content means editing a spreadsheet.

## Consequences
- Content updates appear on the site without touching the code.
- The published CSV links are public by design, so anything in those tabs is publicly readable.
- Renaming sheet columns can break the page. The code matches some columns flexibly, but `Name`, `Type`, `Level`, `Notes` and `Contact URL` are read by exact name.
