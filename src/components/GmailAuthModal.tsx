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
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
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
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const [authMethod, setAuthMethod] = useState<'google' | 'otp'>(
    hasGoogleClientId ? 'google' : 'otp'
  );

  // OTP State
  const [emailInput, setEmailInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isEmailDelivered, setIsEmailDelivered] = useState<boolean>(false);
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
        setIsEmailDelivered(Boolean(data.emailDelivered));
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
          // Auto-fill test code for convenience
          setOtpInput(data.devOtp);
        }

        if (data.emailDelivered) {
          toast.success(`Verification code sent to ${emailInput}! Check your inbox.`);
        } else {
          toast.info(`Verification code ready: ${data.devOtp || 'Check screen'}`);
        }
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

  // 3. Official Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('Google credential not received.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (data.success) {
        onLogin(data.user.email);
        toast.success(`Verified as ${data.user.email}`);
        onClose();
      } else {
        toast.error(data.error || 'Google verification failed on server.');
      }
    } catch (err: any) {
      toast.error('Authentication error: ' + err.message);
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
            Sign in with a verified account to access your complimentary starter quota.
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
                Your notes, API settings, and question history are synced to this account.
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
                onClick={() => setAuthMethod('google')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  authMethod === 'google'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Sign-In
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('otp')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  authMethod === 'otp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* TAB 1: Real Official Google Sign-In */}
            {authMethod === 'google' && (
              <div className="space-y-3 pt-1">
                {hasGoogleClientId ? (
                  <div className="flex flex-col items-center justify-center pt-2">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google Sign-In was cancelled or failed.')}
                      useOneTap
                      theme="filled_black"
                      shape="rectangular"
                      text="continue_with"
                      width="100%"
                    />
                    <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                      Google verifies your identity automatically. No manual passwords or typing.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 font-semibold text-[12px]">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Setup 1-Click Google OAuth in 2 Minutes</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      To enable official Google Sign-In with real popups (preventing fake emails), add your free Google Client ID in Vercel:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center gap-0.5">Google Cloud Credentials <ExternalLink className="w-2.5 h-2.5" /></a></li>
                      <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
                      <li>Add Origin: <code className="bg-slate-900 px-1 rounded text-[10px]">https://algo-buddy-gray.vercel.app</code></li>
                      <li>Add <code className="bg-slate-900 px-1 rounded text-[10px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in Vercel Environment Variables</li>
                    </ol>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setAuthMethod('otp')}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5"
                      >
                        <span>Continue with Email OTP instead</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Email OTP Verification */}
            {authMethod === 'otp' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Your Real Email Address
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
                        Disposable temporary email providers are automatically rejected.
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
                        Enter 6-Digit Verification Code
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
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-[11px] text-emerald-300 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Verification Code: <strong className="font-mono text-xs">{devOtpHint}</strong></span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Ready</span>
                        </div>
                        {!isEmailDelivered && (
                          <p className="text-[10px] text-slate-400">
                            Tip: To deliver actual emails to user inboxes, add <code className="text-emerald-400">RESEND_API_KEY</code> in Vercel.
                          </p>
                        )}
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

            {/* Anti-Abuse Trust Note */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-3">
              <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Anti-Abuse Verification
              </p>
              <p>
                Each verified account receives 2 complimentary questions. Fake or disposable accounts are blocked.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
