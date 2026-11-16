import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/models
 * Securely queries active models from provider via POST body (no query string key exposure).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body.provider || 'gemini';
    const apiKey = body.key;

    if (provider === 'groq' && apiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter for active text generation/chat models
          const chatModels = (data.data || [])
            .map((m: any) => m.id)
            .filter((id: string) => 
              !id.includes('whisper') && 
              !id.includes('guard') && 
              !id.includes('safeguard') &&
              !id.includes('orpheus')
            );

          if (chatModels.length > 0) {
            return NextResponse.json({ success: true, models: chatModels });
          }
        }
      } catch (err) {
        console.warn('Dynamic Groq model fetch failed, falling back to verified list:', err);
      }
    }

    // Curated active production models
    const FALLBACK_MODELS: Record<string, string[]> = {
      gemini: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
      groq: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'],
      openai: ['gpt-4o-mini', 'gpt-4o'],
    };

    return NextResponse.json({
      success: true,
      models: FALLBACK_MODELS[provider] || ['gemini-1.5-flash'],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
