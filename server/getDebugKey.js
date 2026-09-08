const https = require('https');

https.get('https://language-nest-backend.onrender.com/api/debug-key', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Diagnostic Data from Render:");
    console.log(data);
  });
});
