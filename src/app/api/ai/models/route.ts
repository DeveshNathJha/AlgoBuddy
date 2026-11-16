import { NextRequest, NextResponse } from 'next/server';
import { PROVIDER_MODELS } from '@/lib/config';
import type { AIProvider } from '@/lib/types';

/**
 * POST /api/ai/models  { provider, key }
 * Lists the provider's live chat models for the given key, falling back to the curated list.
 */
export async function POST(req: NextRequest) {
  let provider: AIProvider = 'gemini';
  try {
    const body = await req.json();
    if (body.provider in PROVIDER_MODELS) provider = body.provider;
    const key = typeof body.key === 'string' ? body.key.trim() : '';

    if (key) {
      const live = await fetchLiveModels(provider, key);
      if (live.length > 0) return NextResponse.json({ success: true, models: live, live: true });
    }
  } catch (err) {
    console.warn('Live model fetch failed, using curated list:', err);
  }
  return NextResponse.json({ success: true, models: PROVIDER_MODELS[provider].models, live: false });
}

async function fetchLiveModels(provider: AIProvider, key: string): Promise<string[]> {
  if (provider === 'gemini') {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
      headers: { 'x-goog-api-key': key },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .filter((id: string) => id.startsWith('gemini') && !/(embedding|image|tts|audio|live|vision)/.test(id));
  }

  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/models' : 'https://api.openai.com/v1/models';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return [];
  const data = await res.json();
  const ids: string[] = (data.data || []).map((m: any) => m.id);
  return provider === 'groq'
    ? ids.filter((id) => !/(whisper|guard|safeguard|orpheus|tts|compound)/.test(id))
    : ids.filter((id) => /^(gpt-|o\d)/.test(id) && !/(audio|realtime|transcribe|tts|image|search)/.test(id));
}
