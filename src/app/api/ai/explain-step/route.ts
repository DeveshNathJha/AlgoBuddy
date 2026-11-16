import { NextRequest, NextResponse } from 'next/server';
import { explainTraceStep } from '@/lib/aiClient';

/**
 * POST /api/ai/explain-step
 * Accepts: { codeLine, lineNumber, variablesBefore, variablesAfter, changedVars, provider, userApiKey, model }
 * Returns on-demand concise explanation of a single trace step
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      codeLine,
      lineNumber,
      variablesBefore,
      variablesAfter,
      changedVars,
      provider,
      userApiKey,
      model,
    } = body;

    const data = await explainTraceStep(
      codeLine || '',
      lineNumber || 1,
      variablesBefore || {},
      variablesAfter || {},
      changedVars || [],
      {
        provider,
        apiKey: userApiKey,
        model,
      }
    );

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in explain-step API:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to explain trace step.' },
      { status: 500 }
    );
  }
}
