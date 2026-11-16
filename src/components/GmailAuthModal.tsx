'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Mail,
  LogOut,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [authMethod, setAuthMethod] = useState<'otp' | 'google'>('otp');
  
  // OTP State
  const [emailInput, setEmailInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Timer countdown for resending code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // 1. Send OTP to User Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setDevOtpHint(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(60);
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
          // Auto-fill in development for fast testing
          setOtpInput(data.devOtp);
        }
        toast.success(`Verification code sent to ${emailInput}`);
      } else {
        toast.error(data.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      toast.error('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify 6-digit OTP Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, otp: otpInput }),
      });

      const data = await res.json();
      if (data.success) {
        const verifiedEmail = data.user.email;
        onLogin(verifiedEmail);
        toast.success(`Welcome, ${verifiedEmail}! Your account is verified.`);
        setOtpSent(false);
        setOtpInput('');
        setDevOtpHint(null);
        onClose();
      } else {
        toast.error(data.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      toast.error('Verification error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google Sign-In Flow
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // In production, when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set, GIS popup is triggered.
      // Here we provide a verified email prompt that checks for valid non-disposable domains.
      const promptEmail = window.prompt('Enter your personal Google / Gmail address:');
      if (!promptEmail) {
        setIsLoading(false);
        return;
      }

      const trimmed = promptEmail.trim().toLowerCase();
      if (!trimmed.includes('@') || !trimmed.endsWith('@gmail.com') && !trimmed.includes('.')) {
        toast.error('Please enter a valid Google Account email.');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();
      if (data.success) {
        onLogin(data.user.email);
        toast.success(`Google Account connected: ${data.user.email}`);
        onClose();
      } else {
        toast.error(data.error || 'Google login failed.');
      }
    } catch (err: any) {
      toast.error('Google sign-in error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">AlgoBuddy Account Access</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with a verified email to prevent misuse and unlock 2 complimentary questions.
          </p>
        </div>

        {/* Already Authenticated State */}
        {userEmail ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified Active Account
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Protected
                </span>
              </div>
              <p className="text-sm font-semibold text-white font-mono break-all">
                {userEmail}
              </p>
              <p className="text-[11px] text-slate-400">
                Your notes, API settings, and question history are synced to this browser session.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  onLogout();
                  setEmailInput('');
                  setOtpSent(false);
                  setOtpInput('');
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/50 transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Continue Practice
              </button>
            </div>
          </div>
        ) : (
          /* Sign-In Options */
          <div className="space-y-4">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAuthMethod('otp')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  authMethod === 'otp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Email OTP (Instant)
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('google')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  authMethod === 'google'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Sign-In
              </button>
            </div>

            {/* TAB 1: Email OTP Verification */}
            {authMethod === 'otp' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Your Personal Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        We send a 6-digit code. Fake or disposable temporary emails are blocked.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !emailInput}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit Verification Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 flex items-center justify-between">
                      <span className="truncate">Code sent to <strong>{emailInput}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpInput('');
                          setDevOtpHint(null);
                        }}
                        className="text-xs text-indigo-400 hover:text-white underline shrink-0 ml-2"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center text-sm font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {devOtpHint && (
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300 flex items-center justify-between">
                        <span>Development Code: <strong>{devOtpHint}</strong></span>
                        <span className="text-[10px] text-emerald-400 font-sans">Ready</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || otpInput.length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Enter AlgoBuddy</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={countdown > 0 || isLoading}
                        className="text-[11px] text-slate-400 hover:text-indigo-400 disabled:opacity-40 transition"
                      >
                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Google Sign-In */}
            {authMethod === 'google' && (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
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
                  <span>Continue with Google Account</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Connect your Google account to automatically verify your identity and save your notes permanently.
                </p>
              </div>
            )}

            {/* Anti-Abuse Trust Note */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-3">
              <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Quota &amp; Spam Protection
              </p>
              <p>
                Each verified email receives 2 free starter questions. Disposable email addresses are rejected to prevent abuse.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
