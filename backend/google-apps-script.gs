/**
 * Pekdigitals website forms backend (Google Apps Script)
 * ======================================================
 * Receives every form on pekdigitals.com (sent by forms.js) and:
 *   1. saves it as a row in this Google Sheet (one tab per form + an "All Submissions" log),
 *   2. emails it to NOTIFY_EMAIL with Reply-To set to the client,
 *   3. sends the client an automatic confirmation reply,
 *   4. stores support-ticket attachments in a Google Drive folder,
 *   5. backs the whole Sheet up to Google Drive every night (keeps the last 30 copies).
 *
 * SETUP: see backend/README.md
 */

var CONFIG = {
  NOTIFY_EMAIL: 'support@bigkeysenterprises.com',
  BRAND: 'Pekdigitals',
  SITE_URL: 'https://pekdigitals.com',
  LOGO_URL: 'https://pekdigitals.com/brand/logo-440.png',
  PHONE: '+254 719 613 330',
  ATTACHMENTS_FOLDER: 'Pekdigitals Support Attachments',
  BACKUP_FOLDER: 'Pekdigitals Form Backups',
  KEEP_BACKUPS: 30
};

// Auto-reply wording per form.
var REPLIES = {
  'Free Consultation': {
    subject: 'We received your free consultation request – Pekdigitals',
    body: 'Thank you for requesting a free consultation. One of our team will contact you within 24 hours to discuss your goals and the best way we can help.'
  },
  'Contact Enquiry': {
    subject: 'Thanks for contacting Pekdigitals',
    body: 'Thank you for getting in touch. We have received your message and will reply within 24 hours (Monday–Saturday).'
  },
  'Support Ticket': {
    subject: 'Support ticket {ticket} received – Pekdigitals',
    body: 'Your support ticket <strong>{ticket}</strong> has been created. Our technical team will respond within 24 hours. Please quote this ticket ID in any follow-up.'
  },
  'Newsletter Signup': {
    subject: 'Welcome to the Pekdigitals newsletter',
    body: 'Thank you for subscribing! You will now receive our latest digital marketing, SEO, social media and web design tips. You can reply to this email at any time to unsubscribe.'
  },
  'Affiliate Application': {
    subject: 'Your Pekdigitals affiliate application',
    body: 'Thank you for applying to the Pekdigitals Affiliate Programme. We review applications within 48 hours and will email your unique affiliate link once you are approved.'
  }
};

// ---------------------------------------------------------------------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents);
    var f = d.fields || {};
    if (f._hp) return json_({ ok: true }); // spam trap
    if (!d.id || !d.formType) return json_({ ok: false, error: 'Invalid submission' });
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return json_({ ok: false, error: 'Invalid email' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = sheet_(ss, 'All Submissions', ['ID', 'Received', 'Form', 'Name', 'Email', 'Phone', 'Page', 'Details']);

    // Already saved (e.g. a retry from the browser outbox)? Then just confirm.
    if (log.getLastRow() > 1 && log.getRange(2, 1, log.getLastRow() - 1, 1)
        .createTextFinder(d.id).matchEntireCell(true).findNext()) {
      return json_({ ok: true, id: d.id, duplicate: true });
    }

    // Newsletter: don't add the same email twice.
    if (d.formType === 'Newsletter Signup' && f.email) {
      var subs = sheet_(ss, 'Newsletter Signup', ['ID', 'Received', 'Page']);
      if (subs.getLastRow() > 1 && subs.getDataRange().createTextFinder(f.email).matchEntireCell(true).findNext()) {
        return json_({ ok: true, id: d.id, duplicate: true });
      }
    }

    // Attachments -> Drive
    var blobs = [], links = [];
    (d.attachments || []).forEach(function (a) {
      var blob = Utilities.newBlob(Utilities.base64Decode(a.data), a.type, a.name);
      var file = folder_(CONFIG.ATTACHMENTS_FOLDER).createFile(blob).setName((d.ticketId || d.id) + ' - ' + a.name);
      blobs.push(blob);
      links.push(file.getUrl());
    });
    if (links.length) f.attachments = links.join('\n');

    var received = new Date();

    // Per-form tab, columns added automatically as new fields appear.
    var tab = sheet_(ss, d.formType, ['ID', 'Received', 'Page']);
    var headers = tab.getRange(1, 1, 1, tab.getLastColumn()).getValues()[0];
    Object.keys(f).forEach(function (k) {
      if (headers.indexOf(k) === -1) { headers.push(k); tab.getRange(1, headers.length).setValue(k).setFontWeight('bold'); }
    });
    tab.appendRow(headers.map(function (h) {
      if (h === 'ID') return d.id;
      if (h === 'Received') return received;
      if (h === 'Page') return d.page || '';
      return f[h] !== undefined ? safe_(f[h]) : '';
    }));

    var details = Object.keys(f).map(function (k) { return k + ': ' + f[k]; }).join('\n');
    log.appendRow([d.id, received, d.formType, safe_(f.name || ''), safe_(f.email || ''), safe_(f.phone || ''), d.page || '', safe_(details)]);

    // Emails
    notify_(d, f, blobs);
    if (f.email) autoReply_(d, f);

    return json_({ ok: true, id: d.id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Health check: open the Web App URL in a browser to see this.
function doGet() {
  return json_({ ok: true, service: CONFIG.BRAND + ' forms', time: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Emails

function notify_(d, f, blobs) {
  var rows = Object.keys(f).map(function (k) {
    return '<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600;background:#f8fafc">' + esc_(k) +
      '</td><td style="padding:6px 10px;border:1px solid #e5e7eb;white-space:pre-wrap">' + esc_(f[k]) + '</td></tr>';
  }).join('');
  var html = '<div style="font-family:Arial,sans-serif;color:#1f2937">' +
    '<h2 style="margin:0 0 8px">New ' + esc_(d.formType) + '</h2>' +
    '<p style="margin:0 0 12px;color:#64748b">Reference ' + esc_(d.id) + ' · from ' + esc_(d.page || '') + ' · ' + new Date().toLocaleString() + '</p>' +
    '<table style="border-collapse:collapse;font-size:14px">' + rows + '</table>' +
    '<p style="margin-top:16px;color:#64748b;font-size:12px">Reply to this email to answer the client directly. All submissions are saved in the "' +
    esc_(SpreadsheetApp.getActiveSpreadsheet().getName()) + '" Google Sheet.</p></div>';
  var opts = { to: CONFIG.NOTIFY_EMAIL, subject: '[' + CONFIG.BRAND + '] ' + d.formType + (f.name ? ' from ' + f.name : '') + (d.ticketId ? ' (' + d.ticketId + ')' : ''),
    htmlBody: html, name: CONFIG.BRAND + ' Website' };
  if (f.email) opts.replyTo = f.email;
  if (blobs.length) opts.attachments = blobs;
  MailApp.sendEmail(opts);
}

function autoReply_(d, f) {
  var r = REPLIES[d.formType] || { subject: 'We received your message – ' + CONFIG.BRAND, body: 'Thank you, we have received your submission and will be in touch soon.' };
  var fill = function (s) { return s.replace(/\{ticket\}/g, d.ticketId || d.id); };
  var first = String(f.name || '').trim().split(/\s+/)[0];
  var summary = Object.keys(f).filter(function (k) { return k !== 'attachments'; }).map(function (k) {
    return '<tr><td style="padding:4px 10px 4px 0;color:#64748b;vertical-align:top">' + esc_(k) + '</td><td style="padding:4px 0;white-space:pre-wrap">' + esc_(f[k]) + '</td></tr>';
  }).join('');
  var html = '<div style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:auto">' +
    '<p style="text-align:center;margin:0 0 20px"><img src="' + CONFIG.LOGO_URL + '" alt="' + CONFIG.BRAND + '" width="160" style="width:160px;height:auto"></p>' +
    '<p>Hi ' + esc_(first || 'there') + ',</p>' +
    '<p>' + fill(r.body) + '</p>' +
    (d.formType === 'Newsletter Signup' ? '' :
      '<p style="margin-top:20px;font-weight:600">Here is a copy of what you sent us:</p><table style="font-size:14px">' + summary + '</table>') +
    '<p style="margin-top:20px">Need anything else? Just reply to this email or call ' + CONFIG.PHONE + '.</p>' +
    '<p>Kind regards,<br><strong>The ' + CONFIG.BRAND + ' Team</strong><br><a href="' + CONFIG.SITE_URL + '">' + CONFIG.SITE_URL.replace('https://', '') + '</a></p>' +
    '<p style="color:#94a3b8;font-size:12px;margin-top:24px">Reference: ' + esc_(d.id) + '</p></div>';
  MailApp.sendEmail({ to: f.email, subject: fill(r.subject), htmlBody: html, name: CONFIG.BRAND, replyTo: CONFIG.NOTIFY_EMAIL });
}

// ---------------------------------------------------------------------------
// Backups

/** Copies this spreadsheet into the backup folder in Google Drive; keeps the newest KEEP_BACKUPS copies. */
function backupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var folder = folder_(CONFIG.BACKUP_FOLDER);
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' – backup ' + stamp, folder);
  var files = [], it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(CONFIG.KEEP_BACKUPS).forEach(function (file) { file.setTrashed(true); });
}

/** Run once after pasting the script: creates the tabs, the nightly backup, and asks for permissions. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet_(ss, 'All Submissions', ['ID', 'Received', 'Form', 'Name', 'Email', 'Phone', 'Page', 'Details']);
  Object.keys(REPLIES).forEach(function (t) { sheet_(ss, t, ['ID', 'Received', 'Page']); });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'backupSpreadsheet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('backupSpreadsheet').timeBased().everyDays(1).atHour(2).create();
  folder_(CONFIG.BACKUP_FOLDER);
  folder_(CONFIG.ATTACHMENTS_FOLDER);
  backupSpreadsheet();
  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, CONFIG.BRAND + ' website forms are connected',
    'Website form submissions will now be emailed here and saved in the Google Sheet "' + ss.getName() + '".\n' + ss.getUrl());
  Logger.log('Setup complete. Remaining email quota today: ' + MailApp.getRemainingDailyQuota());
}

// ---------------------------------------------------------------------------
// Helpers

function sheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a2332').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function folder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

// Stop values starting with = + - @ being treated as spreadsheet formulas.
function safe_(v) {
  v = String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function esc_(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
