import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreOtp, isDisposableEmail } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();

    // Check basic email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    // Block throwaway / temporary spam email services
    if (isDisposableEmail(trimmed)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Temporary or disposable email providers are not permitted. Please use your real personal email.',
        },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = generateAndStoreOtp(trimmed);

    console.log(`[AlgoBuddy Auth] Verification OTP for ${trimmed}: ${code}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${trimmed}`,
      // devOtp helps local/staging verification without external SMTP server
      devOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to generate verification code.' },
      { status: 500 }
    );
  }
}
