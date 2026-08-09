require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { initializeSheetHeaders, getAllRegistrations, addRegistration } = require('./services/googleSheets');
const { getConfig, updateConfig } = require('./services/configStore');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'languagenest2026';

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL || '*'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.io: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Helper validation functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

// Updated Allowed Branches including CIC, AIDS, CSBS
const ALLOWED_BRANCHES = [
  'CSE', 'CSIT', 'CSD', 'AIML', 'CIC', 'AIDS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Others'
];

const ALLOWED_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Public config endpoint for UPI & WhatsApp details
 */
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    success: true,
    upiId: config.upiId,
    upiName: config.upiName,
    whatsappGroupUrl: config.whatsappGroupUrl
  });
});

/**
 * Public stats endpoint
 */
app.get('/api/stats', async (req, res) => {
  try {
    const records = await getAllRegistrations();
    const config = getConfig();
    res.json({
      success: true,
      totalRegistrations: records.length,
      whatsappGroupUrl: config.whatsappGroupUrl,
      upiId: config.upiId,
      upiName: config.upiName
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch registration statistics." });
  }
});

/**
 * Admin Update Config Endpoint (UPI ID, Payee Name, WhatsApp Group URL)
 */
app.post('/api/admin/config', (req, res) => {
  const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
  if (authHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Unauthorized. Valid Admin Password required." });
  }

  const { upiId, upiName, whatsappGroupUrl } = req.body;

  try {
    const updated = updateConfig({ upiId, upiName, whatsappGroupUrl });

    // Broadcast updated config to all connected clients
    io.emit('configUpdated', updated);

    return res.json({
      success: true,
      message: "Payment settings updated successfully!",
      config: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update configuration settings." });
  }
});

/**
 * Registration endpoint with Payment validation
 */
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, branch, year, phone, email, paymentMode, paymentDetails, agreement } = req.body;

    // 1. Validation checks
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Please provide a valid Full Name (at least 2 characters)." });
    }

    if (!branch || !ALLOWED_BRANCHES.includes(branch.trim())) {
      return res.status(400).json({ success: false, message: "Please select a valid engineering Branch." });
    }

    if (!year || !ALLOWED_YEARS.includes(year.trim())) {
      return res.status(400).json({ success: false, message: "Please select a valid academic Year." });
    }

    if (!phone || !isValidPhone(phone.trim())) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
    }

    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid Email ID." });
    }

    // Payment Mode Validation
    if (!paymentMode || (paymentMode !== 'Online' && paymentMode !== 'Offline')) {
      return res.status(400).json({ success: false, message: "Please select a payment mode (Online or Offline)." });
    }

    if (paymentMode === 'Online') {
      if (!paymentDetails || typeof paymentDetails !== 'string' || paymentDetails.trim().length < 4) {
        return res.status(400).json({ success: false, message: "Please enter a valid UTR / Payment Transaction ID." });
      }
    } else if (paymentMode === 'Offline') {
      if (!paymentDetails || typeof paymentDetails !== 'string' || paymentDetails.trim().length < 2) {
        return res.status(400).json({ success: false, message: "Please specify who you paid the registration fee to." });
      }
    }

    if (agreement !== true && agreement !== 'true') {
      return res.status(400).json({ success: false, message: "You must agree to be contacted via WhatsApp and Email." });
    }

    // 2. Append registration to Google Sheet / local storage
    const newRecord = await addRegistration({
      fullName,
      branch,
      year,
      phone,
      email,
      paymentMode,
      paymentDetails
    });

    // 3. Emit live update event via Socket.io to connected Admin Dashboard
    io.emit('newRegistration', newRecord);

    const config = getConfig();

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      memberId: newRecord.memberId,
      registration: newRecord,
      whatsappGroupUrl: config.whatsappGroupUrl
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "An error occurred while processing your registration. Please try again."
    });
  }
});

/**
 * Admin Verification Endpoint
 */
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_PASSWORD });
  }
  return res.status(401).json({ success: false, message: "Invalid admin password." });
});

/**
 * Admin Dashboard - Fetch All Registrations & Dashboard Metrics
 */
app.get('/api/registrations', async (req, res) => {
  const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
  if (authHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Unauthorized. Valid Admin Password required." });
  }

  try {
    const records = await getAllRegistrations();
    const config = getConfig();
    
    // Calculate Today's Registrations
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayRegistrations = records.filter(r => r.timestamp && r.timestamp.startsWith(todayStr)).length;

    return res.json({
      success: true,
      totalRegistrations: records.length,
      todayRegistrations: todayRegistrations,
      records: records.reverse(),
      config: config
    });
  } catch (error) {
    console.error("Error fetching registrations for admin:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch registrations." });
  }
});

// Start Server & Initialize Sheet
server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Language Nest Backend Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
  await initializeSheetHeaders();
});
