# Updating the Google Apps Script (November 2026)

This guide puts the new version of the directory's Apps Script into Google. The Apps Script is the small program attached to the Google Sheet that handles form submissions, signups and announcement emails.

**What the new version fixes:**
- Re-approving a listing no longer re-emails every subscriber (#11).
- The Support form's dropdown updates by itself whenever you change a listing's status (#12).
- Signing up twice with the same email no longer adds a second row (#13).
- Old test/debug code is removed (#14).
- The sheet and form IDs are now kept in Google's private "Script properties" instead of in the code, so the code can safely live in the public GitHub repo (#3).

**Before you start:**
- Allow about 20 minutes.
- Do the steps in order. Nothing changes for members until step 4.
- The new code is in this repo at `apps-script/Code.gs`. On GitHub: https://github.com/jamminalley/sprd/blob/main/apps-script/Code.gs

---

## Step 1: Back up the current code

This gives you a copy of the old code to go back to if anything goes wrong.

**Where:** your web browser, in the directory's Google Sheet

1. Choose **Extensions → Apps Script**.
2. Click **Code.gs** in the file list on the left.
3. Click in the code, press **Cmd+A** (select all), then **Cmd+C** (copy).
4. Open a new Google Doc (go to docs.new in a new tab) and name it **"Directory Apps Script backup 2026-11-03"**.
5. Paste with **Cmd+V**.

Keep this Doc private. It contains the sheet and form IDs.

---

## Step 2: Add the two Script Properties

The new code reads the sheet's ID and the Support form's ID from here instead of having them written into the code.

**Where:** the Apps Script editor (same tab as step 1)

1. Click the **gear icon (Project Settings)** on the far left.
2. Scroll down to **Script properties** and click **Add script property** (or **Edit script properties**, then **Add script property**).
3. Add the first one:
   - **Property:** `SPREADSHEET_ID`
   - **Value:** in your backup Doc, find the line that starts `var SPREADSHEET_ID = '`. Copy just the long code **between the quote marks** (not the quotes themselves) and paste it here.
4. Click **Add script property** again and add the second one:
   - **Property:** `SUPPORT_FORM_ID`
   - **Value:** in the backup, find the line that starts `var SUPPORT_FORM_ID`. Copy the code between the quote marks.
5. Click **Save script properties**.

The property names must be exactly as shown, in capitals with the underscore.

---

## Step 3: Add the "notified_at" column to Resources

This column records when each listing was announced to subscribers, so it's never announced twice.

**Where:** the Google Sheet, **Resources** tab

1. Click cell **P1**, the first empty column header after `num_recommendations` in O.
2. Type `notified_at` (all lowercase, with the underscore) and press Enter.

Two cautions:
- **Don't insert a column anywhere else.** The "Aggregated for viewing" tab picks Resources columns by letter, so adding one in the middle would scramble the website. Column P, at the far right, is safe.
- **Optional tidy-up:** old test code sometimes wrote "DEBUG stamp …" into **Z1** on Resources, or added rows whose ID starts with "DEBUG-". If you see either, you can delete them.

---

## Step 4: Paste in the new code and save

**Where:** your web browser

1. Open https://github.com/jamminalley/sprd/blob/main/apps-script/Code.gs
2. Click the **Copy raw file** button. It looks like two overlapping squares, near the top right of the code.
3. Go back to the Apps Script editor tab and click **Code.gs** on the left.
4. Click in the code, press **Cmd+A** to select all of the old code, then **Cmd+V** to paste the new code over it.
5. Press **Cmd+S** to save.

**What you should see:** "Saved" near the top, with no red error bar. If you see an error, don't continue. Paste your backup from step 1 back in, save, and stop there.

---

## Step 5: Mark all existing listings as "already announced" (once only)

This fills in `notified_at` for every listing that's already Approved, so none of them get announced again. It sends **no** emails.

**Where:** the Google Sheet

1. Reload the Sheet's browser tab (**Cmd+R**) so the menu picks up the new item.
2. Choose **Directory Admin → Mark all approved as already announced**.
3. If Google asks you to authorize the script, click through and allow it (it's your own script).
4. It asks "Fill in notified_at for N Approved listing(s)?" N should roughly match the number of listings on the website (44 on 3 Nov 2026). Click **Yes**.

**What you should see:** "Done: marked N listing(s) as already announced", and column P on Resources now has a date next to every Approved listing.

---

## Step 6: Update the website's signup to the new version

The signup box on the website uses a "deployed" copy of the script, which stays on the old version until you update it.

> ⚠️ Update the **existing** deployment. Do **not** click "New deployment": that would create a new web address, and the website's signup box would keep talking to the old one.

**Where:** the Apps Script editor

1. Click **Deploy → Manage deployments** (top right).
2. Select the existing deployment on the left (there should be one, marked Active).
3. Click the **pencil icon (Edit)**.
4. Under **Version**, choose **New version**.
5. Click **Deploy**.
6. Check that the **Web app URL** shown ends in `…5ybzbYb1Hj/exec`. That's the same address the website uses. If it's different, stop and don't change anything else: a new deployment was created by mistake.

---

## Step 7: Test that it works

**Test A: duplicate signups (#13)**
1. On https://jamminalley.github.io/sprd/, subscribe with your own email address.
2. Do it again with the same address.
3. Both times you should see "You're subscribed!". In the Sheet's **Email Subscribers** tab, your address should appear only **once**, with status Active.

**Test B: dropdown updates by itself, and no repeat email (#12 and #11)**
1. On **Resources**, pick a listing that's Approved and now has a date in column P.
2. Change its status to **Pending**.
3. Open the Support form (the "support an existing recommendation" form). The listing should be **gone** from the dropdown.
4. Change the status back to **Approved**. The listing should be back in the dropdown, and **no** email should go out. If you're a subscriber, check your inbox; it should stay quiet.

**Test C: new listings are still announced (#11)**
- There's no safe way to test this without emailing every subscriber, so watch the next real approval. When you approve a genuinely new listing (consent "Yes"), subscribers get **one** email and column P gets that day's date.

**Checking for errors at any time:**
- **Where:** the Apps Script editor → **Executions** (the list icon on the far left).
- Each status change shows an `onStatusChange` run. Red "Failed" entries or error messages mean something needs a look. Messages like "Not emailing row 12: already announced" are normal.

---

## If something goes wrong: roll back

**Where:** the Apps Script editor

1. Open your backup Doc from step 1, select all (**Cmd+A**) and copy (**Cmd+C**).
2. In Apps Script, click **Code.gs**, select all, paste over it, and save (**Cmd+S**).
3. Do step 6 again (**Deploy → Manage deployments → Edit → Version: New version → Deploy**) so the website's signup uses the old code too.

You can leave the Script Properties and the `notified_at` column in place; the old code ignores them. Bear in mind that the old code has the old problems: it re-emails everyone on re-approval and adds duplicate signups.
