import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail, recordVerifiedUser, verifyOtp } from '@/lib/userStore';
import { attachSessionCookie } from '@/lib/session';

const MESSAGES = {
  invalid: 'Incorrect code. Please check and try again.',
  expired: 'This code has expired. Please request a new one.',
  locked: 'Too many wrong attempts. Please request a new code.',
};

/** POST /api/auth/verify-otp  { email, otp } */
export async function POST(req: NextRequest) {
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
    return NextResponse.json({ success: false, error: 'Verification failed.' }, { status: 500 });
  }
}
