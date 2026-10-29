/**
 * Kronos beta signups: Google Apps Script web app behind the beta page form.
 *
 * Paste this into Extensions > Apps Script in the signup Google Sheet, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * The page posts text/plain JSON here:
 *   { type: "visit", source }                  -> one row in "Visits"
 *   { type: "signup", email, style, source }   -> one row in "Signups"
 * A repeat email is accepted but not stored twice, so the form never reveals
 * who already signed up. Apps Script never sees visitor IP addresses.
 */

const STYLES = ['day', 'swing', 'both'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCE = /^[a-z0-9_-]{1,24}$/;

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return reply({ ok: false, error: 'Something went wrong. Please try again in a minute.' });
  }
  const source = cleanSource(body.source);
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    if (body.type === 'visit') {
      sheet(book, 'Visits', ['Time', 'Source']).appendRow([new Date(), source]);
      return reply({ ok: true });
    }

    const email = String(body.email || '').trim().toLowerCase();
    // Leading = + - @ would make Sheets read the cell as a formula.
    if (email.length > 254 || !EMAIL.test(email) || /^[=+\-@]/.test(email)) {
      return reply({ ok: false, error: 'Enter a valid email address.' });
    }
    if (STYLES.indexOf(body.style) === -1) {
      return reply({ ok: false, error: 'Choose how you trade.' });
    }
    const signups = sheet(book, 'Signups', ['Time', 'Email', 'Style', 'Source']);
    const rows = signups.getLastRow() - 1;
    const known = rows > 0 ? signups.getRange(2, 2, rows, 1).getValues().map(function (r) { return r[0]; }) : [];
    if (known.indexOf(email) === -1) {
      signups.appendRow([new Date(), email, body.style, source]);
    }
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function cleanSource(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return 'direct';
  return SOURCE.test(value) ? value : 'other';
}

function sheet(book, name, header) {
  let tab = book.getSheetByName(name);
  if (!tab) {
    tab = book.insertSheet(name);
    tab.appendRow(header);
    tab.setFrozenRows(1);
  }
  return tab;
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
