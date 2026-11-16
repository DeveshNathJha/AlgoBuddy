import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail, recordVerifiedUser, verifyOtp } from '@/lib/userStore';
import { attachSessionCookie, isSessionConfigured } from '@/lib/session';

const MESSAGES = {
  invalid: 'Incorrect code. Please check and try again.',
  expired: 'This code has expired. Please request a new one.',
  locked: 'Too many wrong attempts. Please request a new code.',
};

/** POST /api/auth/verify-otp  { email, otp } */
export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    console.error('[Auth] SESSION_SECRET is missing or shorter than 32 characters: sign-in is disabled. Set it in Vercel > Settings > Environment Variables and redeploy.');
    return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. You can still use AlgoBuddy with your own free API key.' }, { status: 503 });
  }
  try {
    const { email, otp } = await req.json();
    if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json({ success: false, error: 'Email and 6-digit code are required.' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const result = await verifyOtp(normalized, otp);
    if (result !== 'ok') {
      return NextResponse.json({ success: false, error: MESSAGES[result] }, { status: 400 });
    }

    await recordVerifiedUser(normalized, 'otp');
    return attachSessionCookie(NextResponse.json({ success: true, user: { email: normalized } }), normalized);
  } catch (e: any) {
    console.error('[Auth] verify-otp failed:', e?.message);
    return NextResponse.json({ success: false, error: 'Could not verify the code. Please try again in a moment.' }, { status: 500 });
  }
}
