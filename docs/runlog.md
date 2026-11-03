# Runlog

Newest entries at the top.

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
