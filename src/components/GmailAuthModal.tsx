'use client';

import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import Modal from './Modal';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onLogin: (email: string) => void;
  onLogout: () => void;
  freeLimit: number;
}

const HAS_GOOGLE = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const NETWORK_ERROR = 'Could not reach AlgoBuddy. Check your internet connection and try again.';

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json().catch(() => ({ success: false, error: 'AlgoBuddy had a problem on its side. Please try again in a moment.' }));
}

export default function GmailAuthModal({ isOpen, onClose, userEmail, onLogin, onLogout, freeLimit }: GmailAuthModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const reset = () => {
    setOtpSent(false);
    setOtp('');
    setDevOtp(null);
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.includes('@')) return toast.error('Enter a valid email address.');
    setBusy(true);
    try {
      const data = await postJson('/api/auth/send-otp', { email });
      if (!data.success) return toast.error(data.error || 'Could not send the code.');
      setOtpSent(true);
      setCountdown(60);
      setDevOtp(data.devOtp || null);
      if (data.devOtp) setOtp(data.devOtp);
      toast.success(data.emailDelivered ? `Code sent to ${email}. Check your inbox and spam folder.` : 'Development mode: the code is filled in for you.');
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(otp)) return toast.error('Enter the 6-digit code.');
    setBusy(true);
    try {
      const data = await postJson('/api/auth/verify-otp', { email, otp });
      if (!data.success) return toast.error(data.error || 'Incorrect code.');
      onLogin(data.user.email);
      reset();
      onClose();
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const googleSuccess = async (cred: { credential?: string }) => {
    if (!cred.credential) return toast.error('Google did not return a credential.');
    setBusy(true);
    try {
      const data = await postJson('/api/auth/google', { credential: cred.credential });
      if (!data.success) return toast.error(data.error || 'Google sign-in failed.');
      onLogin(data.user.email);
      onClose();
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  if (userEmail) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Your account"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                onLogout();
                reset();
                onClose();
              }}
              className="btn-ghost text-danger"
            >
              Sign out
            </button>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Signed in as</p>
        <p className="font-medium text-fg break-all">{userEmail}</p>
        <p className="text-sm text-fg-subtle mt-3">Your free AI requests are counted on this account.</p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in" subtitle={`Get ${freeLimit} free AI requests. No API key needed.`} size="md">
      <div className="space-y-5 text-sm">
        {HAS_GOOGLE && (
          <>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={googleSuccess} onError={() => toast.error('Google sign-in was cancelled or failed.')} text="continue_with" shape="rectangular" width={300} />
            </div>
            <div className="flex items-center gap-3 text-xs text-fg-subtle">
              <span className="flex-1 h-px bg-border" /> or use an email code <span className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        {!otpSent ? (
          <form onSubmit={sendOtp} className="space-y-3">
            <label className="block">
              <span className="block font-medium text-fg mb-1">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required className="input" autoComplete="email" />
            </label>
            <button type="submit" disabled={busy || !email} className="btn-primary w-full py-2">
              {busy ? 'Sending...' : 'Send me a 6-digit code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <p className="text-fg-muted">
              Code sent to <span className="font-medium text-fg">{email}</span>.{' '}
              <button type="button" onClick={reset} className="text-accent-text hover:underline">
                Change
              </button>
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="input text-center text-lg font-mono tracking-[0.4em]"
              aria-label="6-digit code"
              autoComplete="one-time-code"
            />
            {devOtp && <p className="text-xs text-fg-subtle">Development mode (no email service configured): the code was filled in automatically.</p>}
            <button type="submit" disabled={busy || otp.length !== 6} className="btn-primary w-full py-2">
              {busy ? 'Checking...' : 'Sign in'}
            </button>
            <button type="button" onClick={() => sendOtp()} disabled={countdown > 0 || busy} className="btn-ghost w-full">
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </button>
          </form>
        )}

        <p className="text-xs text-fg-subtle">Each account gets {freeLimit} free AI requests. Disposable email addresses are not accepted.</p>
      </div>
    </Modal>
  );
}
