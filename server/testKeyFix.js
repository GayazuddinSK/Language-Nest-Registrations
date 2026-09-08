const { google } = require('googleapis');

function cleanPrivateKey(rawKey) {
  if (!rawKey) return null;
  let key = rawKey.trim();

  // Strip all leading/trailing quotes or backslashes
  key = key.replace(/^["'`\\]+|["'`\\]+$/g, '').trim();

  // Replace literal '\n' or '\\n' with actual newline
  key = key.replace(/\\+n/g, '\n');

  // Replace literal '\r' with empty
  key = key.replace(/\r/g, '');

  // Ensure clean header & footer linebreaks
  if (key.includes('-----BEGIN PRIVATE KEY-----') && !key.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
    key = key.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
  }
  if (key.includes('-----END PRIVATE KEY-----') && !key.includes('\n-----END PRIVATE KEY-----')) {
    key = key.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  // Ensure clean lines
  key = key.split('\n').map(line => line.trim()).filter(Boolean).join('\n');

  return key;
}

// Test case 1: Raw key with escaped newlines and quotes
const testKey1 = `"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6jIlNt9ZwHlFc\\n3tgn9uDybAWL5vkkUADPMlOL/djjV2lnPyH/RrIHAHoupNLId9aQTiZmlhLK2ghg\\nMjvWWTUzxgT6EWOg8OdJN4+HNcOR38D1TMnit9be+hF0QMGHjUeFbO/L6rvNi1hK\\ngl6BT5e8DgoxlK/5Vs2W0Fx7Id64lZ+VDJuzmB2NR5SpBhjcjhyAE8j93G2hv2w0\\n7aipxQVQxCfqCXQ6Vl9aKNeONOoCtKaLovEGy5tY8Fx639rc+/GaW1fOdUDlhkSu\\nCy6GZ7zrZniOWeIjfhCrsBw65jVV3Nl2F4zx+/bGnxChZ02c/lplrMpBS9FDq+/7\\nmy5vwfwlAgMBAAECggEACqILC3aAjwhzW8dJ69E7FiZJFKXYKpUyzpyQPYj9DUxE\\nskFbdzj42cRRsonrh8io3rXNo4hHTu+pjY4fcgLIsQhG7VgDZT+F91rm3+6VFKH7\\n1h+H3FfdM/1t9EHipg7L9lN0wZtCFB+uqySOLXGzdOEZ/KR8eUpU0pVSyCPwlXW8\\n44U8NWW9RmEMZ0W5mmdMPuneb4HtO6dq/NhVzWrBjEuYhiz5jB9WkNnl33EMLsmd\\nleCdi3hU44UQsLY1iOLZ/gL12rthcOYzXZO0sO3NQmHagM5L8gRwECUhVz3f+B69\\nX8661WCLzf0pDEuVuU2AW6i4glcstv/dY/ouEyRpEQKBgQDhow0EwiiE+g46CCFH\\nbWdqFNrk2WxyJ3Eb+5wXH9iSrF7ttjhfraaXIG3QmT3GfX2JlvaU9/dfsQi5LJQJ\\natrCXOBip9cgqiY3yfwI+iuKzEgq0p7Qs2C7upSi8FsoJClHGZDrl43g8LseLzg3\\nxTDExQ+xlKE8K7L8Eal8aM3EvQKBgQDTpvKfFtuXDyz29iNuKEMPDyRgVIWWbBwJ\\nI3gbgo1uWvz4BDi4F/wumUzqbKlQAjsYvdWNbdtNLQfeHwzsaBAyb67YY33wPZe/\\nmjYfcHIvksH/1g+EI2+HrxBWn3kvQTWlK42K1VDGir9zkA37tLMNPQghnRjYldwT\\nAPdG9WkviQKBgQDY3w4xR6kIfwvTjWLnM2mVlav7EFvisLRP0BvsQgi4mYK4ek9e\\n7xpS4bGLMO8mbBGQgJBLCLc0u4UF7qnvD0xqSjjFukrUs5X+Q17DBil5w/WNa1mI\\ngRD1/1TD87+6Kl+eXh1jxAxzaw5+6aXgPOEuD7aQ2anLmrjy/MrpsBYvBQKBgDJB\\n8FbKjLYgCmNSKzObJ+FJjS+6okYHwdiBraGKrJ7JyEv0ZKuCNoWyLUt1JfczsGi9\\nmxoMPgjjanzaDq2MQFxZnMERTvRfC8uZiMSKZPLa/GoNoH2WFIO5lD2dfJ818tEX\\nuHKBGL8sby23xTpBvEqmdWnV7fJwE2QH1K/q0mFRAoGBANcBhe1b4ycJA4SB1h7o\\nHi3AOha/oRkwfa40FNPQvit1aDFy0hAB8KhN0ygg2iRKh9LV6HZQSz+VHCUphoyD\\neMvKV1v2dzRVcI5xZLzjGVADo/82W9u5Q3nY27FDP/uLcZmWWoM7UllEmxXUwlC2\\nWxFtMPRd+1C5SgeSMumageGi\\n-----END PRIVATE KEY-----\\n"`;

async function run() {
  const cleaned = cleanPrivateKey(testKey1);
  console.log("Cleaned Key line count:", cleaned.split('\n').length);
  try {
    const auth = new google.auth.JWT({
      email: "language-nest-service@gen-lang-client-0347902100.iam.gserviceaccount.com",
      key: cleaned,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await auth.authorize();
    console.log("✅ Key Test SUCCESS!");
  } catch (err) {
    console.error("❌ Key Test FAILED:", err.message);
  }
}

run();
