import { generateInterviewScript } from '@/lib/aiClient';
import { handleAIRequest } from '@/lib/aiRoute';
import { UserError } from '@/lib/errors';

export const maxDuration = 60;

/** POST /api/ai/interview-script  { problemText, codeSnippet?, provider, userApiKey?, model?, language } */
export const POST = handleAIRequest(async ({ body, provider, apiKey, model, language }) => {
  if (typeof body.problemText !== 'string' || !body.problemText.trim()) {
    throw new UserError('Enter a problem first.');
  }
  return generateInterviewScript(body.problemText, body.codeSnippet || '', { provider, apiKey, model, language });
});
