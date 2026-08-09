import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BookOpen, Calendar, Phone, Mail, Loader2, AlertCircle, Sparkles, QrCode, CreditCard, Banknote, Copy, Check } from 'lucide-react';
import { registerMember, fetchConfig } from '../services/api';
import { io } from 'socket.io-client';

const BRANCH_OPTIONS = [
  'CSE', 'CSIT', 'CSD', 'AIML', 'CIC', 'AIDS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Others'
];

const YEAR_OPTIONS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year'
];

export default function RegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    branch: '',
    year: '',
    phone: '',
    email: '',
    paymentMode: 'Online',
    transactionId: '',
    paidTo: '',
    agreement: false
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Dynamic Payment & Group settings
  const [paymentConfig, setPaymentConfig] = useState({
    upiId: import.meta.env.VITE_UPI_ID || 'languagenest@upi',
    upiName: import.meta.env.VITE_UPI_NAME || 'Language Nest Club',
    whatsappGroupUrl: ''
  });

  useEffect(() => {
    fetchConfig().then(cfg => {
      if (cfg && cfg.upiId) {
        setPaymentConfig({
          upiId: cfg.upiId,
          upiName: cfg.upiName || 'Language Nest Club',
          whatsappGroupUrl: cfg.whatsappGroupUrl || ''
        });
      }
    });

    const socket = io(window.location.origin, {
      reconnectionAttempts: 5,
      timeout: 5000
    });

    socket.on('configUpdated', (updated) => {
      setPaymentConfig(prev => ({
        ...prev,
        upiId: updated.upiId || prev.upiId,
        upiName: updated.upiName || prev.upiName,
        whatsappGroupUrl: updated.whatsappGroupUrl || prev.whatsappGroupUrl
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${paymentConfig.upiId}&pn=${encodeURIComponent(paymentConfig.upiName)}&cu=INR`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(paymentConfig.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    if (!formData.branch) {
      newErrors.branch = 'Please select your engineering branch';
    }

    if (!formData.year) {
      newErrors.year = 'Please select your academic year';
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(cleanPhone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      newErrors.email = 'Email ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.paymentMode === 'Online') {
      if (!formData.transactionId.trim()) {
        newErrors.transactionId = 'Transaction ID / UTR Number is required for Online Payment';
      } else if (formData.transactionId.trim().length < 4) {
        newErrors.transactionId = 'Please enter a valid Transaction ID / UTR Number';
      }
    } else if (formData.paymentMode === 'Offline') {
      if (!formData.paidTo.trim()) {
        newErrors.paidTo = 'Please specify who you paid the registration fee to';
      }
    }

    if (!formData.agreement) {
      newErrors.agreement = 'You must agree to be contacted via WhatsApp and Email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      fullName: formData.fullName,
      branch: formData.branch,
      year: formData.year,
      phone: formData.phone,
      email: formData.email,
      paymentMode: formData.paymentMode,
      paymentDetails: formData.paymentMode === 'Online' ? formData.transactionId : formData.paidTo,
      agreement: formData.agreement
    };

    try {
      const response = await registerMember(payload);
      setIsSubmitting(false);

      if (response && response.success) {
        onSuccess({
          memberId: response.memberId,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          paymentMode: formData.paymentMode,
          whatsappGroupUrl: response.whatsappGroupUrl || paymentConfig.whatsappGroupUrl
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setApiError(err.message || 'Failed to submit registration. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Official Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        {/* Official Language Nest Logo Image */}
        <div className="mx-auto w-24 h-24 mb-4 rounded-full overflow-hidden shadow-xl shadow-brand-600/25 border-4 border-white bg-brand-900 flex items-center justify-center p-0.5">
          <img 
            src="/logo.png" 
            alt="Language Nest Official Logo" 
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
          SRKR ENGINEERING COLLEGE
        </p>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Join <span className="text-gradient">Language Nest</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
          Become a part of SRKR ENGINEERING COLLEGE's official <strong className="text-slate-800 font-bold">Literary Club</strong>.
        </p>
      </motion.div>

      {/* Glassmorphic Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-white/80 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-500 to-sky-400"></div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {apiError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="text-xs text-red-600 mt-0.5">{apiError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="e.g. Rahul Verma"
                className={`w-full pl-10 pr-4 py-3 bg-white/90 border ${
                  errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'
                } rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          {/* Branch & Year Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-8 py-3 bg-white/90 border ${
                    errors.branch ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'
                  } rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:border-transparent appearance-none transition-all`}
                >
                  <option value="">Select Branch</option>
                  {BRANCH_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
              {errors.branch && <p className="mt-1 text-xs text-red-500 font-medium">{errors.branch}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Year <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-8 py-3 bg-white/90 border ${
                    errors.year ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'
                  } rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:border-transparent appearance-none transition-all`}
                >
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
              {errors.year && <p className="mt-1 text-xs text-red-500 font-medium">{errors.year}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, phone: val }));
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                disabled={isSubmitting}
                placeholder="10-digit mobile number"
                className={`w-full pl-10 pr-4 py-3 bg-white/90 border ${
                  errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'
                } rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
          </div>

          {/* Email ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email ID <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="your.name@example.com"
                className={`w-full pl-10 pr-4 py-3 bg-white/90 border ${
                  errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'
                } rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
          </div>

          {/* PAYMENT SECTION */}
          <div className="pt-2 border-t border-slate-200/80">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Payment Mode <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'Online', transactionId: '' }))}
                className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.paymentMode === 'Online'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>Online (UPI / QR)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'Offline', paidTo: '' }))}
                className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.paymentMode === 'Offline'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Offline (Cash)</span>
              </button>
            </div>

            {/* ONLINE PAYMENT QR CODE DISPLAY */}
            {formData.paymentMode === 'Online' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3"
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <QrCode className="w-4 h-4 text-brand-600" />
                  <span>Scan QR Code to Pay</span>
                </div>

                {/* QR Code Container */}
                <div className="mx-auto w-48 h-48 bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Language Nest UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-600">{paymentConfig.upiName}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="text-slate-500">UPI ID:</span>
                    <strong className="font-mono text-slate-800">{paymentConfig.upiId}</strong>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="ml-1 text-brand-600 hover:text-brand-700 p-0.5"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Transaction ID Input */}
                <div className="pt-2 text-left">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transaction ID / UTR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="e.g. 423456789012 (12-digit UTR)"
                    className={`w-full px-3.5 py-2.5 bg-white border ${
                      errors.transactionId ? 'border-red-400' : 'border-slate-200'
                    } rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500`}
                  />
                  {errors.transactionId && <p className="mt-1 text-xs text-red-500 font-medium">{errors.transactionId}</p>}
                </div>
              </motion.div>
            )}

            {/* OFFLINE PAYMENT PAID TO INPUT */}
            {formData.paymentMode === 'Offline' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Cash Payment Details</span>
                </div>

                <label className="block text-xs font-bold text-slate-700">
                  Paid To Whom? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="paidTo"
                  value={formData.paidTo}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="e.g. Rahul (2nd Year CSE) / Desk Coordinator"
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.paidTo ? 'border-red-400' : 'border-slate-200'
                  } rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500`}
                />
                {errors.paidTo ? (
                  <p className="text-xs text-red-500 font-medium">{errors.paidTo}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Specify the name of the organizer or desk volunteer who collected your cash fee.</p>
                )}
              </motion.div>
            )}

          </div>

          {/* Checkbox Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="agreement"
                checked={formData.agreement}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 group-hover:text-slate-900 leading-snug">
                I agree that <strong>Language Nest</strong> may contact me through WhatsApp and Email for updates & event invites.
              </span>
            </label>
            {errors.agreement && <p className="mt-1 text-xs text-red-500 font-medium">{errors.agreement}</p>}
          </div>

          {/* Register Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 font-semibold text-white bg-gradient-to-r from-brand-600 via-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>

    </div>
  );
}
