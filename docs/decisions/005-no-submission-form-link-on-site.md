# 005: No link to the submission form on the site

- **Date:** 2026-11-03
- **Status:** accepted

## Context
Issue #2 proposed adding a "Recommend a resource" link from the directory page to the Google Form that feeds the sheet. The directory is meant for members of the Speaking Portuguese WhatsApp group only.

## Decision
Don't link to the submission form anywhere on the site. Members get the form link through a Google Doc in the WhatsApp group's description (the group's instructions doc).

## Why
- Keeps submissions to group members: non-members can't easily find the form and add entries.
- It's a second safeguard. Every submission still starts as Pending and only appears on the site after Jim approves it.

## Consequences
- Never add a form link or "Recommend a resource" link to index.html.
- If the form changes, update the link in the WhatsApp group's instructions doc, not on the site.
