require('dotenv').config();
const { google } = require('googleapis');

function cleanPrivateKey(rawKey) {
  if (!rawKey) return null;
  let key = rawKey.trim();

  // Strip wrapping quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  key = key.replace(/\\"/g, '"').replace(/\\'/g, "'");
  key = key.replace(/\\n/g, '\n');
  key = key.replace(/\r/g, '');

  return key;
}

async function testKey() {
  const envKey = process.env.GOOGLE_PRIVATE_KEY;
  console.log("Raw Key snippet:", envKey ? envKey.substring(0, 40) : "MISSING");

  const cleaned = cleanPrivateKey(envKey);
  console.log("Cleaned Key snippet:", cleaned ? cleaned.substring(0, 40) : "MISSING");

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: cleaned,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const tokens = await auth.authorize();
    console.log("✅ OAuth Authorization SUCCESSFUL! Token received!");
  } catch (err) {
    console.error("❌ OAuth Authorization FAILED:", err.message);
  }
}

testKey();
