import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp, saveVerifiedUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    const isValid = verifyOtp(trimmedEmail, trimmedOtp);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification code. Please request a new code.',
        },
        { status: 400 }
      );
    }

    // Save and register verified user
    const user = saveVerifiedUser({
      email: trimmedEmail,
      authMethod: 'otp',
    });

    console.log(`[AlgoBuddy Auth] User successfully verified: ${trimmedEmail}`);

    return NextResponse.json({
      success: true,
      user,
      message: 'Email successfully verified!',
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
