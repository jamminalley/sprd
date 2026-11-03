# 003: Email signup via a Google Apps Script web app

- **Date:** 2026-04-14 (recorded retroactively 2026-11-03)
- **Status:** accepted

## Context
The "Get notified about new resources" signup was first built by quietly submitting a hidden Google Form in an invisible frame. That approach couldn't tell whether the signup actually worked, so it always showed "You're subscribed!" after a delay.

## Decision
Switch the signup to post directly to a Google Apps Script web app (`SUBSCRIBE_ENDPOINT` in index.html), which replies with a status that the page shows to the visitor.

## Why
Real success and error messages, and the script can also handle the notification emails.

## Consequences
- The Apps Script code lives in Google, not in this repo.
- If the script is redeployed under a new web address, `SUBSCRIBE_ENDPOINT` must be updated.
