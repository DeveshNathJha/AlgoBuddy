import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail, recordVerifiedUser } from '@/lib/userStore';
import { attachSessionCookie, isSessionConfigured } from '@/lib/session';

/**
 * POST /api/auth/google  { credential }
 *
 * Verifies the Google ID token with Google (signature, expiry, audience) before
 * trusting the email. The old version base64-decoded the JWT without checking the
 * signature and also accepted a raw `email` field, so anyone could sign in as anyone.
 */
export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    console.error('[Auth] SESSION_SECRET is missing or shorter than 32 characters: sign-in is disabled. Set it in Vercel > Settings > Environment Variables and redeploy.');
    return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. You can still use AlgoBuddy with your own free API key.' }, { status: 503 });
  }
  try {
    const { credential } = await req.json();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Google Sign-In is not configured.' }, { status: 501 });
    }
    if (!credential || typeof credential !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing Google credential.' }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: 'no-store' }
    );
    const payload = await verifyRes.json().catch(() => ({}));

    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!verifyRes.ok || payload.aud !== clientId || !payload.email || !emailVerified) {
      return NextResponse.json({ success: false, error: 'Google sign-in could not be verified.' }, { status: 401 });
    }

    const email = normalizeEmail(payload.email);
    await recordVerifiedUser(email, 'google', payload.name);

    return attachSessionCookie(NextResponse.json({ success: true, user: { email } }), email);
  } catch (e: any) {
    console.error('[Auth] Google sign-in failed:', e?.message);
    return NextResponse.json({ success: false, error: 'Google sign-in failed. Please try again in a moment.' }, { status: 500 });
  }
}
