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
Provide in-depth algorithmic pattern analysis, multiple progressive solution approaches (Brute Force -> Better/Intermediate -> Most Optimal), time/space trade-offs, and an actionable implementation blueprint suited for ${lang}.
You must respond strictly with valid, unescaped JSON matching the requested schema.
`;

  const prompt = `
Problem Description:
"""
${problemText}
"""

${codeSnippet ? `Candidate's existing code (if any):\n"""\n${codeSnippet}\n"""` : ''}

Generate structured problem decomposition with multiple approaches and an implementation bridge in the following exact JSON format:
{
  "simplifiedProblem": "Clear, comprehensive restatement of the problem in plain English, explaining what is given and what must be returned.",
  "coreConstraints": [
    "Constraint 1 and its direct algorithmic deduction (e.g. N <= 10^5 implies O(N) or O(N log N) is required)",
    "Constraint 2 and memory/overflow implications (e.g. integer bounds, 32-bit vs 64-bit)"
  ],
  "recognizedPatterns": [
    {
      "patternName": "Primary Pattern (e.g., Two Pointers, Monotonic Stack, Sliding Window, DP, Prefix Sum)",
      "whyThisPattern": "Deep explanation of why this specific problem structure demands this pattern over others"
    }
  ],
  "approaches": [
    {
      "approachName": "Approach 1: Naive Brute Force",
      "tier": "brute-force",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "intuition": "The straightforward brute force idea that anyone can come up with first.",
      "stepByStepAlgorithm": [
        "Step 1: Iterate through ...",
        "Step 2: Check condition ...",
        "Step 3: Return result or fallback"
      ],
      "pseudocodeOrSnippet": "// Short 3-5 line logic or pseudocode in ${lang}",
      "tradeoffsAndDrawbacks": "Why this approach is computationally unacceptable or exceeds time limits (TLE)."
    },
    {
      "approachName": "Approach 2: Better / Intermediate Optimization",
      "tier": "better",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "intuition": "Intermediate optimization (e.g. using sorting, binary search, or two pointers) that improves runtime but might still have a tradeoff.",
      "stepByStepAlgorithm": [
        "Step 1: Pre-process or sort ...",
        "Step 2: Use two pointers / binary search ...",
        "Step 3: Collect result"
      ],
      "pseudocodeOrSnippet": "// Short 3-5 line logic or pseudocode in ${lang}",
      "tradeoffsAndDrawbacks": "How this improves over brute-force and what tradeoffs (like sorting cost O(N log N)) remain."
    },
    {
      "approachName": "Approach 3: Optimal (Production-Grade)",
      "tier": "optimal",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "intuition": "The central mathematical, hash-based, or structural insight that unlocks maximum efficiency.",
      "stepByStepAlgorithm": [
        "Step 1: Initialize optimal auxiliary structure ...",
        "Step 2: Single pass traversal maintaining invariants ...",
        "Step 3: Constant-time state lookups and transitions ...",
        "Step 4: Return final optimal result"
      ],
      "pseudocodeOrSnippet": "// Short 4-7 line optimal logic in ${lang}",
      "tradeoffsAndDrawbacks": "Tradeoffs (e.g. trades O(N) extra space for O(N) linear time)."
    }
  ],
  "bruteForce": {
    "approach": "Summary of brute force solution",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "drawback": "Why this exceeds time limits"
  },
  "optimizedApproach": {
    "approach": "Summary of optimal algorithmic strategy",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "keyIntuition": "The central mathematical or structural insight"
  },
  "implementationBlueprint": {
    "dataStructuresNeeded": ["Data structure 1 (e.g. HashMap for O(1) complements)", "Data structure 2"],
    "algorithmSteps": [
      "1. Edge check: handle empty or small inputs",
      "2. State tracking: initialize variables/pointers",
      "3. Core loop: process elements sequentially",
      "4. Post-processing: format and return answer"
    ],
    "starterCodeTemplate": "// Clean starter code scaffold with method signature in ${lang}"
  },
  "edgeCases": [
    "Edge case 1: Empty or single element collection -> return expected boundary value",
    "Edge case 2: Duplicate elements or all identical values",
    "Edge case 3: Negative numbers or maximum integer overflow boundary"
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
  const parsed = extractAndParseJSON<ThinkingGuideData>(raw);

  // Guarantee backwards compatibility if approaches is missing
  if (!parsed.approaches || parsed.approaches.length === 0) {
    parsed.approaches = [
      {
        approachName: 'Approach 1: Brute Force',
        tier: 'brute-force',
        timeComplexity: parsed.bruteForce?.timeComplexity || 'O(N^2)',
        spaceComplexity: parsed.bruteForce?.spaceComplexity || 'O(1)',
        intuition: parsed.bruteForce?.approach || 'Check all possibilities',
        stepByStepAlgorithm: [parsed.bruteForce?.approach || 'Exhaustive search'],
        pseudocodeOrSnippet: '',
        tradeoffsAndDrawbacks: parsed.bruteForce?.drawback || 'Too slow for large N',
      },
      {
        approachName: 'Approach 2: Optimal Solution',
        tier: 'optimal',
        timeComplexity: parsed.optimizedApproach?.timeComplexity || 'O(N)',
        spaceComplexity: parsed.optimizedApproach?.spaceComplexity || 'O(1)',
        intuition: parsed.optimizedApproach?.keyIntuition || 'Direct optimal lookup',
        stepByStepAlgorithm: [parsed.optimizedApproach?.approach || 'Optimal single pass'],
        pseudocodeOrSnippet: '',
        tradeoffsAndDrawbacks: 'Optimal time complexity',
      },
    ];
  }

  return parsed;
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
You are AlgoBuddy, an elite FAANG software engineering interview coach.
The candidate is interviewing in programming language: ${lang}.
Transform the problem (and optional code) into a realistic, natural, word-for-word spoken dialogue that a candidate should verbally present during a real senior-level technical interview.
Do NOT give brief or shallow 1-sentence summaries. Each speakingScript MUST be a thorough, conversational, professional spoken explanation (3 to 6 detailed sentences per section) using concrete variable names, numbers from a sample test case, and clear verbal transitions.
If the candidate has not provided code, derive the optimal algorithmic solution in ${lang} and produce the full dialogue explaining that solution out loud.
You must respond strictly with valid, unescaped JSON.
`;

  const prompt = `
Problem:
"""
${problemText}
"""

${codeSnippet ? `Candidate's Code:\n"""\n${codeSnippet}\n"""` : 'No code provided yet. Generate the spoken script as a candidate solving the problem from scratch with optimal solution.'}

Return detailed, word-for-word verbal script matching this JSON schema:
{
  "problemSummary": "2-3 sentence spoken recap confirming understanding to the interviewer, clarifying input types and output requirements.",
  "sections": [
    {
      "id": "clarifying-questions",
      "phase": "1. Clarifying Questions to Ask",
      "speakingScript": "Realistic 3-5 sentence spoken script where the candidate asks clarifying questions about constraints, duplicate values, memory limits, and empty inputs.",
      "interviewerReactionHint": "Interviewer signal: Confirms candidate communicates proactively before jumping into code.",
      "keyPoints": ["Confirm input bounds & constraints", "Ask about duplicate or negative values", "Verify expected return behavior for edge cases"]
    },
    {
      "id": "example-walkthrough",
      "phase": "2. Example Walkthrough on Whiteboard",
      "speakingScript": "Step-by-step 4-6 sentence spoken walkthrough using a concrete example, verbally tracing inputs, intermediate pointer/variable changes, and expected output.",
      "interviewerReactionHint": "Interviewer signal: Confirms candidate validates their mental model before implementation.",
      "keyPoints": ["Walk through a realistic concrete sample", "Highlight how pointers or state evolve", "Verify boundary output"]
    },
    {
      "id": "brute-force-to-optimal",
      "phase": "3. Brute Force to Optimized Transition",
      "speakingScript": "Polished verbal transition acknowledging the naive brute force (e.g. O(N^2) nested loops), explaining where the bottleneck lies, and proposing the optimal approach with the core insight.",
      "interviewerReactionHint": "Interviewer signal: Demonstrates trade-off analysis, complexity awareness, and algorithmic maturity.",
      "keyPoints": ["Acknowledge naive baseline complexity", "Pinpoint computational bottleneck", "Pivot to optimal using key insight"]
    },
    {
      "id": "code-explanation",
      "phase": "4. Step-by-Step Code Walkthrough",
      "speakingScript": "Clear, professional spoken walkthrough of the solution code, explaining the role of each variable, loop invariants, state transitions, and return statements in ${lang}.",
      "interviewerReactionHint": "Interviewer signal: Proves the candidate can communicate clearly while writing production-grade code.",
      "keyPoints": ["Data structure initialization", "Loop invariant & pointer progression", "Safe termination & return"]
    },
    {
      "id": "closing-summary",
      "phase": "5. Complexity & Wrap-Up",
      "speakingScript": "Formal closing summary stating exact asymptotic Time and Space complexities, justifying why each loop or data structure contributes to the bound, and inviting questions.",
      "interviewerReactionHint": "Interviewer signal: Concludes with rigorous mathematical precision.",
      "keyPoints": ["Time Complexity O(...)", "Space Complexity O(...)", "Interviewer sign-off question"]
    }
  ],
  "timeComplexityExplanation": "Spoken sentence explaining why time complexity is O(...)",
  "spaceComplexityExplanation": "Spoken sentence explaining auxiliary memory usage",
  "proTips": [
    "Always pause after key transitions and ask 'Does this approach make sense before I start coding?'",
    "Never code in complete silence for more than thirty seconds",
    "State your assumptions out loud before writing any helper functions"
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
