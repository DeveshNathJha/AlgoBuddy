/**
 * AlgoBuddy - Core type definitions.
 */

export type ProgrammingLanguage = 'python' | 'java' | 'cpp' | 'javascript';

export type AIProvider = 'gemini' | 'groq' | 'openai';

export interface FreeQuota {
  used: number;
  limit: number;
}

// ── Notes ──────────────────────────────────────

export interface ProblemNote {
  id: string;
  problemTitle: string;
  /** Full problem statement, so "Open problem" can restore it. Optional for notes saved by older versions. */
  problemText?: string;
  content: string;
  language: ProgrammingLanguage;
  createdAt: string;
  updatedAt: string;
}

// ── Python dry-run trace ───────────────────────

export interface StackFrame {
  functionName: string;
  lineNumber: number;
  filename: string;
}

export interface TraceStep {
  stepIndex: number;
  lineNumber: number;
  event: 'line' | 'return' | 'exception';
  functionName: string;
  variables: Record<string, string>;
  changedVariables: string[];
  callStack: StackFrame[];
  stdoutSoFar: string;
  /** Present on 'return' steps. */
  returnValue?: string;
  /** How many times this line has run so far (1 on first run). */
  iteration: number;
}

export interface TraceResult {
  success: boolean;
  steps: TraceStep[];
  totalSteps: number;
  stdout: string;
  error?: string | null;
  /** Line where the error was raised, if known. */
  errorLine?: number | null;
  /** True when execution was stopped because of the step limit. */
  truncated?: boolean;
  /** True when the Python runtime itself failed (not the student's code). */
  runnerError?: boolean;
  executionTimeMs: number;
  lineHitCounts: Record<number, number>;
  /** Exact code that was traced, so highlights stay correct if the editor changes later. */
  sourceCode: string;
}

// ── Thinking guide ─────────────────────────────

export interface ProgressiveHint {
  level: number;
  title: string;
  content: string;
}

export interface ProblemApproach {
  approachName: string;
  tier: 'brute-force' | 'better' | 'optimal';
  timeComplexity: string;
  spaceComplexity: string;
  intuition: string;
  stepByStepAlgorithm: string[];
  pseudocodeOrSnippet: string;
  tradeoffsAndDrawbacks: string;
}

export interface ImplementationBlueprint {
  dataStructuresNeeded: string[];
  algorithmSteps: string[];
  starterCodeTemplate: string;
}

export interface ThinkingGuideData {
  simplifiedProblem: string;
  coreConstraints: string[];
  recognizedPatterns: { patternName: string; whyThisPattern: string }[];
  approaches: ProblemApproach[];
  implementationBlueprint?: ImplementationBlueprint;
  edgeCases: string[];
  hints: ProgressiveHint[];
}

// ── Interview script ───────────────────────────

export interface ScriptSection {
  id: string;
  phase: string;
  speakingScript: string;
  interviewerReactionHint: string;
  keyPoints: string[];
}

export interface InterviewScriptData {
  problemSummary: string;
  sections: ScriptSection[];
  timeComplexityExplanation: string;
  spaceComplexityExplanation: string;
  proTips: string[];
}

// ── Code Doctor ────────────────────────────────

export interface CodeCheckBug {
  lineNumber?: number;
  issueType: 'syntax' | 'runtime' | 'logic' | 'edge-case' | 'complexity';
  title: string;
  explanation: string;
  problematicSnippet?: string;
  fixedSnippet?: string;
}

export interface CodeCheckResult {
  status: 'clean' | 'issues_found';
  summary: string;
  /** 0-100, or null if the model did not score it. */
  overallScore: number | null;
  timeComplexity: string;
  spaceComplexity: string;
  bugs: CodeCheckBug[];
  /** Empty string means no change was suggested. */
  fixedFullCode: string;
  learningAdvice: string;
}
