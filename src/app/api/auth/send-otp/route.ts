import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreOtp, isDisposableEmail } from '@/lib/userStore';
import { Resend } from 'resend';

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

    let emailDelivered = false;

    // Send real email if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: 'AlgoBuddy <onboarding@resend.dev>',
          to: trimmed,
          subject: `${code} is your AlgoBuddy verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0;">⚡ AlgoBuddy Verification</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.5;">Welcome to AlgoBuddy! Use the verification code below to verify your email address:</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });

        if (error) {
          console.error('[Resend Error]', error);
        } else {
          emailDelivered = true;
        }
      } catch (sendErr) {
        console.error('[Resend Send Exception]', sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailDelivered
        ? `Verification code delivered to ${trimmed}`
        : `Verification code generated for ${trimmed}`,
      // Return code for instant preview if no SMTP service is configured yet
      devOtp: !emailDelivered ? code : undefined,
      emailDelivered,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to generate verification code.' },
      { status: 500 }
    );
  }
}
