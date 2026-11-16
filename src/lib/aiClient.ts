/**
 * AlgoBuddy - Multi-provider AI client (server only).
 *
 * Providers: Google Gemini, Groq, OpenAI. Every prompt asks for strict JSON, and
 * each response goes through a sanitizer that guarantees the shape the UI expects.
 * Sanitizers never invent "analysis" text: if the model returns nothing useful we
 * throw, and the user sees a clear "please regenerate" error instead of generic filler.
 */

import {
  ThinkingGuideData,
  InterviewScriptData,
  AIProvider,
  CodeCheckResult,
  CodeCheckBug,
  ProblemApproach,
} from './types';
import {
  MAX_CODE_LENGTH,
  MAX_PROBLEM_LENGTH,
  PROVIDER_MODELS,
  RETIRED_MODELS,
  commentPrefix,
  languageLabel,
} from './config';
import { ProviderError, UserError } from './errors';

interface GenerationOptions {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
  language?: string;
}

const REQUEST_TIMEOUT_MS = 55_000;

/**
 * Formatting contract shared by every prompt. The UI renders `inline code` and
 * **bold** and numbers lists itself, so models must not add their own numbering
 * or markdown structure. Mixed formatting was what made text look jumbled.
 */
const FORMAT_RULES = `
Formatting rules (follow strictly):
- Every text value is plain prose. No markdown headings, no bullet characters, no tables, no LaTeX (write O(n log n), not $O(n \\log n)$).
- Wrap variable names, expressions and short code fragments in single backticks, e.g. \`left < right\`.
- Use **double asterisks** only for at most one key phrase per paragraph.
- Never start a list item with "Step 1:", "1.", "-" or similar. The UI numbers lists itself.
- Keep each list item to one or two short sentences. Prefer short, clear sentences over long ones.
- Only code fields (pseudocode, snippets, full code) may contain newlines, and they must contain real, properly indented code.

If the problem text is only a short name or number (e.g. "LeetCode 42"), work on that well-known problem and name it fully in the first sentence. If you cannot tell which problem it is, say so plainly instead of guessing.
`;

// ─────────────────────────────────────────────
// JSON + string helpers
// ─────────────────────────────────────────────

function extractAndParseJSON<T>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new UserError('The AI returned an empty answer. Please click Regenerate.');
  }

  const cleaned = rawText
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      const extracted = cleaned.substring(first, last + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch {
        try {
          return JSON.parse(extracted.replace(/,\s*([}\]])/g, '$1')) as T;
        } catch {
          /* fall through */
        }
      }
    }
    throw new UserError('The AI returned an incomplete answer. Please click Regenerate.');
  }
}

function str(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

/** Removes numbering the model added anyway ("Step 2:", "3.", "- ", "•"). */
export function cleanListItem(text: string): string {
  return text
    .trim()
    .replace(/^(?:step\s*\d+\s*[:.)-]\s*)/i, '')
    .replace(/^(?:\d+\s*[.):-]\s+)/, '')
    .replace(/^[-*•]\s+/, '')
    .trim();
}

function toArrayOfStrings(val: unknown): string[] {
  let items: unknown[] = [];
  if (Array.isArray(val)) items = val;
  else if (typeof val === 'string') items = val.split('\n');
  else if (val && typeof val === 'object') items = Object.values(val);

  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return str(o.description) || str(o.text) || str(o.title) || str(o.step) || '';
      }
      return item == null ? '' : String(item);
    })
    .map(cleanListItem)
    .filter(Boolean);
}

function resolveModel(provider: AIProvider, requested?: string): string {
  if (!requested || RETIRED_MODELS.has(requested)) return PROVIDER_MODELS[provider].defaultModel;
  return requested;
}

// ─────────────────────────────────────────────
// Sanitizers
// ─────────────────────────────────────────────

export function sanitizeThinkingGuideData(raw: any): ThinkingGuideData {
  if (!raw || typeof raw !== 'object') throw new UserError('The AI answer was not in the expected format. Please click Regenerate.');

  const approaches: ProblemApproach[] = (Array.isArray(raw.approaches) ? raw.approaches : [])
    .filter((a: any) => a && typeof a === 'object')
    .map((app: any, idx: number, all: any[]) => {
      const tier: ProblemApproach['tier'] = ['brute-force', 'better', 'optimal'].includes(app.tier)
        ? app.tier
        : idx === 0
        ? 'brute-force'
        : idx === all.length - 1
        ? 'optimal'
        : 'better';
      return {
        approachName: str(app.approachName) || `Approach ${idx + 1}`,
        tier,
        timeComplexity: str(app.timeComplexity),
        spaceComplexity: str(app.spaceComplexity),
        intuition: str(app.intuition),
        stepByStepAlgorithm: toArrayOfStrings(app.stepByStepAlgorithm),
        pseudocodeOrSnippet: typeof app.pseudocodeOrSnippet === 'string' ? app.pseudocodeOrSnippet.replace(/^\n+|\s+$/g, '') : '',
        tradeoffsAndDrawbacks: str(app.tradeoffsAndDrawbacks),
      };
    })
    .filter((a: ProblemApproach) => a.intuition || a.stepByStepAlgorithm.length > 0);

  if (approaches.length === 0) {
    throw new UserError('The AI answer was missing the solution approaches. Please click Regenerate.');
  }

  const recognizedPatterns = (Array.isArray(raw.recognizedPatterns) ? raw.recognizedPatterns : [])
    .map((p: any) =>
      typeof p === 'string'
        ? { patternName: p.trim(), whyThisPattern: '' }
        : { patternName: str(p?.patternName), whyThisPattern: str(p?.whyThisPattern) }
    )
    .filter((p: { patternName: string }) => p.patternName);

  let implementationBlueprint: ThinkingGuideData['implementationBlueprint'];
  const bp = raw.implementationBlueprint;
  if (bp && typeof bp === 'object') {
    implementationBlueprint = {
      dataStructuresNeeded: toArrayOfStrings(bp.dataStructuresNeeded),
      algorithmSteps: toArrayOfStrings(bp.algorithmSteps),
      starterCodeTemplate: typeof bp.starterCodeTemplate === 'string' ? bp.starterCodeTemplate.replace(/^\n+/, '') : '',
    };
  }

  const hints = (Array.isArray(raw.hints) ? raw.hints : [])
    .filter((h: any) => str(h?.content))
    // Number after filtering, so levels are always 1..n in order, whatever the model sent.
    .map((h: any, i: number) => ({
      level: i + 1,
      title: cleanListItem(str(h?.title).replace(/^level\s*\d+\s*[:.-]\s*/i, '')) || `Hint ${i + 1}`,
      content: str(h.content),
    }));

  return {
    simplifiedProblem: str(raw.simplifiedProblem),
    coreConstraints: toArrayOfStrings(raw.coreConstraints),
    recognizedPatterns,
    approaches,
    implementationBlueprint,
    edgeCases: toArrayOfStrings(raw.edgeCases),
    hints,
  };
}

export function sanitizeInterviewScriptData(raw: any): InterviewScriptData {
  if (!raw || typeof raw !== 'object') throw new UserError('The AI answer was not in the expected format. Please click Regenerate.');

  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s: any, idx: number) => ({
      id: `section-${idx}`, // model-supplied ids can collide; index ids are always unique
      phase: cleanListItem(str(s?.phase)) || `Stage ${idx + 1}`,
      speakingScript: str(s?.speakingScript),
      interviewerReactionHint: str(s?.interviewerReactionHint).replace(/^interviewer signal:\s*/i, ''),
      keyPoints: toArrayOfStrings(s?.keyPoints),
    }))
    .filter((s: { speakingScript: string }) => s.speakingScript);

  if (sections.length === 0) {
    throw new UserError('The AI answer was missing the script. Please click Regenerate.');
  }

  return {
    problemSummary: str(raw.problemSummary),
    sections,
    timeComplexityExplanation: str(raw.timeComplexityExplanation),
    spaceComplexityExplanation: str(raw.spaceComplexityExplanation),
    proTips: toArrayOfStrings(raw.proTips),
  };
}

export function sanitizeCodeCheckResult(raw: any, originalCode: string): CodeCheckResult {
  if (!raw || typeof raw !== 'object') throw new UserError('The AI answer was not in the expected format. Please try Check & Fix again.');

  const bugs: CodeCheckBug[] = (Array.isArray(raw.bugs) ? raw.bugs : [])
    .filter((b: any) => b && typeof b === 'object')
    .map((b: any, i: number) => ({
      lineNumber: Number.isInteger(b.lineNumber) && b.lineNumber > 0 ? b.lineNumber : undefined,
      issueType: ['syntax', 'runtime', 'logic', 'edge-case', 'complexity'].includes(b.issueType) ? b.issueType : 'logic',
      title: str(b.title) || `Issue ${i + 1}`,
      explanation: str(b.explanation),
      problematicSnippet: str(b.problematicSnippet) || undefined,
      fixedSnippet: str(b.fixedSnippet) || undefined,
    }));

  // Status must agree with the bug list; models sometimes say "clean" while listing bugs.
  const status: CodeCheckResult['status'] = bugs.length > 0 ? 'issues_found' : 'clean';

  const fixed = typeof raw.fixedFullCode === 'string' ? raw.fixedFullCode.replace(/^\n+|\s+$/g, '') : '';
  const score = typeof raw.overallScore === 'number' && Number.isFinite(raw.overallScore)
    ? Math.max(0, Math.min(100, Math.round(raw.overallScore)))
    : null;

  return {
    status,
    summary: str(raw.summary) || (status === 'clean' ? 'No problems found.' : `Found ${bugs.length} issue(s).`),
    overallScore: score,
    timeComplexity: str(raw.timeComplexity),
    spaceComplexity: str(raw.spaceComplexity),
    bugs,
    // Empty string = "no change suggested". The UI hides "Apply Fix" in that case.
    fixedFullCode: fixed && fixed.trim() !== originalCode.trim() ? fixed : '',
    learningAdvice: str(raw.learningAdvice),
  };
}

// ─────────────────────────────────────────────
// Provider dispatcher
// ─────────────────────────────────────────────

const MAX_RETRY_WAIT_S = 12;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Groq rate limits are per model, so on a long wait we can switch to the sibling model. */
const GROQ_SIBLING: Record<string, string> = {
  'openai/gpt-oss-20b': 'openai/gpt-oss-120b',
  'openai/gpt-oss-120b': 'openai/gpt-oss-20b',
};

/** Seconds to wait before retrying a 429, from the Retry-After header or "try again in 7.8s" text. */
function retryDelaySeconds(res: Response, message: string): number | null {
  const header = Number(res.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return header;
  const m = message.match(/try again in\s+(?:(\d+)m)?([\d.]+)s/i) || message.match(/retry in\s+([\d.]+)s/i);
  if (!m) return null;
  return m.length === 3 ? Number(m[1] || 0) * 60 + Number(m[2]) : Number(m[1]);
}

/**
 * Groq / OpenAI chat completions with two recoveries:
 *  - JSON mode rejected the model's output (Groq "json_validate_failed"): use the
 *    returned `failed_generation`, which the lenient parser can usually repair; else retry without JSON mode.
 *  - Rate limited (429): wait if it is short, or (Groq) switch to the sibling model with its own limit.
 */
async function callOpenAICompatible(provider: 'groq' | 'openai', apiKey: string, firstModel: string, prompt: string, systemInstruction: string): Promise<string> {
  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  let model = firstModel;
  let jsonMode = true;

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        temperature: 0.3,
        // Reasoning models (GPT-OSS) spend output tokens on hidden reasoning first; Groq's
        // default 2048-token cap could leave nothing for the answer. Low effort also keeps
        // us well inside Groq's tokens-per-minute limit.
        max_completion_tokens: 8192,
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) {
      const data = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';
      if (!content && choice?.finish_reason === 'length') {
        console.warn(`[AI] ${model} ran out of output tokens before answering`);
        throw new UserError('The AI answer was cut off. Please click Regenerate.');
      }
      return content;
    }

    const errBody = await response.json().catch(() => ({}));
    const err = errBody.error || {};
    const message = String(err.message || '');

    if (response.status === 400 && err.code === 'json_validate_failed') {
      if (typeof err.failed_generation === 'string' && err.failed_generation.includes('{')) return err.failed_generation;
      jsonMode = false;
      continue;
    }

    if (response.status === 429 && attempt < 3) {
      // Switching to the sibling model is instant (separate limit), so try it before waiting.
      if (provider === 'groq' && GROQ_SIBLING[model] && model === firstModel) {
        model = GROQ_SIBLING[model];
        continue;
      }
      const wait = retryDelaySeconds(response, message);
      if (wait !== null && wait <= MAX_RETRY_WAIT_S) {
        await sleep(wait * 1000 + 250);
        continue;
      }
    }

    throw new ProviderError(provider, response.status, message);
  }
  throw new ProviderError(provider, 429, 'retries exhausted');
}

async function callLLM(prompt: string, systemInstruction: string, options: GenerationOptions): Promise<string> {
  const provider = options.provider || 'gemini';
  const apiKey =
    options.apiKey ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY);

  if (!apiKey) {
    throw new UserError('No API key is set for this AI provider. Add your key in Settings.');
  }

  const model = resolveModel(provider, options.model);

  if (provider === 'groq' || provider === 'openai') {
    return callOpenAICompatible(provider, apiKey, model, prompt, systemInstruction);
  }

  // Google Gemini (REST; the old @google/generative-ai SDK is deprecated).
  // Native JSON mode makes parse failures far less likely.
  const send = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let response = await send();
  if (response.status === 429) {
    const errBody = await response.json().catch(() => ({}));
    const wait = retryDelaySeconds(response, String(errBody.error?.message || ''));
    if (wait === null || wait > MAX_RETRY_WAIT_S) throw new ProviderError('gemini', 429, String(errBody.error?.message || ''));
    await sleep(wait * 1000 + 250);
    response = await send();
  }
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new ProviderError('gemini', response.status, String(errBody.error?.message || ''));
  }
  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new UserError(data.promptFeedback?.blockReason ? 'The AI declined to answer this request. Try rephrasing the problem.' : 'The AI returned an empty answer. Please click Regenerate.');
  }
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new UserError('The AI answer was cut off. Please click Regenerate.');
  }
  return (candidate.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
}

function assertLength(problemText: string, code?: string) {
  if (problemText.length > MAX_PROBLEM_LENGTH) {
    throw new UserError(`The problem text is too long (limit: ${MAX_PROBLEM_LENGTH.toLocaleString()} characters).`);
  }
  if (code && code.length > MAX_CODE_LENGTH) {
    throw new UserError(`The code is too long (limit: ${MAX_CODE_LENGTH.toLocaleString()} characters).`);
  }
}

// ─────────────────────────────────────────────
// Feature A: Thinking Guide (the "How to Think" tab)
// ─────────────────────────────────────────────

export async function generateThinkingGuide(
  problemText: string,
  codeSnippet?: string,
  options: GenerationOptions = {}
): Promise<ThinkingGuideData> {
  assertLength(problemText, codeSnippet);
  const lang = languageLabel(options.language);
  const c = commentPrefix(options.language);

  const starterRule =
    options.language === 'python' || !options.language
      ? `A runnable Python 3 scaffold: the function signature with a docstring and \`pass\` (or ${c} TODO comments) for the body, followed by a small sample call that prints the result, so it can be traced line by line. Use only ${c} comments.`
      : `A compile-ready ${lang} scaffold: class/method signature with ${c} TODO comments in the body, plus a main function that calls it with the sample input and prints the result. Use only ${c} comments.`;

  const systemInstruction = `You are AlgoBuddy, a patient DSA mentor who teaches students HOW to think, not just the answer.
The student codes in ${lang}. Explain like a senior engineer mentoring a junior: concrete, specific to THIS problem, no generic filler.
Respond with valid JSON only.
${FORMAT_RULES}`;

  const prompt = `Problem:
"""
${problemText}
"""
${codeSnippet ? `\nThe student's current code (use it to tailor hints, but do not just fix it):\n"""\n${codeSnippet}\n"""\n` : ''}
Return JSON with exactly these keys:
{
  "simplifiedProblem": "2-3 sentences: what is given, what must be returned, in plain language.",
  "coreConstraints": ["Each item: one constraint and what it implies, e.g. \`n <= 10^5\` means we need O(n) or O(n log n)."],
  "recognizedPatterns": [{ "patternName": "Short name, e.g. Sliding Window", "whyThisPattern": "1-2 sentences: which clue in THIS problem points to it." }],
  "approaches": [
    {
      "approachName": "Short name, e.g. Brute Force: check every pair",
      "tier": "brute-force | better | optimal",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "intuition": "2-3 sentences: the idea behind it.",
      "stepByStepAlgorithm": ["3-6 items, one action each"],
      "pseudocodeOrSnippet": "4-10 lines of real ${lang} code (comments use ${c}).",
      "tradeoffsAndDrawbacks": "1-2 sentences: why it is too slow, or what it trades."
    }
  ],
  "implementationBlueprint": {
    "dataStructuresNeeded": ["Structure and why, e.g. \`HashMap<Integer,Integer>\` to look up complements in O(1)"],
    "algorithmSteps": ["4-6 coding actions in order, for the optimal approach"],
    "starterCodeTemplate": "${starterRule}"
  },
  "edgeCases": ["Each item: the input and the expected behaviour, e.g. empty array returns \`[]\`."],
  "hints": [
    { "title": "Nudge", "content": "A question that points the student in the right direction without naming the data structure." },
    { "title": "Direction", "content": "Name the pattern or data structure to use." },
    { "title": "Blueprint", "content": "The key invariant or state to maintain." },
    { "title": "Full strategy", "content": "The whole plan in 3-4 sentences, without code." }
  ]
}
Give 2 or 3 approaches ordered from brute force to optimal (skip "better" if there is no meaningful middle step). Exactly 4 hints.`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return sanitizeThinkingGuideData(extractAndParseJSON(raw));
}

// ─────────────────────────────────────────────
// Feature B: Interview script
// ─────────────────────────────────────────────

export async function generateInterviewScript(
  problemText: string,
  codeSnippet: string = '',
  options: GenerationOptions = {}
): Promise<InterviewScriptData> {
  assertLength(problemText, codeSnippet);
  const lang = languageLabel(options.language);

  const systemInstruction = `You are AlgoBuddy, an interview coach. Write what the CANDIDATE should say out loud, in first person, during a ${lang} coding interview.
Sound like a calm, confident human, not a textbook. Use short spoken sentences, concrete numbers from one sample input, and real variable names.
Respond with valid JSON only.
${FORMAT_RULES}`;

  const prompt = `Problem:
"""
${problemText}
"""

${codeSnippet ? `Candidate's code:\n"""\n${codeSnippet}\n"""` : `No code yet. Assume the candidate will write the optimal ${lang} solution and narrate it.`}

Return JSON with exactly these keys:
{
  "problemSummary": "2 sentences the candidate says to confirm understanding.",
  "sections": [
    { "phase": "Clarifying questions", "speakingScript": "3-5 spoken sentences asking about input size, duplicates, negatives, empty input, return format.", "interviewerReactionHint": "One sentence: what the interviewer is evaluating here.", "keyPoints": ["2-4 short phrases"] },
    { "phase": "Example walkthrough", "speakingScript": "4-6 sentences tracing one concrete sample input by hand.", "interviewerReactionHint": "...", "keyPoints": ["..."] },
    { "phase": "Brute force to optimal", "speakingScript": "4-6 sentences: naive idea and its cost, the bottleneck, the key insight, the optimal idea.", "interviewerReactionHint": "...", "keyPoints": ["..."] },
    { "phase": "Code walkthrough", "speakingScript": "4-6 sentences explaining the code top to bottom while writing it.", "interviewerReactionHint": "...", "keyPoints": ["..."] },
    { "phase": "Testing and complexity", "speakingScript": "3-5 sentences: dry-run one edge case, state time and space complexity with reasons, invite questions.", "interviewerReactionHint": "...", "keyPoints": ["..."] }
  ],
  "timeComplexityExplanation": "One or two spoken sentences.",
  "spaceComplexityExplanation": "One or two spoken sentences.",
  "proTips": ["3-4 short, specific communication tips for THIS problem"]
}
keyPoints are short phrases (2-6 words), not sentences.`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return sanitizeInterviewScriptData(extractAndParseJSON(raw));
}

// ─────────────────────────────────────────────
// Feature C: Explain one trace step
// ─────────────────────────────────────────────

export interface ExplainStepInput {
  /** Full traced program (so the model sees loops/branches around the line). */
  code: string;
  lineNumber: number;
  event: 'line' | 'return' | 'exception';
  functionName: string;
  /** How many times this line has run so far. */
  iteration: number;
  /** Variables right before the line runs. */
  variablesBefore: Record<string, string>;
  /** Variables right after it ran (same function), or null if the line called into another function / was the last step. */
  variablesAfter: Record<string, string> | null;
  changedVars: string[];
  /** What happens next, e.g. "jumps to line 7" or "calls two_sum()". */
  nextAction?: string;
  returnValue?: string;
}

export async function explainTraceStep(
  input: ExplainStepInput,
  options: GenerationOptions = {}
): Promise<{ explanation: string; whyItRan: string }> {
  const systemInstruction = `You are AlgoBuddy's step debugger, explaining one step of a Python program to a beginner.
Be concrete: use the real variable names and the real values given. Never describe Python syntax in general terms.
Each field is 1-2 short sentences.
Respond with valid JSON only.
${FORMAT_RULES}`;

  const lines = input.code.split('\n');
  const from = Math.max(0, input.lineNumber - 40);
  const to = Math.min(lines.length, input.lineNumber + 40);
  const numbered = lines
    .slice(from, to)
    .map((l, i) => `${from + i + 1 === input.lineNumber ? '>>' : '  '} ${String(from + i + 1).padStart(3, ' ')} | ${l}`)
    .join('\n');
  const where = input.functionName && input.functionName !== '<module>' ? `inside \`${input.functionName}()\`` : 'in the main program';

  const situation =
    input.event === 'return'
      ? `The function \`${input.functionName}()\` is returning \`${input.returnValue ?? 'None'}\` from line ${input.lineNumber}.`
      : `Line ${input.lineNumber} (${where}) is about to run. This is run number ${input.iteration} of this line.`;

  const prompt = `Program (>> marks the current line):
${numbered}

${situation}
Variables before: ${JSON.stringify(input.variablesBefore).slice(0, 3000)}
${input.variablesAfter ? `Variables after: ${JSON.stringify(input.variablesAfter).slice(0, 3000)}` : ''}
${input.changedVars.length ? `Changed by this line: ${input.changedVars.join(', ')}` : 'No variable changes (a condition, loop check, call or print).'}
${input.nextAction ? `Next, execution ${input.nextAction}.` : ''}

Return JSON: {
  "explanation": "What this line does right now with these exact values (e.g. compares \`7 in seen\` → False, so it skips the return).",
  "whyItRan": "Why execution is on this line now: which loop iteration, which branch was taken, or which call led here."
}`;

  const raw = await callLLM(prompt, systemInstruction, options);
  const parsed = extractAndParseJSON<any>(raw);
  const explanation = str(parsed?.explanation);
  if (!explanation) throw new UserError('The AI could not explain this step. Please try again.');
  return { explanation, whyItRan: str(parsed?.whyItRan) };
}

// ─────────────────────────────────────────────
// Feature D: Code Doctor
// ─────────────────────────────────────────────

export async function checkAndFixCode(
  problemText: string,
  code: string,
  errorOutput?: string,
  options: GenerationOptions = {}
): Promise<CodeCheckResult> {
  if (!code || !code.trim()) throw new UserError('Write some code first, then Check & Fix will review it.');
  assertLength(problemText, code);
  const lang = languageLabel(options.language);

  // Line numbers in the prompt let the model report accurate `lineNumber`s.
  const numbered = code
    .split('\n')
    .map((line, i) => `${String(i + 1).padStart(3, ' ')} | ${line}`)
    .join('\n');

  const systemInstruction = `You are AlgoBuddy Code Doctor, a careful senior engineer reviewing a student's ${lang} solution.
Find real problems only: syntax errors, crashes, wrong logic, off-by-one errors, missed edge cases, too-slow complexity. Do not invent issues. If the code is correct, return an empty bugs list.
Keep the student's approach and variable names in the fix.
Respond with valid JSON only.
${FORMAT_RULES}`;

  const prompt = `Problem:
"""
${problemText}
"""

Student's ${lang} code (line numbers are for reference only, they are not part of the code):
${numbered}

${errorOutput ? `Error from running it:\n"""\n${errorOutput.slice(0, 2000)}\n"""` : 'No runtime error was recorded. Review it statically.'}

Return JSON with exactly these keys:
{
  "summary": "1-2 sentences on overall correctness.",
  "overallScore": 75,
  "timeComplexity": "O(...) of the student's code",
  "spaceComplexity": "O(...) of the student's code",
  "bugs": [
    { "lineNumber": 14, "issueType": "syntax | runtime | logic | edge-case | complexity", "title": "Short title", "explanation": "Why it fails and an input that triggers it.", "problematicSnippet": "the exact buggy line(s)", "fixedSnippet": "the corrected line(s)" }
  ],
  "fixedFullCode": "The complete corrected ${lang} program WITHOUT line numbers. Use an empty string if nothing needs fixing.",
  "learningAdvice": "One takeaway to remember in interviews."
}
overallScore is a number from 0 to 100 for correctness, edge-case safety and interview readiness.`;

  const raw = await callLLM(prompt, systemInstruction, options);
  return sanitizeCodeCheckResult(extractAndParseJSON(raw), code);
}

// ─────────────────────────────────────────────
// Feature E: Resolve "LeetCode 42" / "trapping rain water" into a full statement
// ─────────────────────────────────────────────

export interface ResolvedProblem {
  found: boolean;
  confident: boolean;
  title: string;
  leetcodeNumber: number | null;
  statement: string;
  message: string;
}

export async function resolveProblemReference(reference: string, options: GenerationOptions = {}): Promise<ResolvedProblem> {
  const ref = reference.trim().slice(0, 200);
  if (!ref) throw new UserError('Type a problem name or number first.');

  const systemInstruction = `You identify well-known coding interview problems (LeetCode, GeeksforGeeks, Codeforces, classic textbook problems) from a short reference typed by a student.
Write problem statements in your own words. Never invent a problem: if you are not sure which problem the reference means, say so.
Respond with valid JSON only.`;

  const prompt = `The student typed: "${ref}"

Return JSON:
{
  "found": true or false,
  "confident": true only if you are sure this is the intended problem (e.g. the LeetCode number and title match),
  "title": "Official problem title",
  "leetcodeNumber": the LeetCode number or null,
  "statement": "A complete, self-contained statement in your own words, using real newlines. Format:\nTitle\n\nDescription paragraph(s).\n\nExample 1:\nInput: ...\nOutput: ...\nExplanation: ...\n\nExample 2:\nInput: ...\nOutput: ...\n\nConstraints:\n- ...\n- ...",
  "message": "If not found or not confident: one sentence telling the student what is ambiguous and asking them to paste the full statement. Otherwise an empty string."
}`;

  const raw = await callLLM(prompt, systemInstruction, options);
  const parsed = extractAndParseJSON<any>(raw);
  const statement = typeof parsed?.statement === 'string' ? parsed.statement.replace(/\r\n/g, '\n').trim() : '';
  const found = parsed?.found === true && statement.length > 40;
  return {
    found,
    confident: found && parsed?.confident === true,
    title: str(parsed?.title),
    leetcodeNumber: Number.isInteger(parsed?.leetcodeNumber) ? parsed.leetcodeNumber : null,
    statement: found ? statement : '',
    message: str(parsed?.message) || (found ? '' : 'Could not identify this problem. Please paste the full problem statement.'),
  };
}
