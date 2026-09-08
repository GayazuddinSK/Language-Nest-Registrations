require('dotenv').config();
const { addRegistration, getAllRegistrations } = require('./services/googleSheets');

async function test() {
  try {
    console.log("Fetching current registrations...");
    const before = await getAllRegistrations();
    console.log(`Current registrations count: ${before.length}`);

    console.log("Testing addRegistration...");
    const rec = await addRegistration({
      fullName: "Test User",
      branch: "CSE",
      year: "1st Year",
      phone: "9999888877",
      email: "test.user@srkr.ac.in",
      paymentMode: "Online",
      paymentDetails: "UTR123456789"
    });
    console.log("Registration returned:", rec);

    const after = await getAllRegistrations();
    console.log(`Registrations count after: ${after.length}`);
  } catch (e) {
    console.error("Test error:", e);
  }
}

test();
