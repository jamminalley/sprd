# Runlog

Newest entries at the top.

## 2026-11-03 (review)
- **Reviewed:** d47840e..53b3cd6 (6ce9cd4 #3, a5de895 #11, 49c4ce0 #12, 0339cf7 #13, 1b761a5 #14, plus docs)
- **Verdict:** Fixes work as designed and no private IDs leaked; one small HTML-injection hole on the unsubscribe page to close.
- **Findings:** (Must) 1. Unsubscribe page, announcement email and error page put unescaped data into HTML. (Should) 2. Old duplicate subscriber rows get emails twice and unsubscribe only stops one. 3. Failed announcements are stamped notified_at and nobody is alerted (no quota check). 4. Multi-row approvals never announce. 5. Google Form subscribe path still adds duplicates. 6. No repeatable Apps Script test (harness was thrown away). (Could) 7. Manual notify ignores status/consent and reports success even on failure. 8. Website signup accepts text with no "@". 9. Unsubscribe compares emails differently from signup.
- **Fixed:** 1 (commit 99d3d39). New `escapeHtml_()` used for the unsubscribe confirm page (id and email), the announcement email's HTML (name, notes, type/level line, unsubscribe link) and doGet's error page; plain-text bodies and the subject unchanged. Checked with the fake-Google harness: 4 new escaping checks (a link with id `"><b>x</b>` and a listing named `<b>Test</b>` both appear literally) plus the earlier 25, all 29 passing; the 3 hostile-input checks fail on the previous version.
- **Deferred:** 2 → #15, 3 → #16, 4 → #17, 5 → #18, 6 → #19, 7 → #20, 8 → #21 (9 folded into #15)
- **Not live yet:** Jim needs to paste the new Code.gs into Google and update the EXISTING deployment to a new version (docs/apps-script-update.md steps 4 and 6).

## 2026-11-03: Apps Script update is live in Google
- **What changed:** Jim followed docs/apps-script-update.md with step-by-step help. Backup made; Script Properties set; `notified_at` added in Resources P1; new Code.gs pasted; "Mark all approved as already announced" filled P for 44 listings (no emails); the EXISTING deployment updated to a new version (web app URL unchanged, doGet answers "subscribe endpoint is live").
- **Hiccup, fixed:** at first only one property was saved, `SPREADSHEET_ID`, holding the Support *form* ID, so the mark-all step failed with "Document … is missing". Fixed by setting `SPREADSHEET_ID` to the admin sheet's ID and adding `SUPPORT_FORM_ID`. (The menu also needed the Sheet closed and reopened to show the new item.)
- **Tests:** A (duplicate signup → one Active row) passed. B (Approved → Pending → Approved removes and restores the listing in the Support dropdown, no email) passed. C (a genuinely new approval sends one email and stamps P) can only be checked at the next real approval.
- **Found along the way:** the Support form dropdown was out of date (many website listings missing) because it had last been synced long before; consent was "Yes" on every row. One manual "Sync 'Support' form dropdown now" brought it to all 44. From now on every status change keeps it in step.
- **Issues touched:** none (#3, #11–#14 were closed by their commits).
- **What's next:** watch the next real approval (test C) and glance at Executions for errors. Run /second-opinion on 6ce9cd4..HEAD. Open issues: #4, #6, #8, #9, #10.

## 2026-11-03: Apps Script into the repo, plus fixes (#3, #11–#14)
- **What changed:** Added the Google Apps Script as `apps-script/Code.gs` (excluded from the site). The first commit (6ce9cd4) is the baseline: unchanged except that SPREADSHEET_ID and SUPPORT_FORM_ID are read from Script Properties, with a clear error if missing, so no private IDs are in the repo. Then one commit per issue:
  - #11 (a5de895): new `notified_at` column (Resources P, found by header). Subscribers are emailed only when status became Approved, consent is Yes and notified_at is blank; the date is written before sending. New menu item "Mark all approved as already announced". Manual notify also fills notified_at.
  - #12 (49c4ce0): any status change (including multi-cell pastes) runs `syncResourceDropdown()`. Sync and notification are wrapped separately so neither error stops the other.
  - #13 (0339cf7): `doPost` dedupes signups (email compared ignoring case and spaces). Already Active → no row; Unsubscribed → back to Active; other hand-set statuses are left alone; reply is always "ok".
  - #14 (1b761a5): removed debugTargets, appendDebugRow, listTabs and copyLatestResourceResponseBound.
- Wrote `docs/apps-script-update.md` (Jim's step-by-step guide: backup, Script Properties, notified_at header, paste, mark-all, update the EXISTING deployment, tests, rollback). Recorded decision 006. Updated CLAUDE.md and PROJECT.md (the Apps Script open question is answered).
- **Tested:** the script can't run outside Google, so it was tested with a throwaway fake-Google harness (sheets, form, mail, properties in memory), loading the real Code.gs: 25 checks, all passing. The same checks against the baseline reproduce the bugs (10 notify and 3 signup checks fail). Syntax checked with node. No ID appears anywhere in the repo.
- **Not changed (out of scope, worth a look later):** the announcement email inserts the listing name/notes into its HTML unescaped, and the unsubscribe confirm page puts `id` into a hidden field unescaped. The Google Form subscribe path (`onSubscribeFormSubmit`) can still add duplicates; only the website's `doPost` was changed. The script's fallback tab name is 'Subscribe form responses' while the tab is 'Subscriber form responses' (harmless: tabs are found by header first).
- **Issues touched:** #3, #11, #12, #13, #14 (all closed by their commits).
- **What's next:** Jim follows docs/apps-script-update.md; nothing changes in Google until he does. Then /second-opinion on 6ce9cd4..HEAD.

## 2026-11-03: Closed #2 (no form link on the site)
- **What changed:** No code change. Closed #2 as not planned: the directory is for members of the Speaking Portuguese WhatsApp group only, so the form link is shared through the group's instructions doc, not the site (submissions still start as Pending until Jim approves them). Recorded as decision 005. PROJECT.md: removed the answered open question and added the form link to Out of scope.
- **Issues touched:** #2 (closed, not planned).
- **What's next:** #6 (WhatsApp local/00 numbers) and #8 (repeatable test) are the remaining priority: next items.

## 2026-11-03: Closed #7 (Directory status column)
- **What changed:** No code change. Closed #7 as not needed: listing approval happens on the Google side, and the published Directory tab only ever contains Approved rows (44 rows, all Approved). Setting a row to Pending or Blocked removes it from the site. Added this to PROJECT.md Assumptions and brought "Current status" up to date with today's #1 and #5 work.
- **Issues touched:** #7 (closed, not planned).
- **What's next:** #6 (WhatsApp local/00 numbers) and #8 (repeatable test) are the priority: next items, along with #2 (link to the Google Form).

## 2026-11-03 (review)
- **Reviewed:** ffbe18e..d47840e (49d227f #1, d47840e #5)
- **Verdict:** Sound. No must-fix items; WhatsApp links will break for some number formats.
- **Findings:** (Should) 1. whatsAppLink() builds dead wa.me links for local numbers without a country code ("912 345 678") and "00"-prefixed numbers ("00351…"). 2. Directory rows are not filtered by the sheet's "status" column (pre-existing; all 44 rows currently Approved). 3. No repeatable tests; the #1/#5 checks were one-off. (Could) 4. Plain email contacts aren't turned into mailto links. 5. Type/Level values with stray spaces would break the filters (option text is trimmed, sheet value isn't).
- **Fixed:** none in this review (no must-fix items).
- **Deferred:**
  1. WhatsApp links for local / 00-prefixed numbers → #6 (bug, priority: next)
  2. Directory rows and the status column → #7 (question, priority: next)
  3. Repeatable test for escaping and contact links → #8 (chore, priority: next)
  4. Email contacts as mailto links → #9 (chore, priority: later)
  5. Trim Type/Level so filters match → #10 (bug, priority: later)

## 2026-11-03: Clickable WhatsApp contacts (issue #5)
- **What changed:** index.html has two new helpers. `whatsAppLink()`: if a contact mentions WhatsApp and has a phone number (8–15 digits), it builds `https://wa.me/<digits>` from the digits only. `contactLink()`: decides how a contact is shown. Real links follow the unchanged `isUrl()` rules and are checked first; then WhatsApp text becomes "Message on WhatsApp ↗"; anything else stays as plain "Contact:" text. The card and the pop-up both use it, and the pop-up also shows the original contact text (escaped) so the number can be copied.
- **Affected entries:** Ana ("WhatsApp 1 8159920293", a US number), Kat Molin Mota, and Marcos Bazmandagan (his email stays visible under the link). "Contact Jim R. via DM in WhasApp" has no number, so it stays text. The existing wa.me and chat.whatsapp.com links are unchanged.
- **Tested:** headless Chrome against the live sheet, compared with the #1 version. Only those 3 cards and pop-ups changed; the other 41 and search, filters and accents are identical. wa.me accepts all 3 numbers. The #1 fake-row test still passes, and harmful WhatsApp-style text only ever produces a clean https://wa.me/<digits> link.
- **Note:** "Monologues com Sotaque" links to https://wa.me/913061606, which has no country code and too few digits, so it probably doesn't work. It needs fixing in the sheet (e.g. https://wa.me/351…).
- **Issues touched:** #5 (closed).
- **What's next:** run /second-opinion covering #1 and #5. Then #2 (link to the Google Form).

## 2026-11-03: Escape sheet text (issue #1)
- **What changed:** index.html now escapes every sheet value before inserting it into the page (new `escapeHtml()` helper): filter options, cards, the details pop-up, comments (escaped first, then newlines become `<br>`), and the load-error message. Fixed `isUrl()`, which accepted any URL scheme (including `javascript:`); it now allows only http, https, mailto and tel, and the link address is escaped. "View details" now uses a `data-id` attribute plus one click listener instead of building `onclick` code from the resource id.
- **Tested:** headless Chrome, old vs new page against the live sheet. 42 of 44 cards and pop-ups are identical; search, filters, clear, accents and comment line breaks are unchanged. A fake row injected in the browser (`<b>`, `<img onerror>`, a `javascript:` contact, a `'` in the id) shows as plain text, with no alerts and no link. The old page fired 4 alerts.
- **Visible change (intended):** 2 entries whose contact is "WhatsApp: +351 …" (Kat Molin Mota, Marcos Bazmandagan) used to show a "Contact / Website ↗" link that went nowhere. They now show "Contact: WhatsApp: …" as text in the pop-up and no contact link on the card, the same as other non-link contacts.
- **Issues touched:** #1 (closed).
- **What's next:** run /second-opinion on this change. Possible follow-up: turn WhatsApp/phone contacts into working wa.me or tel: links, either in the sheet or in the code. Then #2 (link to the Google Form).

## 2026-11-03: Adopted 2nd brain workflow
- **What changed:** Linked this local folder to the existing GitHub repo (jamminalley/sprd); the local files were identical to GitHub. Added PROJECT.md, CLAUDE.md, this runlog, decision records (001–004), `.gitignore`, and `_config.yml` (keeps the notes off the website). Set up issue labels and the first issues. No change to index.html.
- **Issues touched:** created the first batch of issues.
- **What's next:** start on the top "priority: now" issue.
