import { explainTraceStep } from '@/lib/aiClient';
import { handleAIRequest } from '@/lib/aiRoute';
import { UserError } from '@/lib/errors';

export const maxDuration = 30;

const asVars = (v: unknown): Record<string, string> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : null;

/** POST /api/ai/explain-step  { code, lineNumber, event, functionName, iteration, variablesBefore, variablesAfter, changedVars, nextAction?, returnValue? } */
export const POST = handleAIRequest(async ({ body, provider, apiKey, model }) => {
  if (typeof body.code !== 'string' || !body.code.trim()) throw new UserError('Run your code again, then try Explain.');
  return explainTraceStep(
    {
      code: body.code.slice(0, 20000),
      lineNumber: Number(body.lineNumber) || 1,
      event: body.event === 'return' || body.event === 'exception' ? body.event : 'line',
      functionName: typeof body.functionName === 'string' ? body.functionName : '<module>',
      iteration: Number(body.iteration) || 1,
      variablesBefore: asVars(body.variablesBefore) || {},
      variablesAfter: asVars(body.variablesAfter),
      changedVars: Array.isArray(body.changedVars) ? body.changedVars.map(String) : [],
      nextAction: typeof body.nextAction === 'string' ? body.nextAction.slice(0, 200) : undefined,
      returnValue: typeof body.returnValue === 'string' ? body.returnValue : undefined,
    },
    { provider, apiKey, model }
  );
});
