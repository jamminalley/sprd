# Speaking Portuguese Recommendations Directory (sprd)

## Stamp
PERSONAL (Claude: personal account · GitHub: jamminalley)

## Started
2025-08-11 (first save on GitHub)

## Overview
A one-page website listing language-learning resources (tutors, schools, apps,
groups…) recommended by members of Porto Together's *Speaking Portuguese* group.
Visitors can search, filter by type and level, read members' recommendations,
and sign up to be emailed when new resources are added.
Live at https://jamminalley.github.io/sprd/

## Expected output
- A single static web page (index.html) hosted free on GitHub Pages
- Content lives in a Google Sheet, published as CSV: a "Directory" tab (one row
  per resource) and a "Recommendations" tab (members' comments)
- Members submit recommendations through a Google Form that feeds the sheet
- Email signup posts to a Google Apps Script web app, which stores the address
  and handles "new resource" notifications

## Requirements
Must:
- Show every directory entry as a card, with search plus Type and Level filters
- Show supporting recommendations for each resource in a details pop-up
- Keep the disclaimer visible
- Stay out of search engines (robots.txt + noindex) (inferred: members-only feel)
- Email signup works and confirms success or failure to the visitor
Nice to have:
- (to be filled in)

## Assumptions
- Content is edited through the Google Form / Google Sheet, not in the code
- The published Directory tab only includes Approved rows; that filtering
  happens in Google (sheet or Apps Script), not in index.html.
- No build step or server: edit index.html, push, and GitHub Pages updates the site
- The repo stays public, because free GitHub Pages needs that. Project notes are
  public on GitHub but excluded from the website via _config.yml

## Out of scope
- (to be filled in)

## Open questions
- Should the page link to the Google Form so members can add recommendations directly?
- Where does the Apps Script code for the email signup live? (It isn't in this repo.)

## Current status
Live and working, including the email signup and notifications. Adopted into the
2nd-brain workflow 2026-11-03. Code changes on 2026-11-03: sheet text is now
escaped so it always shows as plain text (#1), and WhatsApp contacts written as
text become working "Message on WhatsApp" links (#5). A second-opinion review
found no must-fix items; its follow-ups are open as issues #6, #8, #9 and #10
(#7 closed: not needed). Before that, the last code change was April 2026
(signup switched to an Apps Script web app).
