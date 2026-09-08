require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function extractSheetId(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.includes('/spreadsheets/d/')) {
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return trimmed;
}

async function clearGoogleSheet() {
  const sheetId = extractSheetId(process.env.GOOGLE_SHEET_ID);
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.error("❌ Google Sheets credentials missing from .env");
    return;
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Clear all data rows in Sheet1 (A2:Z1000)
    console.log(`🧹 Clearing all data rows from Google Sheet: ${sheetId}...`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: 'Sheet1!A2:Z1000',
    });

    // 2. Re-initialize Row 1 Headers to ensure clean structure
    const headers = [
      ['Timestamp (IST)', 'Full Name', 'Branch', 'Year', 'Phone Number', 'Email Address', 'Payment Mode', 'Payment Details (UTR / Paid To)', 'Status']
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:I1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: headers
      }
    });

    console.log("✅ Google Sheet cleared successfully! Headers set perfectly:");
    console.log(headers[0].join(' | '));

    // 3. Clear local JSON fallback file as well
    const localFile = path.join(__dirname, 'data/registrations.json');
    if (fs.existsSync(localFile)) {
      fs.writeFileSync(localFile, JSON.stringify([], null, 2));
      console.log("✅ Local fallback registrations.json cleared as well!");
    }

  } catch (err) {
    console.error("❌ Failed to clear Google Sheet:", err.message);
  }
}

clearGoogleSheet();
