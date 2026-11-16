import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isSessionConfigured } from '@/lib/session';
import {
  generateAndStoreOtp,
  isDisposableEmail,
  isValidEmail,
  normalizeEmail,
  rateLimit,
} from '@/lib/userStore';

const IS_PROD = process.env.NODE_ENV === 'production';

/** POST /api/auth/send-otp  { email } */
export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    console.error('[Auth] SESSION_SECRET is missing or shorter than 32 characters: sign-in is disabled. Set it in Vercel > Settings > Environment Variables and redeploy.');
    return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable. You can still use AlgoBuddy with your own free API key.' }, { status: 503 });
  }
  try {
    const { email: rawEmail } = await req.json();
    if (typeof rawEmail !== 'string') {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
    }
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Temporary or disposable email providers are not allowed. Please use your real email.' },
        { status: 400 }
      );
    }

    // Anti-spam: 1 code per email per minute, 20 codes per IP per hour.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const emailOk = await rateLimit(`send-otp:email:${email}`, 1, 60);
    const ipOk = await rateLimit(`send-otp:ip:${ip}`, 20, 3600);
    if (!emailOk || !ipOk) {
      return NextResponse.json(
        { success: false, error: 'Too many code requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const code = await generateAndStoreOtp(email);

    if (!process.env.RESEND_API_KEY) {
      if (IS_PROD) {
        // Never hand the code to the browser in production: that makes verification meaningless.
        return NextResponse.json(
          { success: false, error: 'Email sign-in is temporarily unavailable. Please use Google Sign-In.' },
          { status: 503 }
        );
      }
      console.log(`[AlgoBuddy Auth][dev] OTP for ${email}: ${code}`);
      return NextResponse.json({ success: true, emailDelivered: false, devOtp: code });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      // NOTE: onboarding@resend.dev can only deliver to the Resend account owner.
      // Verify your own domain in Resend and set RESEND_FROM, e.g. "AlgoBuddy <login@yourdomain.com>".
      from: process.env.RESEND_FROM || 'AlgoBuddy <onboarding@resend.dev>',
      to: email,
      subject: `${code} is your AlgoBuddy verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">AlgoBuddy verification</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">Use this code to sign in to AlgoBuddy:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b; margin: 20px 0;">${code}</div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>`,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json(
        { success: false, error: 'Could not send the verification email. Please try again or use Google Sign-In.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, emailDelivered: true });
  } catch (e: any) {
    console.error('[Auth] send-otp failed:', e?.message);
    return NextResponse.json({ success: false, error: 'Failed to send verification code.' }, { status: 500 });
  }
}
