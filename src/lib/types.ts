/**
 * AlgoBuddy - Core Type Definitions
 * Professional type definitions for execution tracing, AI analysis, notes, and multi-language settings.
 */

// ==========================================
// PROGRAMMING LANGUAGES & PROVIDERS
// ==========================================

export type ProgrammingLanguage = 'python' | 'java' | 'cpp' | 'javascript';

export type AIProvider = 'gemini' | 'groq' | 'openai';

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// ==========================================
// PERSONAL NOTES SYSTEM
// ==========================================

export interface ProblemNote {
  id: string;
  problemTitle: string;
  content: string;
  language: ProgrammingLanguage;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 1. PYTHON DRY RUN TRACE TYPES
// ==========================================

export interface VariableSnapshot {
  name: string;
  value: string;
  type: string;
  isChanged?: boolean;
}

export interface StackFrame {
  functionName: string;
  lineNumber: number;
  filename: string;
}

export interface TraceStep {
  stepIndex: number;
  lineNumber: number;
  event: 'line' | 'call' | 'return';
  functionName: string;
  variables: Record<string, string>;
  changedVariables: string[];
  callStack: StackFrame[];
  stdoutSoFar: string;
  loopInfo?: {
    isLoopHeader: boolean;
    iteration?: number;
    totalIterationsEstimate?: number;
  };
}

export interface TraceResult {
  success: boolean;
  steps: TraceStep[];
  totalSteps: number;
  stdout: string;
  error?: string;
  executionTimeMs: number;
  lineHitCounts: Record<number, number>;
}

// ==========================================
// 2. THINKING GUIDE TYPES
// ==========================================

export interface ProgressiveHint {
  level: number;
  title: string;
  content: string;
  revealed: boolean;
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
  recognizedPatterns: {
    patternName: string;
    whyThisPattern: string;
  }[];
  approaches?: ProblemApproach[];
  bruteForce: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    drawback: string;
  };
  optimizedApproach: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    keyIntuition: string;
  };
  implementationBlueprint?: ImplementationBlueprint;
  edgeCases: string[];
  hints: ProgressiveHint[];
}

// ==========================================
// 3. INTERVIEW SCRIPT TYPES
// ==========================================

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

// ==========================================
// 4. PRESETS & INPUT TYPES
// ==========================================

export interface DsaPreset {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  defaultCode: string;
  codeByLanguage?: Partial<Record<ProgrammingLanguage, string>>;
}
