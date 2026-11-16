/**
 * Shared handler for every /api/ai/* route (server only).
 *
 * - User brought their own key  -> call the provider with it, no quota.
 * - No user key                 -> requires a verified session cookie and spends
 *                                  one free request from the server-side quota.
 *
 * Previously each route duplicated its error handling, and none of them checked
 * auth or quota, so the free limit only existed in the browser's localStorage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionEmail } from './session';
import { getQuotaUsed, rateLimit, refundFreeRequest, reserveFreeRequest } from './userStore';
import { FREE_AI_REQUEST_LIMIT } from './config';
import type { AIProvider } from './types';
import { GENERIC_ERROR, toUserMessage } from './errors';

export interface AIRequestContext {
  body: any;
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  language: string;
}

const PROVIDERS: AIProvider[] = ['gemini', 'groq', 'openai'];

function hasServerKey(provider: AIProvider): boolean {
  if (provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  if (provider === 'groq') return Boolean(process.env.GROQ_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

function errorJson(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

interface HandlerOptions {
  /**
   * false = does not spend a free request (used for the cheap problem lookup),
   * but is still sign-in gated and rate limited on the server key.
   */
  charge?: boolean;
}

export function handleAIRequest<T>(run: (ctx: AIRequestContext) => Promise<T>, { charge = true }: HandlerOptions = {}) {
  async function handle(req: NextRequest) {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorJson('Invalid JSON body.', 400);
    }

    const provider: AIProvider = PROVIDERS.includes(body.provider) ? body.provider : 'gemini';
    const userApiKey = typeof body.userApiKey === 'string' && body.userApiKey.trim() ? body.userApiKey.trim() : undefined;
    const ctx: AIRequestContext = {
      body,
      provider,
      apiKey: userApiKey,
      model: typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined,
      language: typeof body.language === 'string' ? body.language : 'python',
    };

    // Bring-your-own-key: unlimited, nothing to track.
    if (userApiKey) {
      try {
        return NextResponse.json({ success: true, data: await run(ctx) });
      } catch (err: any) {
        console.error('[AI route] BYOK request failed:', err?.message);
        return errorJson(toUserMessage(err), 502);
      }
    }

    // Free tier on the server's key. The student doesn't care which provider the
    // owner configured (e.g. only GROQ_API_KEY), so fall back to any provider that has a key.
    if (!hasServerKey(provider)) {
      const fallback = PROVIDERS.find(hasServerKey);
      if (!fallback) {
        return errorJson('Free requests are not available right now. Add your own free API key in Settings.', 402, { requiresKey: true });
      }
      ctx.provider = fallback;
      ctx.model = undefined; // the client's model belongs to the other provider; use the fallback's default
    }

    let email: string | null;
    try {
      email = await getSessionEmail();
    } catch (err: any) {
      console.error('[AI route] Session config error:', err?.message);
      return errorJson('Server sign-in is not configured. Please add your own API key.', 500, { requiresKey: true });
    }
    if (!email) {
      return errorJson('Please sign in to use your free requests.', 401, { requiresAuth: true });
    }

    if (!charge) {
      if (!(await rateLimit(`uncharged:${email}`, 30, 3600))) {
        return errorJson('Too many lookups. Please wait a few minutes or paste the full problem statement.', 429);
      }
      try {
        return NextResponse.json({ success: true, data: await run(ctx), quota: { used: await getQuotaUsed(email), limit: FREE_AI_REQUEST_LIMIT } });
      } catch (err: any) {
        console.error('[AI route] Uncharged request failed:', err?.message);
        return errorJson(toUserMessage(err), 502);
      }
    }

    const used = await reserveFreeRequest(email);
    if (used === null) {
      return errorJson(
        `You have used all ${FREE_AI_REQUEST_LIMIT} free AI requests. Add your own free API key in Settings to keep going.`,
        402,
        { requiresKey: true, quota: { used: FREE_AI_REQUEST_LIMIT, limit: FREE_AI_REQUEST_LIMIT } }
      );
    }

    try {
      const data = await run(ctx);
      return NextResponse.json({ success: true, data, quota: { used, limit: FREE_AI_REQUEST_LIMIT } });
    } catch (err: any) {
      // Don't charge the user for a failed generation.
      await refundFreeRequest(email);
      console.error('[AI route] Free-tier request failed:', err?.message);
      return errorJson(toUserMessage(err), 502, {
        quota: { used: await getQuotaUsed(email), limit: FREE_AI_REQUEST_LIMIT },
      });
    }
  }

  return async function POST(req: NextRequest) {
    try {
      return await handle(req);
    } catch (err: any) {
      // e.g. the quota store is unreachable. Log details, show a plain message.
      console.error('[AI route] Unexpected failure:', err?.stack || err);
      return errorJson(GENERIC_ERROR, 500);
    }
  };
}
