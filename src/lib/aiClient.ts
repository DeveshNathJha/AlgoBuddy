/**
 * AlgoBuddy - Multi-Provider AI Client
 * 
 * Supported Providers & Active Production Models:
 * - Google Gemini: gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro
 * - Groq Cloud: openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3.6-27b
 * - OpenAI: gpt-4o-mini, gpt-4o
 * 
 * Features:
 * - Robust regex JSON extractor (never crashes on markdown wrappers or extra commentary)
 * - Safe character limits
 * - AlgoBuddy pedagogical prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ThinkingGuideData, InterviewScriptData, AIProvider } from './types';

interface GenerationOptions {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
}

const MAX_INPUT_LENGTH = 12000;

/**
 * Resilient JSON Extractor that safely extracts JSON objects even when LLMs
 * return conversational preamble, markdown fences, or minor syntax quirks.
 */
function extractAndParseJSON<T>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Received empty response from AI provider.');
  }

  // 1. Strip standard code fence blocks
  let cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // 2. Try direct JSON parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 3. Fallback: Find outermost { and } boundary
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch (err: any) {
        // Try removing trailing commas (e.g. [1, 2, ])
        const sanitised = extracted.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitised) as T;
      }
    }

    throw new Error('Failed to parse structured JSON from AI output. Please try again.');
  }
}

/**
 * Standardized LLM completions dispatcher across Gemini, Groq, and OpenAI
 */
async function callLLM(prompt: string, systemInstruction: string, options: GenerationOptions): Promise<string> {
  const provider = options.provider || 'gemini';
  const apiKey =
    options.apiKey ||
    (provider === 'groq' ? process.env.GROQ_API_KEY : null) ||
    (provider === 'gemini' ? (process.env.GEMINI_API_KEY || process.env.MASTER_GEMINI_API_KEY) : null) ||
    (provider === 'openai' ? process.env.OPENAI_API_KEY : null);

  if (!apiKey) {
    throw new Error(
      `API key not found for provider "${provider.toUpperCase()}". Please configure your key in Settings.`
    );
  }

  // 1. GROQ PROVIDER
  if (provider === 'groq') {
    const model = options.model || 'openai/gpt-oss-20b';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Groq API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
  }

  // 2. OPENAI PROVIDER
  if (provider === 'openai') {
    const model = options.model || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `OpenAI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
  }

  // 3. GOOGLE GEMINI PROVIDER (Default)
  const modelName = options.model || 'gemini-1.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: modelName });

  const combinedPrompt = `${systemInstruction}\n\nTask and Input:\n${prompt}`;
  const result = await geminiModel.generateContent(combinedPrompt);
  return result.response.text();
}

/**
 * FEATURE A: Thinking Guide Generator
 */
export async function generateThinkingGuide(
  problemText: string,
  codeSnippet?: string,
  options: GenerationOptions & { language?: string } = {}
): Promise<ThinkingGuideData> {
  if (problemText.length > MAX_INPUT_LENGTH) {
    throw new Error(`Problem text is too long (limit: ${MAX_INPUT_LENGTH} characters).`);
  }

  const lang = options.language || 'Python';

  const systemInstruction = `
You are AlgoBuddy, an elite technical interview mentor and DSA coach.
Your mission is not to give away answers, but to train the user to decompose problems methodically and logically.
The candidate is practicing in programming language: ${lang}.
Provide algorithmic pattern analysis, time/space trade-offs, and implementation insights suited for ${lang}.
You must respond strictly with valid, unescaped JSON matching the requested schema.
`;

  const prompt = `
Problem Description:
"""
${problemText}
"""

${codeSnippet ? `Candidate's existing code (if any):\n"""\n${codeSnippet}\n"""` : ''}

Generate structured problem decomposition in the following exact JSON format:
{
  "simplifiedProblem": "Clear, concise restatement of the problem in plain English",
  "coreConstraints": ["Constraint 1 and algorithmic deduction", "Constraint 2 and boundary check"],
  "recognizedPatterns": [
    {
      "patternName": "Pattern Name (e.g., Two Pointers, Monotonic Stack, Sliding Window, DP)",
      "whyThisPattern": "Detailed explanation of why this specific problem structure demands this pattern"
    }
  ],
  "bruteForce": {
    "approach": "Step-by-step description of the naive brute force solution",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "drawback": "Why this approach is computationally unacceptable or exceeds time limits"
  },
  "optimizedApproach": {
    "approach": "Step-by-step optimal algorithmic strategy",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "keyIntuition": "The central mathematical or structural insight that unlocks optimization"
  },
  "edgeCases": [
    "Edge case 1: empty array or single element",
    "Edge case 2: extreme constraints or duplicate elements"
  ],
  "hints": [
    {
      "level": 1,
      "title": "Level 1: Directional Nudge",
      "content": "A high-level thinking prompt without revealing data structures or formulas",
      "revealed": false
    },
    {
      "level": 2,
      "title": "Level 2: Data Structure Guidance",
      "content": "Suggesting the appropriate data structure or algorithmic paradigm",
      "revealed": false
    },
    {
      "level": 3,
      "title": "Level 3: Algorithmic Blueprint",
      "content": "Step-by-step execution logic and pointer management rules",
      "revealed": false
    },
    {
      "level": 4,
      "title": "Level 4: Comprehensive Strategy",
      "content": "Full structural walkthrough prior to code implementation",
      "revealed": false
    }
  ]
}
`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return extractAndParseJSON<ThinkingGuideData>(raw);
}

/**
 * FEATURE C: Interview Script Generator
 */
export async function generateInterviewScript(
  problemText: string,
  codeSnippet: string = '',
  options: GenerationOptions & { language?: string } = {}
): Promise<InterviewScriptData> {
  if (problemText.length > MAX_INPUT_LENGTH) {
    throw new Error(`Problem text is too long (limit: ${MAX_INPUT_LENGTH} characters).`);
  }

  const lang = options.language || 'Python';

  const systemInstruction = `
You are AlgoBuddy, an expert software engineering interview coach.
The candidate is interviewing in programming language: ${lang}.
Transform the problem (and optional code) into a realistic, natural, word-for-word spoken dialogue that a candidate should verbally present during a technical interview.
If the candidate has not provided code, derive the optimal algorithmic solution in ${lang} and produce the full dialogue including how to explain that solution out loud.
You must respond strictly with valid JSON.
`;

  const prompt = `
Problem:
"""
${problemText}
"""

${codeSnippet ? `Candidate's Code:\n"""\n${codeSnippet}\n"""` : 'No code provided yet. Generate the spoken script as a candidate solving the problem from scratch with optimal solution.'}

Return exact verbal script matching this JSON schema:
{
  "problemSummary": "1-2 sentence spoken recap confirming understanding to the interviewer",
  "sections": [
    {
      "id": "clarifying-questions",
      "phase": "1. Clarifying Questions to Ask",
      "speakingScript": "Exact verbal script candidate speaks out loud to confirm bounds, edge cases, and constraints",
      "interviewerReactionHint": "Interviewer signal: Confirms candidate does not make assumptions or jump blindly into code",
      "keyPoints": ["Confirm input bounds", "Discuss duplicates or negative values"]
    },
    {
      "id": "example-walkthrough",
      "phase": "2. Example Walkthrough on Whiteboard",
      "speakingScript": "Exact verbal script tracing through an illustrative sample case",
      "interviewerReactionHint": "Interviewer signal: Confirms candidate traces state before writing code",
      "keyPoints": ["Walk through standard case", "Verify edge case behavior"]
    },
    {
      "id": "brute-force-to-optimal",
      "phase": "3. Brute Force to Optimized Transition",
      "speakingScript": "Spoken transition acknowledging naive O(N^2) complexity and proposing optimal strategy",
      "interviewerReactionHint": "Interviewer signal: Demonstrates trade-off analysis and algorithmic maturity",
      "keyPoints": ["Acknowledge naive baseline", "Pivot to optimal using key insight"]
    },
    {
      "id": "code-explanation",
      "phase": "4. Step-by-Step Code Walkthrough",
      "speakingScript": "Clear, professional line-by-line spoken explanation of written functions and pointers",
      "interviewerReactionHint": "Interviewer signal: Demonstrates clear technical communication",
      "keyPoints": ["Loop termination conditions", "State transition guarantees"]
    },
    {
      "id": "closing-summary",
      "phase": "5. Complexity & Wrap-Up",
      "speakingScript": "Closing summary stating asymptotic Time and Space complexities with formal justification",
      "interviewerReactionHint": "Interviewer signal: Concludes with rigorous analysis",
      "keyPoints": ["Time Complexity O(...)", "Space Complexity O(...)"]
    }
  ],
  "timeComplexityExplanation": "Spoken sentence explaining why time complexity is O(...)",
  "spaceComplexityExplanation": "Spoken sentence explaining auxiliary memory usage",
  "proTips": [
    "Always pause after key transitions and ask 'Does this approach align with your expectations?'",
    "Never code in complete silence for more than thirty seconds"
  ]
}
`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return extractAndParseJSON<InterviewScriptData>(raw);
}

/**
 * FEATURE D: Single Step Trace Explainer
 */
export async function explainTraceStep(
  codeLine: string,
  lineNumber: number,
  variablesBefore: Record<string, string>,
  variablesAfter: Record<string, string>,
  changedVars: string[],
  options: GenerationOptions = {}
): Promise<{ explanation: string; whyItRan: string }> {
  const systemInstruction = `
You are AlgoBuddy execution trace debugger. Explain runtime state changes concisely in 2 professional English sentences.
Respond strictly in JSON format.
`;

  const prompt = `
Executed Line ${lineNumber}:
\`\`\`python
${codeLine}
\`\`\`

Variables prior to execution:
${JSON.stringify(variablesBefore, null, 2)}

Variables after execution:
${JSON.stringify(variablesAfter, null, 2)}

Modified variables:
${changedVars.join(', ') || 'None (Conditional evaluation or loop check)'}

Provide JSON:
{
  "explanation": "Clear explanation of data mutation or branch evaluation in this step",
  "whyItRan": "Algorithmic reason why the program reached and executed this line"
}
`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return extractAndParseJSON<{ explanation: string; whyItRan: string }>(raw);
}
