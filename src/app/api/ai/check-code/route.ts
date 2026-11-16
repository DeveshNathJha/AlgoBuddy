import { NextRequest, NextResponse } from 'next/server';
import { checkAndFixCode } from '@/lib/aiClient';

/**
 * POST /api/ai/check-code
 * Accepts: { problemText, code, errorOutput, provider, userApiKey, model, language }
 * Performs static algorithmic inspection, runtime error diagnosis, and returns verified fix.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemText, code, errorOutput, provider, userApiKey, model, language } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Code is required to perform inspection.' },
        { status: 400 }
      );
    }

    const data = await checkAndFixCode(
      problemText || 'General DSA Problem',
      code,
      errorOutput,
      {
        provider,
        apiKey: userApiKey,
        model,
        language,
      }
    );

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in check-code API:', err);
    const message = err.message || 'Failed to inspect and fix code.';
    const requiresKey =
      message.toLowerCase().includes('api key not found') ||
      message.includes('API key not found');

    return NextResponse.json(
      { error: message, requiresKey },
      { status: 500 }
    );
  }
}
