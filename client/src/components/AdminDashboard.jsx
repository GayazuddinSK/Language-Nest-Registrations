import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Users, Calendar, Radio, RefreshCw, Download, Search, Filter, CreditCard, Banknote, ArrowLeft, Settings, QrCode, Save, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { verifyAdminPassword, fetchAdminRegistrations, updateAdminConfig } from '../services/api';

const BRANCH_OPTIONS = [
  'CSE', 'CSIT', 'CSD', 'AIML', 'CIC', 'AIDS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Others'
];

export default function AdminDashboard({ onBackToForm }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Dashboard Data
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Admin Config Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    upiId: '',
    upiName: '',
    whatsappGroupUrl: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');

  // Real-time socket status
  const [isConnected, setIsConnected] = useState(false);

  // 1. Password submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!password) return;

    setIsVerifying(true);
    try {
      const res = await verifyAdminPassword(password);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminToken(password);
        loadDashboardData(password);
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid admin password');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Load dashboard data from backend
  const loadDashboardData = async (token = adminToken) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchAdminRegistrations(token);
      if (data.success) {
        setRecords(data.records || []);
        setTotalCount(data.totalRegistrations || 0);
        setTodayCount(data.todayRegistrations || 0);
        setLastRefreshed(new Date().toLocaleTimeString());

        if (data.config) {
          setConfigForm({
            upiId: data.config.upiId || 'languagenest@upi',
            upiName: data.config.upiName || 'Language Nest Club',
            whatsappGroupUrl: data.config.whatsappGroupUrl || ''
          });
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Save Admin Payment Settings (UPI ID, Payee Name, WhatsApp Group URL)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setConfigSuccess('');
    setConfigError('');

    if (!configForm.upiId.trim()) {
      setConfigError('UPI ID cannot be empty');
      return;
    }

    setIsSavingConfig(true);
    try {
      const res = await updateAdminConfig(adminToken, configForm);
      if (res.success) {
        setConfigSuccess('Payment settings updated! Freshers will now see the new UPI ID & QR Code live.');
        setTimeout(() => {
          setConfigSuccess('');
          setShowSettingsModal(false);
        }, 1800);
      }
    } catch (err) {
      setConfigError(err.message || 'Failed to save settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 4. Socket.io & Polling fallback
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(window.location.origin, {
      reconnectionAttempts: 5,
      timeout: 5000
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newRegistration', (newRecord) => {
      console.log("⚡ Live new registration received:", newRecord);
      setRecords(prev => [newRecord, ...prev]);
      setTotalCount(prev => prev + 1);
      setTodayCount(prev => prev + 1);
    });

    const pollInterval = setInterval(() => {
      loadDashboardData(adminToken);
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, adminToken]);

  // 5. Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const nameMatch = !searchName || 
        rec.fullName.toLowerCase().includes(searchName.toLowerCase()) || 
        rec.phone.includes(searchName) || 
        rec.email.toLowerCase().includes(searchName.toLowerCase()) ||
        (rec.paymentDetails && rec.paymentDetails.toLowerCase().includes(searchName.toLowerCase()));

      const branchMatch = filterBranch === 'ALL' || rec.branch === filterBranch;
      const yearMatch = filterYear === 'ALL' || rec.year === filterYear;
      const paymentMatch = filterPayment === 'ALL' || rec.paymentMode === filterPayment;

      return nameMatch && branchMatch && yearMatch && paymentMatch;
    });
  }, [records, searchName, filterBranch, filterYear, filterPayment]);

  // 6. Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Member ID', 'Timestamp', 'Full Name', 'Branch', 'Year', 'Phone', 'Email', 'Payment Mode', 'Payment Details', 'Status'];
    const rows = filteredRecords.map(r => [
      r.memberId || '',
      `"${r.timestamp || ''}"`,
      `"${r.fullName || ''}"`,
      `"${r.branch || ''}"`,
      `"${r.year || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.email || ''}"`,
      `"${r.paymentMode || ''}"`,
      `"${r.paymentDetails || ''}"`,
      `"${r.status || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Language_Nest_Members_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Password Modal
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-100 text-center relative overflow-hidden"
        >
          <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Admin Portal</h2>
          <p className="text-xs text-slate-500 mb-6">Enter password to access Language Nest Dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/90 border border-slate-200 focus:ring-brand-500 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2"
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 font-medium">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-6 font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              {isVerifying ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onBackToForm}
              className="text-xs text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Registration Form
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Sync Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time Language Nest club member registration monitoring</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Modal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
            title="Update Payment QR & UPI ID"
          >
            <Settings className="w-3.5 h-3.5 text-brand-600" />
            <span>Payment & QR Settings</span>
          </button>

          <button
            onClick={() => loadDashboardData()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
            title="Refresh Table Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border border-brand-100 shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registrations</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">All-time member count in Google Sheets</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5 border border-emerald-100 shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Registration Count</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{totalCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Updates automatically via WebSockets</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 border border-blue-100 shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Registrations</p>
              <h3 className="text-3xl font-extrabold text-brand-600 mt-1">{todayCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-brand-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Registered on current date</p>
        </motion.div>

      </div>

      {/* Table Filters & Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-white mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          
          {/* Search Input */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search Name, UTR, Paid To..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Branch Filter (includes CIC, AIDS, CSBS) */}
          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Branches</option>
              {BRANCH_OPTIONS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Academic Years</option>
              {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="Online">Online (QR / UPI)</option>
              <option value="Offline">Offline (Cash)</option>
            </select>
          </div>

        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Branch / Year</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Payment Details</th>
                <th className="py-3 px-4">Registered Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800 bg-white/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No registered members matching selected search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-400">#{r.memberId || idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.fullName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium mr-1">
                        {r.branch}
                      </span>
                      <span className="text-slate-500">{r.year}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900">{r.phone}</div>
                      <div className="text-[11px] text-slate-500">{r.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.paymentMode === 'Online'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {r.paymentMode === 'Online' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        {r.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {r.paymentMode === 'Online' ? (
                        <span className="text-slate-800 font-bold">{r.paymentDetails}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">{r.paymentDetails}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{r.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.status || 'Registered'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRecords.length} of {records.length} total entries</span>
          {lastRefreshed && <span>Last sync: {lastRefreshed}</span>}
        </div>

      </div>

      {/* ADMIN PAYMENT SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment & QR Settings</h3>
                  <p className="text-xs text-slate-500">Update UPI ID, Payee Name & WhatsApp Group Link</p>
                </div>
              </div>

              {configSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{configSuccess}</span>
                </div>
              )}

              {configError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>{configError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    UPI ID (For Online QR Code)
                  </label>
                  <input
                    type="text"
                    value={configForm.upiId}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. 9876543210@ybl or languagenest@upi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Changing this automatically updates the QR code scanned by freshers!</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    UPI Payee Name
                  </label>
                  <input
                    type="text"
                    value={configForm.upiName}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, upiName: e.target.value }))}
                    placeholder="e.g. Language Nest Club / SRKR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    WhatsApp Group Invite URL
                  </label>
                  <input
                    type="url"
                    value={configForm.whatsappGroupUrl}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, whatsappGroupUrl: e.target.value }))}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingConfig ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
