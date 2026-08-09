const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch total registration count and public config
 */
export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API fetchStats error:", err);
    return { success: false, totalRegistrations: 0 };
  }
}

/**
 * Fetch public payment and group config
 */
export async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API fetchConfig error:", err);
    return { success: false };
  }
}

/**
 * Submit member registration form
 */
export async function registerMember(formData) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed. Please try again.');
  }
  return data;
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password) {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid admin password');
  }
  return data;
}

/**
 * Fetch all registration data for admin dashboard
 */
export async function fetchAdminRegistrations(adminPassword) {
  const res = await fetch(`${API_BASE}/registrations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load registrations');
  }
  return data;
}

/**
 * Update payment QR, UPI ID, and WhatsApp Link configuration (Admin only)
 */
export async function updateAdminConfig(adminPassword, newConfig) {
  const res = await fetch(`${API_BASE}/admin/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    },
    body: JSON.stringify(newConfig),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update settings');
  }
  return data;
}
