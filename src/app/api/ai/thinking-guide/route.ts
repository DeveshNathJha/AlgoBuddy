import { generateThinkingGuide } from '@/lib/aiClient';
import { handleAIRequest } from '@/lib/aiRoute';
import { UserError } from '@/lib/errors';

// Long structured generations can exceed Vercel's default function timeout.
export const maxDuration = 60;

/** POST /api/ai/thinking-guide  { problemText, codeSnippet?, provider, userApiKey?, model?, language } */
export const POST = handleAIRequest(async ({ body, provider, apiKey, model, language }) => {
  if (typeof body.problemText !== 'string' || !body.problemText.trim()) {
    throw new UserError('Enter a problem first.');
  }
  return generateThinkingGuide(body.problemText, body.codeSnippet, { provider, apiKey, model, language });
});
