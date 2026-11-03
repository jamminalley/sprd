/************************ CONFIG ************************/
// Private IDs are NOT stored in this code (it's kept in a public GitHub repo).
// Set them in the Apps Script editor: Project Settings → Script properties:
//   SPREADSHEET_ID   main admin sheet       (/d/<ID>/edit in the Sheet URL)
//   SUPPORT_FORM_ID  "Support" Google Form  (/d/<ID>/edit in the Form URL)
// Read them with spreadsheetId_() and supportFormId_() (see below).

// Core data tabs
var RESOURCES_SHEET               = 'Resources';
var SUPPORTING_SHEET             = 'Supporting recommendations';

// Tabs created by the linked Google Forms (names may vary—handlers use headers)
var RES_FORM_RESPONSES_SHEET     = 'Resource form responses';
var SUPPORT_FORM_RESPONSES_SHEET = 'Support form responses';

// The "Support an existing recommendation" Form (dropdown of resources)
// (its ID is the SUPPORT_FORM_ID script property, see top of CONFIG)
var RESOURCE_Q_TITLE             = 'Resource';                     // exact title of the question

// Status / Consent values
var STATUS_APPROVED              = 'Approved';
var STATUS_PENDING               = 'Pending';
var STATUS_BLOCKED               = 'Blocked';
var CONSENT_YES                  = 'Yes'; // set to null to ignore consent gating

// ID prefixes
var RESOURCE_PREFIX              = 'RSC-';
var SUPPORT_PREFIX               = 'REV-'; // keep your existing "review_id" prefix

// ── NEW: Email Subscribers ──
var SUBSCRIBERS_SHEET            = 'Email Subscribers';
var SUBSCRIBER_PREFIX            = 'SUB-';
var SUBSCRIBE_FORM_RESPONSES_SHEET = 'Subscribe form responses';

// ── NEW: Email Notifications ──
var DIRECTORY_URL                = 'https://jamminalley.github.io/sprd/';
var NOTIFICATION_SENDER_NAME    = 'Speaking Portuguese Directory';
// Column on Resources (far right, found by header name) holding the date a
// listing was announced. Blank = not announced yet. Never move it left of
// existing columns: "Aggregated for viewing" picks columns by letter.
var NOTIFIED_AT_HEADER           = 'notified_at';

// The DEPLOYED Web App URL (from Deploy → Manage deployments).
// Must be the /exec URL so unsubscribe links work for everyone.
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxglaw0vYdJGrAuyu96mUHXpp-2_j5mcmPZQsxYhmGz223CvjCLYhaixj5ybzbYb1Hj/exec';
/********************************************************/

/** Read a required Script Property, with a clear error if it's missing. */
function getRequiredProperty_(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v || !String(v).trim()) {
    throw new Error('Missing Script Property "' + key + '". In the Apps Script editor, open ' +
      'Project Settings (gear icon) → Script properties, and add ' + key + '.');
  }
  return String(v).trim();
}
function spreadsheetId_() { return getRequiredProperty_('SPREADSHEET_ID'); }
function supportFormId_() { return getRequiredProperty_('SUPPORT_FORM_ID'); }


/**************** ON OPEN — ADMIN MENU ******************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Directory Admin')
    .addItem('Assign missing IDs', 'assignIds')
    .addItem('Sync "Support" form dropdown now', 'syncResourceDropdown')
    .addSeparator()
    .addItem('Test: copy last Resource response', 'copyLatestResourceResponse')
    .addItem('Test: copy last Support response', 'copyLatestSupportResponse')
    .addItem('Test: copy last Subscribe response', 'copyLatestSubscribeResponse')
    .addSeparator()
    .addItem('Notify subscribers about selected resource', 'notifySelectedResource')
    .addItem('Mark all approved as already announced', 'markApprovedAsAnnounced')
    .addSeparator()
    .addItem('Diagnose Resource flow', 'diagnoseResourceFlow')
    .addItem('Diagnose Support flow', 'diagnoseSupportFlow')
    .addToUi();
}

/*************** ONE-TIME SETUP (optional) **********/
function setUp() {
  // 1) Push choices into the Support form now
  syncResourceDropdown();
  // 2) (Optional) Recreate triggers cleanly
  Setup();
}


/************ 1) SYNC APPROVED RESOURCES → FORM ************/
function syncResourceDropdown() {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var sh = ss.getSheetByName(RESOURCES_SHEET);
  if (!sh) throw new Error("Sheet '" + RESOURCES_SHEET + "' not found.");

  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return;

  var header = toLowerHeaders_(vals[0]);
  var cId      = header.indexOf('resource_id');
  var cName    = header.indexOf('name_title');
  var cStatus  = header.indexOf('status');
  var cConsent = header.indexOf('consent');

  if (cId === -1 || cName === -1) {
    throw new Error("Columns 'resource_id' and 'name_title' are required in '" + RESOURCES_SHEET + "'.");
  }

  var choices = [];
  for (var i = 1; i < vals.length; i++) {
    var row = vals[i];

    // status gate
    if (cStatus !== -1) {
      var s = String(row[cStatus] || '').trim();
      if (s !== STATUS_APPROVED) continue;
    }
    // consent gate
    if (cConsent !== -1 && CONSENT_YES) {
      var cons = String(row[cConsent] || '').trim();
      if (cons !== CONSENT_YES) continue;
    }

    var id = String(row[cId] || '').trim();
    var nm = String(row[cName] || '').trim();
    if (id && nm) choices.push(id + ' — ' + nm);
  }

  var form = FormApp.openById(supportFormId_());
  var item = getItemByTitle_(form, RESOURCE_Q_TITLE);
  var type = item.getType();
  if (type === FormApp.ItemType.LIST) {
    item.asListItem().setChoiceValues(choices);
  } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
    item.asMultipleChoiceItem().setChoiceValues(choices);
  } else {
    throw new Error("Question '" + RESOURCE_Q_TITLE + "' must be Dropdown or Multiple choice.");
  }
}
function getItemByTitle_(form, title) {
  var items = form.getItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle && items[i].getTitle() === title) return items[i];
  }
  throw new Error("Form is missing a question titled '" + title + "'.");
}


/*************** COMMON HELPERS (header-driven) ***************/
function _headerIndexMap_(row) {
  var m = {};
  row.forEach((h, i) => {
    var key = String(h).trim().toLowerCase();
    if (key) m[key] = i;
  });
  return m;
}
function _sheetToObjects_(sh) {
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var idx = _headerIndexMap_(vals[0]);
  return vals.slice(1).map(r => ({ row: r, idx: idx }));
}
function _pick(rowObj, /* strings */) {
  var row = rowObj.row, idx = rowObj.idx;
  for (var a = 1; a < arguments.length; a++) {
    var needle = String(arguments[a]).toLowerCase();
    var key = Object.keys(idx).find(k => k.indexOf(needle) !== -1);
    if (key != null) return row[idx[key]] || '';
  }
  return '';
}

/*************** DETECT TABS BY HEADER (not name) ***************/
function _looksLikeResourceForm_(sh) {
  var hdr = toLowerHeaders_(sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]);
  var needs = ['type of resource', 'name/title', 'level', 'description', 'recommended by'];
  return needs.every(n => hdr.some(h => h.indexOf(n) !== -1));
}
function _looksLikeSupportForm_(sh) {
  var hdr = toLowerHeaders_(sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]);
  var needs = ['resource', 'comments', 'submitted by'];
  return needs.every(n => hdr.some(h => h.indexOf(n) !== -1));
}
function _looksLikeSubscribeForm_(sh) {
  var hdr = toLowerHeaders_(sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]);
  return hdr.some(function(h) { return h.indexOf('email') !== -1; });
}

/******** 2) RESOURCE FORM SUBMIT → append to Resources ********/
function onResourceFormSubmit(e) {
  try {
    var sh = e && e.range && e.range.getSheet ? e.range.getSheet() : null;
    if (!sh || !_looksLikeResourceForm_(sh)) return;

    var rows = _sheetToObjects_(sh);
    var last = rows[rows.length - 1];
    if (!last) return;

    _appendResourceResponseRow_(last);
    console.log('onResourceFormSubmit: appended 1 row from "'+ sh.getName() +'"');
  } catch (err) {
    console.error('onResourceFormSubmit error:', err);
    throw err;
  }
}
function _appendResourceResponseRow_(r) {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var resources = ss.getSheetByName(RESOURCES_SHEET);
  if (!resources) throw new Error("Sheet '"+RESOURCES_SHEET+"' not found.");

  var ts        = _pick(r, 'timestamp', 'time');
  var type      = _pick(r, 'type of resource');
  var name      = _pick(r, 'name/title');
  var level     = _pick(r, 'level');
  var cost      = _pick(r, 'cost/rate');
  var mods      = _pick(r, 'modalities');
  var loc       = _pick(r, 'location');
  var url       = _pick(r, 'contact/url');
  var sched     = _pick(r, 'schedule');
  var notes     = _pick(r, 'description');
  var recommendedBy = _pick(r, 'recommended by');
  var consent   = _pick(r, 'consent');

  var createdAt = Utilities.formatDate(
    ts ? new Date(ts) : new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var nextResourceId = getNextSequentialId_(resources, 'resource_id', RESOURCE_PREFIX);
    resources.appendRow([
      nextResourceId,     // resource_id
      type,               // type
      name,               // name_title
      level,              // level
      cost,               // cost_value
      mods,               // modalities
      loc,                // location
      url,                // contact_url
      sched,              // schedule
      notes,              // notes
      recommendedBy,      // recommended_by
      STATUS_PENDING,     // status
      createdAt,          // created_at
      consent             // consent
    ]);
  } finally {
    lock.releaseLock();
  }
}

/*** 3) SUPPORT FORM SUBMIT → append to Supporting recommendations ***/
function onSupportFormSubmit(e) {
  try {
    var sh = e && e.range && e.range.getSheet ? e.range.getSheet() : null;
    if (!sh || !_looksLikeSupportForm_(sh)) return;

    var rows = _sheetToObjects_(sh);
    var last = rows[rows.length - 1];
    if (!last) return;

    _appendSupportResponseRow_(last);
    console.log('onSupportFormSubmit: appended 1 row from "'+ sh.getName() +'"');
  } catch (err) {
    console.error('onSupportFormSubmit error:', err);
    throw err;
  }
}
function _appendSupportResponseRow_(r) {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var support = ss.getSheetByName(SUPPORTING_SHEET);
  if (!support) throw new Error("Sheet '"+SUPPORTING_SHEET+"' not found.");

  var ts   = _pick(r, 'timestamp', 'time', 'submitted at');
  var when = Utilities.formatDate(
    ts ? new Date(ts) : new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  // "RSC-0001 — Name"
  var resourceRaw = String(_pick(r, 'resource') || '');
  var resourceId = '', resourceName = '';
  if (resourceRaw.includes(' — ')) {
    var parts = resourceRaw.split(' — ');
    resourceId   = (parts[0]||'').trim();
    resourceName = parts.slice(1).join(' — ').trim();
  }

  var text = _pick(r, 'comments', 'comment');
  var who  = _pick(r, 'submitted by', 'name', 'reviewer');

  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var nextId = getNextSequentialId_(support, 'review_id', SUPPORT_PREFIX);
    support.appendRow([
      nextId,            // review_id
      resourceId,        // resource_id
      resourceName,      // resource_name
      who,               // recommender
      text,              // comment_text
      when,              // submitted_at
      STATUS_PENDING     // status (admins approve)
    ]);
  } finally {
    lock.releaseLock();
  }
}


/*** 4) SUBSCRIBE FORM SUBMIT → append to Email Subscribers ***/
function onSubscribeFormSubmit(e) {
  try {
    var sh = e && e.range && e.range.getSheet ? e.range.getSheet() : null;
    if (!sh || !_looksLikeSubscribeForm_(sh)) return;

    var rows = _sheetToObjects_(sh);
    var last = rows[rows.length - 1];
    if (!last) return;

    _appendSubscribeResponseRow_(last);
    console.log('onSubscribeFormSubmit: appended 1 row from "' + sh.getName() + '"');
  } catch (err) {
    console.error('onSubscribeFormSubmit error:', err);
    throw err;
  }
}
function _appendSubscribeResponseRow_(r) {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var subs = ss.getSheetByName(SUBSCRIBERS_SHEET);
  if (!subs) throw new Error("Sheet '" + SUBSCRIBERS_SHEET + "' not found.");

  var ts    = _pick(r, 'timestamp', 'time');
  var email = _pick(r, 'email');

  var subscribedAt = Utilities.formatDate(
    ts ? new Date(ts) : new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var nextId = getNextSequentialId_(subs, 'subscriber_id', SUBSCRIBER_PREFIX);
    subs.appendRow([
      nextId,          // subscriber_id
      email,           // email
      subscribedAt,    // subscribed_at
      'Active'         // status
    ]);
  } finally {
    lock.releaseLock();
  }
}


/*** 5) AUTO-NOTIFY SUBSCRIBERS WHEN A RESOURCE IS FIRST APPROVED ***/
/*  Each listing is announced at most once: subscribers are emailed only when
    status becomes Approved, consent is "Yes", and notified_at is blank. The
    date is then written into notified_at, so re-approving a listing later
    (e.g. Approved → Pending → Approved) never re-emails everyone.
    Any status change (to any value) also re-syncs the Support form's
    dropdown. The two steps are independent: an error in one never stops
    the other.                                                              */
function onStatusChange(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();

    // Only care about edits on the Resources sheet
    if (sheet.getName() !== RESOURCES_SHEET) return;

    // Only care about edits that touch the "status" column
    var headers = toLowerHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
    var statusCol = headers.indexOf('status');
    if (statusCol === -1) return;

    // range columns are 1-based, statusCol is 0-based
    var touchesStatus = range.getColumn() - 1 <= statusCol && statusCol <= range.getLastColumn() - 1;
    if (!touchesStatus) return;
  } catch (err) {
    console.error('onStatusChange error:', err);
    return;
  }

  // 1) Email subscribers — single-cell edits only, when status BECAME "Approved"
  try {
    if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
      var newValue = String(range.getValue()).trim();
      var wasApproved = e.oldValue != null && String(e.oldValue).trim() === STATUS_APPROVED;
      if (newValue === STATUS_APPROVED && !wasApproved) {
        _notifyIfNotYetAnnounced_(sheet, range.getRow(), headers);
      }
    }
  } catch (err) {
    console.error('onStatusChange: notification failed:', err);
  }

  // 2) Keep the Support form's dropdown in step with Approved listings
  try {
    syncResourceDropdown();
  } catch (err) {
    console.error('onStatusChange: dropdown sync failed:', err);
  }
}

/** Email subscribers about one Resources row, unless it was already announced
 *  or has no consent. Marks notified_at BEFORE sending, so two quick edits
 *  can't send the same announcement twice.                                  */
function _notifyIfNotYetAnnounced_(sheet, rowNum, headers) {
  var notifiedCol = headers.indexOf(NOTIFIED_AT_HEADER);
  if (notifiedCol === -1) {
    console.error('Not emailing: no "' + NOTIFIED_AT_HEADER + '" column header on "' + RESOURCES_SHEET +
      '". Add it in the first empty column on the right (P).');
    return;
  }

  var resource;
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (CONSENT_YES) {
      var cConsent = headers.indexOf('consent');
      var consent = cConsent === -1 ? '' : String(row[cConsent] || '').trim();
      if (consent !== CONSENT_YES) {
        console.log('Not emailing row ' + rowNum + ': consent is not "' + CONSENT_YES + '".');
        return;
      }
    }
    if (String(row[notifiedCol] || '').trim()) {
      console.log('Not emailing row ' + rowNum + ': already announced (' + NOTIFIED_AT_HEADER + ' is filled in).');
      return;
    }

    resource = {
      name:  String(row[headers.indexOf('name_title')] || '').trim(),
      type:  String(row[headers.indexOf('type')] || '').trim(),
      level: String(row[headers.indexOf('level')] || '').trim(),
      notes: String(row[headers.indexOf('notes')] || '').trim()
    };
    if (!resource.name) return;  // safety check

    sheet.getRange(rowNum, notifiedCol + 1).setValue(_nowStamp_());
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  notifySubscribers_(resource);
  console.log('onStatusChange: notified subscribers about "' + resource.name + '"');
}

/** Menu (run once): fill notified_at for every Approved row that's blank, so
 *  listings approved before notified_at existed are never re-announced.
 *  Sends no emails.                                                        */
function markApprovedAsAnnounced() {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.openById(spreadsheetId_()).getSheetByName(RESOURCES_SHEET);
  if (!sh) throw new Error("Sheet '" + RESOURCES_SHEET + "' not found.");

  var vals = sh.getDataRange().getValues();
  var headers = toLowerHeaders_(vals[0]);
  var cStatus   = headers.indexOf('status');
  var cNotified = headers.indexOf(NOTIFIED_AT_HEADER);
  if (cNotified === -1) {
    ui.alert('First add a column header "' + NOTIFIED_AT_HEADER + '" in the first empty column on the right of "' +
      RESOURCES_SHEET + '" (column P), then run this again.');
    return;
  }
  if (cStatus === -1) { ui.alert('No "status" column found on "' + RESOURCES_SHEET + '".'); return; }

  var rowsToMark = [];
  for (var i = 1; i < vals.length; i++) {
    var status = String(vals[i][cStatus] || '').trim();
    var notified = String(vals[i][cNotified] || '').trim();
    if (status === STATUS_APPROVED && !notified) rowsToMark.push(i + 1);
  }
  if (!rowsToMark.length) {
    ui.alert('Nothing to do: every Approved listing already has a ' + NOTIFIED_AT_HEADER + ' date.');
    return;
  }

  var confirm = ui.alert(
    'Mark as already announced?',
    'Fill in ' + NOTIFIED_AT_HEADER + ' for ' + rowsToMark.length + ' Approved listing(s)? No emails will be sent.',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var stamp = _nowStamp_();
  rowsToMark.forEach(function(r) { sh.getRange(r, cNotified + 1).setValue(stamp); });
  ui.alert('Done: marked ' + rowsToMark.length + ' listing(s) as already announced.');
}

function _nowStamp_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function notifySubscribers_(resource) {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var subSheet = ss.getSheetByName(SUBSCRIBERS_SHEET);
  if (!subSheet) { console.log('No subscribers sheet found — skipping notification.'); return; }

  var vals = subSheet.getDataRange().getValues();
  if (vals.length < 2) { console.log('No subscribers yet.'); return; }

  var hdr = _headerIndexMap_(vals[0]);
  var idCol     = hdr['subscriber_id'];
  var emailCol  = hdr['email'];
  var statusCol = hdr['status'];

  if (emailCol == null) { console.error('No "email" column in subscribers sheet.'); return; }

  // Collect active subscribers (id + email)
  var recipients = [];
  for (var i = 1; i < vals.length; i++) {
    var subStatus = statusCol != null ? String(vals[i][statusCol]).trim() : 'Active';
    var addr = String(vals[i][emailCol]).trim();
    var subId = idCol != null ? String(vals[i][idCol]).trim() : '';
    if (subStatus === 'Active' && addr) {
      recipients.push({ id: subId, email: addr });
    }
  }

  if (!recipients.length) { console.log('No active subscribers to notify.'); return; }

  // Build shared email pieces
  var subject = 'New resource added: ' + resource.name;
  var typeLine  = resource.type  ? 'Type: ' + resource.type : '';
  var levelLine = resource.level ? 'Level: ' + resource.level : '';
  var metaLine  = [typeLine, levelLine].filter(Boolean).join('  |  ');

  // Use the hardcoded deployed Web App URL (not the HEAD/dev URL)
  var webAppUrl = WEB_APP_URL;

  var sent = 0, failed = 0;
  for (var j = 0; j < recipients.length; j++) {
    var rcpt = recipients[j];
    var unsubUrl = webAppUrl +
      '?action=unsubscribe' +
      '&id=' + encodeURIComponent(rcpt.id) +
      '&email=' + encodeURIComponent(rcpt.email);

    var plainBody =
      'A new resource has been added to the Speaking Portuguese Recommendations Directory!\n\n' +
      resource.name + '\n' +
      (metaLine ? metaLine + '\n' : '') +
      (resource.notes ? '\n' + resource.notes + '\n' : '') +
      '\nView the full directory: ' + DIRECTORY_URL + '\n' +
      '\n---\n' +
      'You are receiving this because you subscribed to directory updates.\n' +
      'Unsubscribe: ' + unsubUrl + '\n';

    var htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
        '<div style="background:#006600;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;text-align:center">' +
          '<h2 style="margin:0">New Resource Added</h2>' +
        '</div>' +
        '<div style="padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 10px 10px">' +
          '<h3 style="color:#006600;margin:0 0 8px">' + resource.name + '</h3>' +
          (metaLine
            ? '<p style="color:#555;margin:0 0 12px">' + metaLine.replace(/\|/g, '&middot;') + '</p>'
            : '') +
          (resource.notes
            ? '<p style="margin:0 0 16px">' + resource.notes + '</p>'
            : '') +
          '<a href="' + DIRECTORY_URL + '" style="display:inline-block;background:#d40000;color:#fff;' +
            'padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:bold">' +
            'View the Directory</a>' +
          '<p style="color:#666;font-size:12px;margin:20px 0 0">' +
            'You are receiving this because you subscribed to updates from the ' +
            'Speaking Portuguese Recommendations Directory.<br>' +
            'No longer interested? ' +
            '<a href="' + unsubUrl + '" style="color:#006600;font-weight:bold;text-decoration:underline">Unsubscribe here</a>.' +
          '</p>' +
        '</div>' +
      '</div>';

    try {
      MailApp.sendEmail({
        to: rcpt.email,
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody,
        name: NOTIFICATION_SENDER_NAME
      });
      sent++;
    } catch (err) {
      console.error('Failed to send to ' + rcpt.email + ': ' + err);
      failed++;
    }
  }

  console.log('Notification: sent=' + sent + ' failed=' + failed + ' resource="' + resource.name + '"');
}

/** Manual notify: select a row on Resources, then run from menu */
function notifySelectedResource() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== RESOURCES_SHEET) {
    SpreadsheetApp.getUi().alert('Please select a row on the "' + RESOURCES_SHEET + '" sheet.');
    return;
  }

  var row = SpreadsheetApp.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Please select a data row, not the header.'); return; }

  var headers = toLowerHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
  var vals = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  var resource = {
    name:  String(vals[headers.indexOf('name_title')] || '').trim(),
    type:  String(vals[headers.indexOf('type')] || '').trim(),
    level: String(vals[headers.indexOf('level')] || '').trim(),
    notes: String(vals[headers.indexOf('notes')] || '').trim()
  };

  if (!resource.name) { SpreadsheetApp.getUi().alert('This row has no name.'); return; }

  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Send notification?',
    'Send an email about "' + resource.name + '" to all active subscribers?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  notifySubscribers_(resource);

  // Record the announcement so a later approval doesn't send it again
  var cNotified = headers.indexOf(NOTIFIED_AT_HEADER);
  if (cNotified !== -1 && !String(vals[cNotified] || '').trim()) {
    sheet.getRange(row, cNotified + 1).setValue(_nowStamp_());
  }
  ui.alert('Notification sent for "' + resource.name + '".');
}


/*** 6) WEB APP ENDPOINT — receives subscribe POSTs from the website ***/
/*  Deploy as: Execute as "Me", Who has access "Anyone".
    The website POSTs { email: "..." } and gets a JSON response.       */

function doPost(e) {
  try {
    // Unsubscribe confirmation (form POST from the confirm page)
    var params = (e && e.parameter) || {};
    if (params.action === 'unsubscribe') {
      return _handleUnsubscribe_(params);
    }

    // Otherwise treat this as a subscribe JSON POST
    var data = JSON.parse(e.postData.contents);
    var email = (data.email || '').trim();

    if (!email) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'error', message: 'No email provided.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Write directly to Email Subscribers sheet
    var ss = SpreadsheetApp.openById(spreadsheetId_());
    var subs = ss.getSheetByName(SUBSCRIBERS_SHEET);
    if (!subs) throw new Error("Sheet '" + SUBSCRIBERS_SHEET + "' not found.");

    var subscribedAt = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );

    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);
    var outcome;
    try {
      outcome = _addOrReactivateSubscriber_(subs, email, subscribedAt);
    } finally {
      lock.releaseLock();
    }
    console.log('doPost subscribe: ' + outcome);

    // Same reply in every case, so the website just says "You're subscribed!"
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok', message: 'Subscribed!' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('doPost error:', err);
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/** Add a subscriber without creating duplicates. Emails are compared
 *  ignoring case and spaces. Already Active → nothing to do.
 *  Unsubscribed → set back to Active. Any other existing status (e.g. one
 *  set by hand) is left alone. Otherwise a new Active row is added.
 *  Call while holding the document lock. Returns what happened, for the log. */
function _addOrReactivateSubscriber_(subs, email, subscribedAt) {
  var vals = subs.getDataRange().getValues();
  var hdr = vals.length ? _headerIndexMap_(vals[0]) : {};
  var emailCol  = hdr['email'];
  var statusCol = hdr['status'];

  if (emailCol != null) {
    var target = _normEmail_(email);
    var unsubRow = -1, otherStatus = '';
    for (var i = 1; i < vals.length; i++) {
      if (_normEmail_(vals[i][emailCol]) !== target) continue;
      var st = statusCol != null ? String(vals[i][statusCol]).trim() : 'Active';
      if (st === 'Active') return 'already active';
      if (st === 'Unsubscribed') { if (unsubRow === -1) unsubRow = i; }
      else if (!otherStatus) otherStatus = st || '(blank)';
    }
    if (unsubRow !== -1) {
      subs.getRange(unsubRow + 1, statusCol + 1).setValue('Active');
      return 'reactivated (row ' + (unsubRow + 1) + ')';
    }
    if (otherStatus) return 'exists with status ' + otherStatus + ', left unchanged';
  }

  var nextId = getNextSequentialId_(subs, 'subscriber_id', SUBSCRIBER_PREFIX);
  subs.appendRow([
    nextId,          // subscriber_id
    email,           // email
    subscribedAt,    // subscribed_at
    'Active'         // status
  ]);
  return 'added ' + nextId;
}
function _normEmail_(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

/** GET handler — used for the unsubscribe link in notification emails,
 *  and returns a plain OK page if hit with no parameters.
 *  Expected URL: ?action=unsubscribe&id=SUB-0001&email=foo@bar.com        */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (params.action === 'unsubscribe') {
      // Show a confirmation page only — do NOT change state here,
      // because email-provider link scanners auto-visit GET URLs.
      return _showUnsubscribeConfirmPage_(params);
    }

    return HtmlService.createHtmlOutput(
      '<p style="font-family:Arial;padding:40px;text-align:center">' +
      'Speaking Portuguese Directory subscribe endpoint is live.</p>'
    );
  } catch (err) {
    console.error('doGet error:', err);
    return HtmlService.createHtmlOutput(
      '<p style="font-family:Arial;padding:40px;text-align:center;color:#c00">' +
      'Error: ' + err.message + '</p>'
    );
  }
}

function _showUnsubscribeConfirmPage_(params) {
  var id = String(params.id || '').trim();
  var email = String(params.email || '').trim();
  var safeEmail = email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  var html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirm Unsubscribe</title></head>' +
    '<body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:20px;color:#222">' +
      '<div style="border:2px solid #006600;border-radius:10px;padding:30px;text-align:center">' +
        '<h2 style="color:#006600;margin:0 0 16px">Unsubscribe</h2>' +
        '<p style="font-size:16px;margin:0 0 20px">' +
          'Are you sure you want to unsubscribe ' +
          '<strong>' + safeEmail + '</strong> ' +
          'from Speaking Portuguese Directory updates?</p>' +
        '<form method="POST" action="' + WEB_APP_URL + '" target="_top" style="margin:0">' +
          '<input type="hidden" name="action" value="unsubscribe">' +
          '<input type="hidden" name="id" value="' + id + '">' +
          '<input type="hidden" name="email" value="' + safeEmail + '">' +
          '<button type="submit" style="background:#d40000;color:#fff;border:0;' +
            'padding:12px 24px;border-radius:10px;font-weight:bold;font-size:16px;' +
            'cursor:pointer">Yes, unsubscribe me</button>' +
        '</form>' +
        '<p style="margin:24px 0 0">' +
          '<a href="' + DIRECTORY_URL + '" style="color:#006600">No, keep me subscribed</a>' +
        '</p>' +
      '</div>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html);
}

function _handleUnsubscribe_(params) {
  var id = String(params.id || '').trim();
  var email = String(params.email || '').trim().toLowerCase();

  if (!id || !email) {
    return _unsubscribeHtml_('Missing unsubscribe info. Please use the link from your notification email.', false);
  }

  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var subs = ss.getSheetByName(SUBSCRIBERS_SHEET);
  if (!subs) return _unsubscribeHtml_('Subscribers sheet not found.', false);

  var vals = subs.getDataRange().getValues();
  if (vals.length < 2) return _unsubscribeHtml_('No subscribers on file.', false);

  var hdr = _headerIndexMap_(vals[0]);
  var idCol     = hdr['subscriber_id'];
  var emailCol  = hdr['email'];
  var statusCol = hdr['status'];

  if (idCol == null || emailCol == null || statusCol == null) {
    return _unsubscribeHtml_('Subscribers sheet is missing required columns.', false);
  }

  for (var i = 1; i < vals.length; i++) {
    var rowId    = String(vals[i][idCol]).trim();
    var rowEmail = String(vals[i][emailCol]).trim().toLowerCase();
    if (rowId === id && rowEmail === email) {
      subs.getRange(i + 1, statusCol + 1).setValue('Unsubscribed');
      return _unsubscribeHtml_(
        "You've been unsubscribed. You won't receive any more notifications from the Speaking Portuguese Recommendations Directory.",
        true
      );
    }
  }

  return _unsubscribeHtml_("We couldn't find that subscription. You may have already unsubscribed.", false);
}

function _unsubscribeHtml_(message, success) {
  var color = success ? '#006600' : '#555';
  var html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head>' +
    '<body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:20px;color:#222">' +
      '<div style="border:2px solid ' + color + ';border-radius:10px;padding:30px;text-align:center">' +
        '<h2 style="color:' + color + ';margin:0 0 16px">' +
          (success ? 'Unsubscribed' : 'Unsubscribe') +
        '</h2>' +
        '<p style="font-size:16px;margin:0 0 20px">' + message + '</p>' +
        '<a href="' + DIRECTORY_URL + '" style="display:inline-block;background:#d40000;color:#fff;' +
          'padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:bold">' +
          'Back to the Directory</a>' +
      '</div>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html);
}


/********************** UTILITIES ************************/
function assignIds() {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var rs = ss.getSheetByName(RESOURCES_SHEET);
  var sp = ss.getSheetByName(SUPPORTING_SHEET);
  if (rs) backfillIds_(rs, 'resource_id', RESOURCE_PREFIX);
  if (sp) backfillIds_(sp, 'review_id',   SUPPORT_PREFIX);
}
function backfillIds_(sheet, headerName, prefix) {
  var range = sheet.getDataRange();
  var vals = range.getValues();
  if (vals.length < 2) return;

  var header = toLowerHeaders_(vals[0]);
  var idCol = header.indexOf(headerName);
  if (idCol === -1) return;

  var maxNum = getMaxIdNumberInColumn_(vals, idCol, prefix);
  var changed = false;
  for (var r = 1; r < vals.length; r++) {
    var id = String(vals[r][idCol] || '').trim();
    if (!id) {
      maxNum += 1;
      vals[r][idCol] = prefix + pad4_(maxNum);
      changed = true;
    }
  }
  if (changed) range.setValues(vals);
}
function getNextSequentialId_(sheet, headerName, prefix) {
  var vals = sheet.getDataRange().getValues();
  if (vals.length < 2) return prefix + '0001';
  var header = toLowerHeaders_(vals[0]);
  var idCol = header.indexOf(headerName);
  if (idCol === -1) throw new Error("'" + headerName + "' column not found in '" + sheet.getName() + "'.");
  var maxNum = getMaxIdNumberInColumn_(vals, idCol, prefix);
  return prefix + pad4_(maxNum + 1);
}
function getMaxIdNumberInColumn_(vals, idCol, prefix) {
  var maxNum = 0;
  for (var r = 1; r < vals.length; r++) {
    var raw = String(vals[r][idCol] || '').trim();
    if (!raw) continue;
    var n = parseInt(raw.replace(prefix, ''), 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  return maxNum;
}
function toLowerHeaders_(row) {
  var out = [];
  for (var i = 0; i < row.length; i++) out.push(String(row[i]).trim().toLowerCase());
  return out;
}
function pad4_(n) {
  var s = String(n);
  while (s.length < 4) s = '0' + s;
  return s;
}

/**************** ONE-TIME TRIGGER INSTALLER ****************/
/** Run once if you want to recreate the two on-submit triggers. */
function Setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onResourceFormSubmit').forSpreadsheet(spreadsheetId_()).onFormSubmit().create();
  ScriptApp.newTrigger('onSupportFormSubmit').forSpreadsheet(spreadsheetId_()).onFormSubmit().create();
  ScriptApp.newTrigger('onSubscribeFormSubmit').forSpreadsheet(spreadsheetId_()).onFormSubmit().create();
  ScriptApp.newTrigger('onStatusChange').forSpreadsheet(spreadsheetId_()).onEdit().create();
  SpreadsheetApp.getUi().alert('Setup complete: triggers created.');
}

/**************** DIAGNOSTICS + MANUAL TEST HELPERS ****************/
// Resource
function diagnoseResourceFlow() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const sheets = ss.getSheets();
  const candidates = sheets.filter(_looksLikeResourceForm_);
  const sh = candidates[0];
  const log = [];
  log.push('Resource response tab detected: ' + (sh ? sh.getName() : '(none)'));
  const trigCount = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction()==='onResourceFormSubmit').length;
  log.push('onResourceFormSubmit trigger count: ' + trigCount);
  if (sh) {
    const r = sh.getLastRow(), c = sh.getLastColumn();
    log.push('Last response row/col: ' + r + '/' + c);
    if (r>=2) log.push('Preview first 4 cells: ' + JSON.stringify(sh.getRange(r,1,1,Math.min(4,c)).getValues()[0]));
  }
  Logger.log(log.join('\n'));
}
function copyLatestResourceResponse() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const sh = (ss.getSheets().filter(_looksLikeResourceForm_)[0] || ss.getSheetByName(RES_FORM_RESPONSES_SHEET));
  if (!sh) throw new Error('Could not find a Resource form responses tab.');
  const rows = _sheetToObjects_(sh);
  if (!rows.length) throw new Error('No responses to copy.');
  _appendResourceResponseRow_(rows[rows.length-1]);
  Logger.log('Manually copied last Resource response from "'+ sh.getName() +'"');
}

// Support
function diagnoseSupportFlow() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const sheets = ss.getSheets();
  const candidates = sheets.filter(_looksLikeSupportForm_);
  const sh = candidates[0];
  const log = [];
  log.push('Support response tab detected: ' + (sh ? sh.getName() : '(none)'));
  const trigCount = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction()==='onSupportFormSubmit').length;
  log.push('onSupportFormSubmit trigger count: ' + trigCount);
  if (sh) {
    const r = sh.getLastRow(), c = sh.getLastColumn();
    log.push('Last response row/col: ' + r + '/' + c);
    if (r>=2) log.push('Preview first 4 cells: ' + JSON.stringify(sh.getRange(r,1,1,Math.min(4,c)).getValues()[0]));
  }
  Logger.log(log.join('\n'));
}
function copyLatestSupportResponse() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const sh = (ss.getSheets().filter(_looksLikeSupportForm_)[0] || ss.getSheetByName(SUPPORT_FORM_RESPONSES_SHEET));
  if (!sh) throw new Error('Could not find a Support form responses tab.');
  const rows = _sheetToObjects_(sh);
  if (!rows.length) throw new Error('No responses to copy.');
  _appendSupportResponseRow_(rows[rows.length-1]);
  Logger.log('Manually copied last Support response from "'+ sh.getName() +'"');
}

// Subscribe
function copyLatestSubscribeResponse() {
  var ss = SpreadsheetApp.openById(spreadsheetId_());
  var sh = (ss.getSheets().filter(_looksLikeSubscribeForm_)[0] ||
            ss.getSheetByName(SUBSCRIBE_FORM_RESPONSES_SHEET));
  if (!sh) throw new Error('Could not find a Subscribe form responses tab.');
  var rows = _sheetToObjects_(sh);
  if (!rows.length) throw new Error('No responses to copy.');
  _appendSubscribeResponseRow_(rows[rows.length - 1]);
  Logger.log('Manually copied last Subscribe response from "' + sh.getName() + '"');
}

// 1) Confirms we're talking to the same file you're viewing.
//    Also writes a visible stamp into Resources!Z1 in that file.
function debugTargets() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const res = ss.getSheetByName(RESOURCES_SHEET);
  if (!res) throw new Error('Resources sheet not found');

  Logger.log('CONFIG SPREADSHEET_ID: %s', spreadsheetId_());
  Logger.log('Opened file name: %s', ss.getName());
  Logger.log('Opened file URL:  %s', ss.getUrl());
  Logger.log('Resources sheetId: %s  lastRow(before): %s', res.getSheetId(), res.getLastRow());

  res.getRange('Z1').setValue('DEBUG stamp ' + new Date().toISOString());

  Logger.log('Wrote to Resources!Z1');
  Logger.log('lastRow(after): %s', res.getLastRow());
}

// 2) Appends an unmistakable debug row to Resources
function appendDebugRow() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  const res = ss.getSheetByName(RESOURCES_SHEET);
  res.appendRow(['DEBUG-' + new Date().toISOString(), '(type)', '(name)', '(level)']);
  Logger.log('Appended DEBUG row to Resources');
}

// 3) Lists all sheet/tab names in the target file (to catch a name mismatch)
function listTabs() {
  const ss = SpreadsheetApp.openById(spreadsheetId_());
  Logger.log('Tabs: ' + ss.getSheets().map(s => s.getName()).join(' | '));
}

// 4) Same "copy newest response" but using the *bound* spreadsheet,
//    ignoring SPREADSHEET_ID (to rule out an ID mismatch).
function copyLatestResourceResponseBound() {
  const ss  = SpreadsheetApp.getActive();
  const src = ss.getSheetByName(RES_FORM_RESPONSES_SHEET);
  const dst = ss.getSheetByName(RESOURCES_SHEET);
  if (!src || !dst) throw new Error('Missing expected sheets');

  const r = src.getLastRow();
  if (r < 2) { Logger.log('No responses.'); return; }
  const v = src.getRange(r, 1, 1, src.getLastColumn()).getValues()[0];

  const createdAt = Utilities.formatDate(
    v[0] ? new Date(v[0]) : new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  const lock = LockService.getDocumentLock(); lock.waitLock(30000);
  try {
    const nextId = getNextSequentialId_(dst, 'resource_id', RESOURCE_PREFIX);
    dst.appendRow([
      nextId,
      v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9],
      v[10], 'Pending', createdAt, v[11]
    ]);
  } finally { lock.releaseLock(); }

  Logger.log('Bound copy appended one row.');
}
