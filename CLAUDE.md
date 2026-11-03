# CLAUDE.md: sprd (Speaking Portuguese Recommendations Directory)

## Project notes
- **What it is:** a single static web page, `index.html` (plain HTML, CSS and JavaScript, no framework, no build step).
- **Data:** read at page load from a published Google Sheet (two CSV tabs: Directory and Recommendations), parsed with Papa Parse from a CDN. Members add recommendations via a Google Form that feeds the sheet. Content changes happen in the sheet, not the code.
- **Email signup:** posts to a Google Apps Script web app (`SUBSCRIBE_ENDPOINT` in index.html). The Apps Script code is not in this repo.
- **Run / test:** open `index.html` in a browser (it fetches the live sheet data). Check the email signup on the live site.
- **Publish:** push to `main`. GitHub Pages serves https://jamminalley.github.io/sprd/ and updates within a minute or two.
- **Public repo:** the repo must stay public for free GitHub Pages, so everything committed (including these notes) and all issues are public. Never put anything private in them. `_config.yml` keeps the notes files off the website. If you add a new notes folder or file, add it to `exclude:` there.
- `robots.txt` and the `noindex` meta tag keep the site out of search engines on purpose.

## 2nd brain workflow

### At the start of every session
0. Open by stating this project's stamp in one line, e.g. "This is a BUSINESS project." Read it from the `.claude-account` marker file in the project folder (that marker is what actually routes the folder to the right Claude Max account) and check it agrees with PROJECT.md. If they disagree or the marker is missing, tell Jim and fix it with `claude-stamp personal .` or `claude-stamp business .` (**Where:** VS Code terminal, in the project folder), then ask him to reload the VS Code window before continuing.
1. Read PROJECT.md, the latest 3 entries in the runlog (docs/runlog.md), and the decision records (docs/decisions/).
2. Check open issues: `gh issue list`
3. Give Jim a short summary of where things stand and propose the next step (usually the top "priority: now" issue). Wait for his go-ahead before starting large changes.

### Task tracking (GitHub Issues)
- All work is tracked as GitHub Issues, using the `gh` tool.
- Labels: type (`feature`, `bug`, `chore`, `question`) and priority (`priority: now`, `priority: next`, `priority: later`).
- Reference issues in commit messages ("Fixes #12" when a commit completes one).
- Close an issue when its work is done and committed.
- New work discovered along the way becomes a new issue rather than quietly expanding the current task.

### At the end of every session
1. Add a runlog entry (date, what changed, issues touched, what's next).
2. Update "Current status" in PROJECT.md if it changed.
3. Record significant decisions as new decision records.
4. Commit and push.

### Working alongside the advisor chat
Jim usually runs a second, read-only Claude chat for this folder, started with /advisor. It plans, weighs options and writes the instruction blocks Jim pastes here. It reads docs/runlog.md, git log, git status, git diff and `gh issue list` directly, so the handoff to it IS the runlog entry plus the commit and push. When Jim says "hand off", "I'm done" or similar: do the end-of-session steps, then reply with at most three lines (what was done, what's open, anything only Jim can do). Never write a summary for Jim to copy into the advisor chat. If you need a decision from Jim, ask it in one short question; if it's a planning or priority question, say "that's one for the advisor chat" and stop.

### Rules
- Never commit secrets: API keys, passwords, certificates, .p8 keys, .env files.
- Before creating issues or pushing, check `gh auth status` matches the project's stamp.
- The Claude account is chosen by the folder's `.claude-account` marker, never by signing in or out. `claude auth status` shows which account this folder is metered to.
