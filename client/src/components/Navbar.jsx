import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-blue-100/60 shadow-sm backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Official Logo & Branding */}
        <div 
          onClick={() => setCurrentTab('register')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform duration-300 bg-brand-900 border-2 border-white">
            <img 
              src="/logo.png" 
              alt="Language Nest Official Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                Language Nest
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-brand-50 text-brand-700 border border-brand-200 rounded-full">
                SRKR ENGINEERING COLLEGE
              </span>
            </div>
            <p className="text-xs font-semibold text-brand-600 tracking-wide">Literary Club</p>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-3">
          {currentTab === 'register' ? (
            <button
              onClick={() => setCurrentTab('admin')}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-600 bg-white/80 hover:bg-brand-50/80 border border-slate-200 hover:border-brand-200 rounded-xl transition-all shadow-sm"
              title="Admin Portal Access"
            >
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Admin Portal</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab('register')}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 rounded-xl shadow-md hover:shadow-brand-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Registration Form</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
