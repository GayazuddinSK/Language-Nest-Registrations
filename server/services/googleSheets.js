const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const LOCAL_DATA_FILE = path.join(__dirname, '../data/registrations.json');

function ensureLocalFileExists() {
  const dir = path.dirname(LOCAL_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Extracts raw Spreadsheet ID whether given as a full URL or plain ID
 */
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

/**
 * Gets a configured Google Sheets API client if env vars exist
 */
function getSheetsClient() {
  let sheetId = extractSheetId(process.env.GOOGLE_SHEET_ID);
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey || privateKey.trim() === '') {
    return null; // Credentials incomplete, fallback to local store
  }

  try {
    // Unescape newlines in env private key string if needed
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, sheetId };
  } catch (err) {
    console.warn("⚠️ Warning initializing Google Sheets client:", err.message);
    return null;
  }
}

/**
 * Initialize headers in Google Sheet if empty
 */
async function initializeSheetHeaders() {
  const client = getSheetsClient();
  if (!client) {
    console.log("ℹ️ Google Sheets credentials not active. Using local data store.");
    ensureLocalFileExists();
    return;
  }

  const { sheets, sheetId } = client;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:I1',
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:I1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['Timestamp (IST)', 'Full Name', 'Branch', 'Year', 'Phone Number', 'Email Address', 'Payment Mode', 'Payment Details (UTR / Paid To)', 'Status']
          ]
        }
      });
      console.log("✅ Initialized Google Sheet headers in sheet:", sheetId);
    }
  } catch (err) {
    console.error("⚠️ Error initializing Google Sheet headers:", err.message);
  }
}

/**
 * Helper to get formatted Indian Standard Time timestamp
 */
function getISTTimestamp() {
  try {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }
}

/**
 * Get all registrations from Google Sheet or local fallback
 */
async function getAllRegistrations() {
  const client = getSheetsClient();

  if (client) {
    try {
      const { sheets, sheetId } = client;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A2:I',
      });

      const rows = res.data.values || [];
      return rows.map((row, index) => ({
        memberId: index + 1,
        timestamp: row[0] || '',
        fullName: row[1] || '',
        branch: row[2] || '',
        year: row[3] || '',
        phone: row[4] || '',
        email: row[5] || '',
        paymentMode: row[6] || 'Online',
        paymentDetails: row[7] || 'N/A',
        status: row[8] || 'Registered'
      }));
    } catch (err) {
      console.warn("⚠️ Google Sheets API fetch failed, falling back to local store:", err.message);
    }
  }

  // Local fallback
  ensureLocalFileExists();
  try {
    const rawData = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    const records = JSON.parse(rawData);
    return records.map((rec, index) => ({
      memberId: index + 1,
      timestamp: rec.timestamp,
      fullName: rec.fullName,
      branch: rec.branch,
      year: rec.year,
      phone: rec.phone,
      email: rec.email,
      paymentMode: rec.paymentMode || 'Online',
      paymentDetails: rec.paymentDetails || 'N/A',
      status: rec.status || 'Registered'
    }));
  } catch (err) {
    console.error("Error reading local registrations file:", err.message);
    return [];
  }
}

/**
 * Add a new registration
 */
async function addRegistration(data) {
  const { fullName, branch, year, phone, email, paymentMode, paymentDetails } = data;
  const existing = await getAllRegistrations();

  // Validate uniqueness
  const phoneExists = existing.some(r => r.phone === phone.trim());
  if (phoneExists) {
    const error = new Error("This phone number is already registered!");
    error.status = 400;
    throw error;
  }

  const emailExists = existing.some(r => r.email.toLowerCase() === email.trim().toLowerCase());
  if (emailExists) {
    const error = new Error("This email address is already registered!");
    error.status = 400;
    throw error;
  }

  const timestamp = getISTTimestamp();
  const defaultStatus = 'Registered';
  const memberId = existing.length + 1;

  const newRecord = {
    memberId,
    timestamp,
    fullName: fullName.trim(),
    branch: branch.trim(),
    year: year.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    paymentMode: paymentMode ? paymentMode.trim() : 'Online',
    paymentDetails: paymentDetails ? paymentDetails.trim() : 'N/A',
    status: defaultStatus
  };

  const client = getSheetsClient();

  if (client) {
    try {
      const { sheets, sheetId } = client;
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            newRecord.timestamp,
            newRecord.fullName,
            newRecord.branch,
            newRecord.year,
            newRecord.phone,
            newRecord.email,
            newRecord.paymentMode,
            newRecord.paymentDetails,
            newRecord.status
          ]]
        }
      });
      console.log(`✅ Appended new registration for ${newRecord.fullName} to Google Sheets!`);
    } catch (err) {
      console.error("⚠️ Failed to append to Google Sheets, using local store fallback:", err.message);
    }
  }

  ensureLocalFileExists();
  try {
    const rawData = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    const records = JSON.parse(rawData);
    records.push({
      timestamp: newRecord.timestamp,
      fullName: newRecord.fullName,
      branch: newRecord.branch,
      year: newRecord.year,
      phone: newRecord.phone,
      email: newRecord.email,
      paymentMode: newRecord.paymentMode,
      paymentDetails: newRecord.paymentDetails,
      status: newRecord.status
    });
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(records, null, 2));
  } catch (err) {
    console.error("Error persisting to local fallback JSON:", err.message);
  }

  return newRecord;
}

module.exports = {
  initializeSheetHeaders,
  getAllRegistrations,
  addRegistration
};
