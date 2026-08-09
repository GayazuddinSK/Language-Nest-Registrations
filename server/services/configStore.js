const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/config.json');

const defaultConfig = {
  upiId: process.env.UPI_ID || 'languagenest@upi',
  upiName: process.env.UPI_NAME || 'Language Nest Club',
  whatsappGroupUrl: process.env.WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/your-official-group-invite-link'
};

function ensureConfigFileExists() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

function getConfig() {
  ensureConfigFileExists();
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading config.json:", err.message);
    return defaultConfig;
  }
}

function updateConfig(newSettings) {
  ensureConfigFileExists();
  const current = getConfig();
  const updated = {
    ...current,
    upiId: newSettings.upiId !== undefined ? newSettings.upiId.trim() : current.upiId,
    upiName: newSettings.upiName !== undefined ? newSettings.upiName.trim() : current.upiName,
    whatsappGroupUrl: newSettings.whatsappGroupUrl !== undefined ? newSettings.whatsappGroupUrl.trim() : current.whatsappGroupUrl
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    return updated;
  } catch (err) {
    console.error("Error writing config.json:", err.message);
    throw err;
  }
}

module.exports = {
  getConfig,
  updateConfig
};
