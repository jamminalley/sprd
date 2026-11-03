# Runlog

Newest entries at the top.

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
