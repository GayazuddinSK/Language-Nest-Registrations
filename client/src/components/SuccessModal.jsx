import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ArrowRight, Award, ExternalLink, CreditCard, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SuccessModal({ memberData, onReset }) {
  const defaultWhatsappUrl = import.meta.env.VITE_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/your-official-group-invite-link';
  const whatsappUrl = memberData?.whatsappGroupUrl || defaultWhatsappUrl;

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b']
      });
    } catch (e) {
      console.warn("Confetti effect unavailable:", e);
    }
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-emerald-100/60 text-center relative overflow-hidden"
      >
        {/* Top Green Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

        {/* Animated Green Checkmark */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="mx-auto w-24 h-24 mb-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-4 border-white"
        >
          <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
        </motion.div>

        {/* Member ID Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-bold shadow-sm"
        >
          <Award className="w-4 h-4 text-brand-600" />
          <span>You are Member #{memberData?.memberId || 'LN-2026'}</span>
        </motion.div>

        {/* Success Titles */}
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2"
        >
          Thank you for joining <br />
          <span className="text-gradient">Language Nest</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed"
        >
          Your registration and payment status have been recorded.
        </motion.p>

        {/* Payment Confirmation Tag */}
        {memberData?.paymentMode && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
          >
            {memberData.paymentMode === 'Online' ? <CreditCard className="w-3.5 h-3.5 text-brand-600" /> : <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Payment Mode: <strong>{memberData.paymentMode}</strong></span>
          </motion.div>
        )}

        {/* WhatsApp Group Invite Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 shadow-md mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
            <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span>Join Language Nest WhatsApp Group</span>
          </div>

          <p className="text-xs text-emerald-700 mb-4 leading-snug">
            Click below to join our official student community group directly on WhatsApp:
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base group"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Join Official WhatsApp Group</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={onReset}
          className="w-full py-3 px-6 font-medium text-slate-600 hover:text-brand-600 bg-slate-100/80 hover:bg-brand-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
        >
          <span>Register Another Student</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>

      </motion.div>
    </div>
  );
}
