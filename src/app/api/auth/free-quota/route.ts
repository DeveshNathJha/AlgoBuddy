import { NextRequest, NextResponse } from 'next/server';

/**
 * Free Question Quota Tracker
 * 
 * Flow:
 * 1. User pehla question master key se run kar sakta hai (1 free question).
 * 2. Uske baad user ko apna free Gemini API key enter karna padega.
 * 
 * Production note:
 * Isme aap Supabase ya Firebase Auth se user ka Gmail ID match karke
 * database me `has_used_free_credit: boolean` flag check kar sakte hain.
 */
export async function GET(req: NextRequest) {
  const masterKeyAvailable = !!process.env.MASTER_GEMINI_API_KEY;
  return NextResponse.json({
    masterKeyAvailable,
    message: masterKeyAvailable
      ? '1 Free question available via server master key!'
      : 'BYOK (Bring Your Own Key) mode active.'
  });
}

