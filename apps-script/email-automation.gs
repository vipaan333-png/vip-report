/**
 * Email automation for Google Spreadsheet.
 *
 * Required config sheet:
 * - Sheet name: EMAIL
 * - Column A header: SHEET
 * - Column B header: EMAIL
 * - If EMAIL cell is empty, that row is skipped.
 */

const EMAIL_CONFIG = {
  CONFIG_SHEET_NAME: 'EMAIL',
  SHEET_HEADER: 'SHEET',
  EMAIL_HEADER: 'EMAIL',
  MAX_ROWS_IN_EMAIL: 200
};

function sendSalesReportEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mapping = readEmailMapping_(ss);

  if (mapping.length === 0) {
    Logger.log('No valid mapping rows found in EMAIL sheet.');
    return;
  }

  const sentAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  mapping.forEach(item => {
    const sheet = ss.getSheetByName(item.sheetName);
    if (!sheet) {
      Logger.log('Skip. Sheet not found: %s', item.sheetName);
      return;
    }

    const htmlBody = buildSheetTableHtml_(sheet, EMAIL_CONFIG.MAX_ROWS_IN_EMAIL);
    const subject = `Laporan Sales - ${item.sheetName} (${sentAt})`;
    const plainBody = `Laporan sheet "${item.sheetName}" terlampir dalam format HTML table.`;

    MailApp.sendEmail({
      to: item.email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });

    Logger.log('Sent: %s -> %s', item.sheetName, item.email);
  });
}

function readEmailMapping_(ss) {
  const cfg = ss.getSheetByName(EMAIL_CONFIG.CONFIG_SHEET_NAME);
  if (!cfg) {
    throw new Error(`Sheet "${EMAIL_CONFIG.CONFIG_SHEET_NAME}" tidak ditemukan.`);
  }

  const values = cfg.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(v => String(v).trim().toUpperCase());
  const sheetCol = headers.indexOf(EMAIL_CONFIG.SHEET_HEADER);
  const emailCol = headers.indexOf(EMAIL_CONFIG.EMAIL_HEADER);

  if (sheetCol === -1 || emailCol === -1) {
    throw new Error('Header EMAIL sheet harus memiliki kolom "SHEET" dan "EMAIL".');
  }

  const rows = [];
  for (let i = 1; i < values.length; i += 1) {
    const sheetName = String(values[i][sheetCol] || '').trim();
    const email = String(values[i][emailCol] || '').trim();

    if (!sheetName) {
      continue;
    }
    if (!email) {
      // User requirement: empty email means do not send.
      continue;
    }

    rows.push({ sheetName, email });
  }

  return rows;
}

function buildSheetTableHtml_(sheet, maxRows) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length === 0) {
    return `<p>Sheet <b>${escapeHtml_(sheet.getName())}</b> kosong.</p>`;
  }

  const limited = data.slice(0, Math.max(1, maxRows));
  const header = limited[0];
  const bodyRows = limited.slice(1);

  let html = '';
  html += `<h3 style="margin:0 0 12px 0;">Laporan Sales - ${escapeHtml_(sheet.getName())}</h3>`;
  html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">';
  html += '<thead><tr style="background:#f4f4f4;">';
  header.forEach(h => {
    html += `<th>${escapeHtml_(h)}</th>`;
  });
  html += '</tr></thead><tbody>';

  bodyRows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${escapeHtml_(cell)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  if (data.length > maxRows) {
    html += `<p style="margin-top:10px;color:#666;">Menampilkan ${maxRows} dari ${data.length} baris.</p>`;
  }

  return html;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Helper to create daily trigger at 07:00 script timezone.
 * Run once manually if you want schedule-based delivery.
 */
function createDailyEmailTrigger() {
  ScriptApp.newTrigger('sendSalesReportEmails')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
}
