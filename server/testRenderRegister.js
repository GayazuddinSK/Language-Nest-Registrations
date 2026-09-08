const https = require('https');

const postData = JSON.stringify({
  fullName: "Vercel Live Student",
  branch: "ECE",
  year: "2nd Year",
  phone: "9123412345",
  email: "vercellive@srkr.ac.in",
  paymentMode: "Offline",
  paymentDetails: "Revanth",
  agreement: true
});

const options = {
  hostname: 'language-nest-backend.onrender.com',
  port: 443,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log("Sending POST request to Render backend /api/register...");
const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response Data:", data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
