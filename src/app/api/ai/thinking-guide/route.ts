import { NextRequest, NextResponse } from 'next/server';
import { generateThinkingGuide } from '@/lib/aiClient';

/**
 * POST /api/ai/thinking-guide
 * Accepts: { problemText, codeSnippet, provider, userApiKey, model }
 * Returns structured algorithmic breakdown and progressive hints
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemText, codeSnippet, provider, userApiKey, model, language } = body;

    if (!problemText || typeof problemText !== 'string' || problemText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Problem description is required.' },
        { status: 400 }
      );
    }

    const data = await generateThinkingGuide(problemText, codeSnippet, {
      provider,
      apiKey: userApiKey,
      model,
      language,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in thinking-guide API:', err);
    const message = err.message || 'Failed to generate thinking guide.';
    const requiresKey = message.toLowerCase().includes('api key not found') || message.includes('API key not found');

    return NextResponse.json(
      { error: message, requiresKey },
      { status: 500 }
    );
  }
}
