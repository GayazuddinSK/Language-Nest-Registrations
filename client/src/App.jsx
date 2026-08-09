import React, { useState } from 'react';
import Navbar from './components/Navbar';
import RegistrationForm from './components/RegistrationForm';
import SuccessModal from './components/SuccessModal';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentTab, setCurrentTab] = useState('register'); // 'register' | 'admin'
  const [submittedMember, setSubmittedMember] = useState(null);

  const handleSuccess = (memberData) => {
    setSubmittedMember(memberData);
  };

  const handleReset = () => {
    setSubmittedMember(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative bg-grid-pattern overflow-hidden">
      
      {/* Ambient Glowing Backdrop Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[15%] w-[450px] h-[450px] rounded-full bg-sky-400/10 blur-[100px] pointer-events-none"></div>

      {/* Top Sticky Navigation Bar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Body Container */}
      <main className="flex-grow flex items-center justify-center relative z-10 py-6">
        {currentTab === 'admin' ? (
          <AdminDashboard onBackToForm={() => setCurrentTab('register')} />
        ) : submittedMember ? (
          <SuccessModal memberData={submittedMember} onReset={handleReset} />
        ) : (
          <RegistrationForm onSuccess={handleSuccess} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-200/80 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} <strong className="text-slate-800">Language Nest</strong> • SRKR ENGINEERING COLLEGE
          </p>
          <p className="text-[11px] font-semibold text-brand-600 mt-1">
            Literary Club
          </p>
        </div>
      </footer>

    </div>
  );
}
