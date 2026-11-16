import { resolveProblemReference } from '@/lib/aiClient';
import { handleAIRequest } from '@/lib/aiRoute';

export const maxDuration = 30;

/**
 * POST /api/ai/resolve-problem  { reference }
 * Turns "LeetCode 42" / "trapping rain water" into a full statement the student can check.
 * Does not spend a free request (it is part of the action that follows), but is rate limited.
 */
export const POST = handleAIRequest(
  async ({ body, provider, apiKey, model }) => resolveProblemReference(String(body.reference || ''), { provider, apiKey, model }),
  { charge: false }
);
