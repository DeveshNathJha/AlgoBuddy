import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewScript } from '@/lib/aiClient';

/**
 * POST /api/ai/interview-script
 * Accepts: { problemText, codeSnippet (optional), provider, userApiKey, model }
 * Allows candidates to generate full interview presentation script with question only!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemText, codeSnippet, provider, userApiKey, model, language } = body;

    if (!problemText || typeof problemText !== 'string' || problemText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Problem description is required to generate the interview script.' },
        { status: 400 }
      );
    }

    const data = await generateInterviewScript(problemText, codeSnippet || '', {
      provider,
      apiKey: userApiKey,
      model,
      language,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in interview-script API:', err);
    const message = err.message || 'Failed to generate interview script.';
    const requiresKey = message.toLowerCase().includes('api key not found') || message.includes('API key not found');

    return NextResponse.json(
      { error: message, requiresKey },
      { status: 500 }
    );
  }
}
