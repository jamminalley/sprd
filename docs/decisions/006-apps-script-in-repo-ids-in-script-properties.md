# 006: The Apps Script code lives in the repo; private IDs live in Script Properties

- **Date:** 2026-11-03
- **Status:** accepted

## Context
The Google Apps Script behind the directory (form handling, email signup, announcement emails, the Support form dropdown) existed only in Google's editor. It had no history and no backup, and changes couldn't be reviewed. Its code contained the admin sheet's ID and the Support form's ID, and the repo is public (decision 001).

## Decision
Keep the script in this repo as `apps-script/Code.gs`. **The repo copy is the source of truth:** changes are made and reviewed here, and Jim pastes the file into the Apps Script editor (following a guide such as `docs/apps-script-update.md`). The private IDs are not in the code. They are stored in the script's **Script Properties** (`SPREADSHEET_ID`, `SUPPORT_FORM_ID`) and read with `PropertiesService`. `apps-script/` is excluded from the website via `_config.yml`.

## Why
Change history and a backup for the script, without exposing the admin sheet's ID in a public repo.

## Consequences
- Never put the sheet ID, form ID or any other private value in `apps-script/`. Add new private settings as Script Properties.
- Edits made directly in Google's editor must be copied back into the repo, or they'll be overwritten next time the repo version is pasted in.
- Changes to `doPost`/`doGet` only reach the website after **Deploy → Manage deployments → edit the existing deployment → New version**. Never create a new deployment, because that changes the web address `index.html` uses.
- New Resources columns must only be added at the far right, because "Aggregated for viewing" selects columns by letter.
