import { checkAndFixCode } from '@/lib/aiClient';
import { handleAIRequest } from '@/lib/aiRoute';
import { UserError } from '@/lib/errors';

export const maxDuration = 60;

/** POST /api/ai/check-code  { problemText, code, errorOutput?, provider, userApiKey?, model?, language } */
export const POST = handleAIRequest(async ({ body, provider, apiKey, model, language }) => {
  if (typeof body.code !== 'string' || !body.code.trim()) {
    throw new UserError('Write some code first, then Check & Fix will review it.');
  }
  return checkAndFixCode(body.problemText || 'General DSA problem', body.code, body.errorOutput, {
    provider,
    apiKey,
    model,
    language,
  });
});
