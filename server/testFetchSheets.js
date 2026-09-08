require('dotenv').config();
const { getAllRegistrations } = require('./services/googleSheets');

async function testFetch() {
  console.log("Fetching live registrations from Google Sheet...");
  const records = await getAllRegistrations();
  console.log(`Total Records Found: ${records.length}`);
  console.log(JSON.stringify(records, null, 2));
}

testFetch();
