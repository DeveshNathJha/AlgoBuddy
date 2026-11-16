'use client';

import React from 'react';
import { X, ShieldCheck, Mail, LogOut } from 'lucide-react';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onLogin: (email: string) => void;
  onLogout: () => void;
}

export default function GmailAuthModal({
  isOpen,
  onClose,
  userEmail,
  onLogin,
  onLogout,
}: GmailAuthModalProps) {
  if (!isOpen) return null;

  const handleSimulateGoogleLogin = () => {
    const email = window.prompt('Enter your Google Account email:', 'engineer@domain.com');
    if (email && email.includes('@')) {
      onLogin(email);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">AlgoBuddy Account Access</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to track problem history and access your complimentary starter quota.
          </p>
        </div>

        {userEmail ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Authenticated user</p>
                <p className="text-xs font-semibold text-emerald-400 font-mono">{userEmail}</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/50 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleSimulateGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-white hover:bg-slate-100 text-slate-900 shadow-sm transition flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Fair Usage Verification
              </p>
              <p>Each authenticated account receives 1 starter query. Subsequent requests require your own free API key (Gemini / Groq).</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
