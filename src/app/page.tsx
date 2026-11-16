'use client';

import { useCallback, useEffect, useState } from 'react';
import Navbar, { AppTab } from '@/components/Navbar';
import CodeEditor from '@/components/CodeEditor';
import DryRunVisualizer, { ExplainStepPayload, StepExplanation } from '@/components/DryRunVisualizer';
import ThinkingGuideView from '@/components/ThinkingGuideView';
import InterviewScriptView from '@/components/InterviewScriptView';
import NotesView from '@/components/NotesView';
import ApiKeyModal from '@/components/ApiKeyModal';
import GmailAuthModal from '@/components/GmailAuthModal';
import CodeDoctorModal from '@/components/CodeDoctorModal';
import AboutModal from '@/components/AboutModal';
import type { SignInMethods } from '@/lib/signInMethods';
import { runPythonWithTrace } from '@/lib/pyodideRunner';
import {
  TraceResult,
  ThinkingGuideData,
  InterviewScriptData,
  AIProvider,
  ProgrammingLanguage,
  CodeCheckResult,
  FreeQuota,
  ProblemNote,
} from '@/lib/types';
import {
  DSA_PRESETS,
  buildPythonSolution,
  buildStarterCode,
  findPreset,
  getStarterTemplate,
  isBoilerplateCode,
  isStarterTemplate,
  looksLikeProblemReference,
  matchPresetReference,
} from '@/lib/presets';
import { FREE_AI_REQUEST_LIMIT, PROVIDER_MODELS, RETIRED_MODELS, languageLabel } from '@/lib/config';
import type { ResolvedProblem } from '@/lib/aiClient';
import { toast } from 'sonner';

const LS = {
  language: 'algobuddy_language',
  provider: 'algobuddy_provider',
  problem: 'algobuddy_active_problem',
  code: 'algobuddy_active_code',
  preset: 'algobuddy_preset_id',
  key: (p: AIProvider) => `algobuddy_key_${p}`,
  model: (p: AIProvider) => `algobuddy_model_${p}`,
};

const PROVIDERS: AIProvider[] = ['gemini', 'groq', 'openai'];
const LANGUAGES: ProgrammingLanguage[] = ['python', 'java', 'cpp', 'javascript'];
const DEFAULT_PRESET = DSA_PRESETS[0];

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked: not fatal */
  }
}

function deriveTitle(problemText: string, presetId: string): string {
  const preset = findPreset(presetId);
  if (preset) return `#${preset.leetcode} ${preset.title}`;
  const firstLine = problemText.split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).find(Boolean) || '';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine || 'Untitled problem';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('thinking');

  // Workspace
  const [language, setLanguage] = useState<ProgrammingLanguage>('python');
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET.id);
  const [problemText, setProblemText] = useState<string>(DEFAULT_PRESET.description);
  const [code, setCode] = useState<string>(buildStarterCode(DEFAULT_PRESET, 'python'));
  const problemTitle = deriveTitle(problemText, presetId);

  // Debugger
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // AI results remember the input they were generated for, to flag stale results.
  const [thinking, setThinking] = useState<{ data: ThinkingGuideData; forProblem: string } | null>(null);
  const [isThinkingLoading, setIsThinkingLoading] = useState(false);
  const [interview, setInterview] = useState<{ data: InterviewScriptData; forKey: string } | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [codeDoctorResult, setCodeDoctorResult] = useState<CodeCheckResult | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Provider / own key
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({ gemini: '', groq: '', openai: '' });
  const [selectedModels, setSelectedModels] = useState<Record<AIProvider, string>>({
    gemini: PROVIDER_MODELS.gemini.defaultModel,
    groq: PROVIDER_MODELS.groq.defaultModel,
    openai: PROVIDER_MODELS.openai.defaultModel,
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Auth + free quota (the server is the source of truth)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [quota, setQuota] = useState<FreeQuota>({ used: 0, limit: FREE_AI_REQUEST_LIMIT });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [signInMethods, setSignInMethods] = useState<SignInMethods | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const activeKey = apiKeys[activeProvider] || '';
  const activeModel = selectedModels[activeProvider];

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await res.json();
      setUserEmail(data.email || null);
      if (data.quota) setQuota(data.quota);
      if (data.signIn) setSignInMethods(data.signIn);
    } catch {
      /* offline: keep current state */
    }
  }, []);

  // Restore workspace + settings
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LS.language) as ProgrammingLanguage | null;
      if (savedLang && LANGUAGES.includes(savedLang)) setLanguage(savedLang);

      const savedProvider = localStorage.getItem(LS.provider) as AIProvider | null;
      if (savedProvider && PROVIDERS.includes(savedProvider)) setActiveProvider(savedProvider);

      const keys = { gemini: '', groq: '', openai: '' } as Record<AIProvider, string>;
      const models = {} as Record<AIProvider, string>;
      for (const p of PROVIDERS) {
        keys[p] = localStorage.getItem(LS.key(p)) || '';
        const m = localStorage.getItem(LS.model(p));
        models[p] = m && !RETIRED_MODELS.has(m) ? m : PROVIDER_MODELS[p].defaultModel; // migrate shut-down models
      }
      setApiKeys(keys);
      setSelectedModels(models);

      const savedProblem = localStorage.getItem(LS.problem);
      const savedCode = localStorage.getItem(LS.code);
      const savedPreset = localStorage.getItem(LS.preset);
      if (savedProblem !== null) setProblemText(savedProblem);
      if (savedCode !== null) setCode(savedCode);
      else if (savedLang && LANGUAGES.includes(savedLang)) setCode(buildStarterCode(DEFAULT_PRESET, savedLang));
      if (savedPreset !== null) setPresetId(findPreset(savedPreset) ? savedPreset : '');

      // Old builds kept the email and free count in localStorage, where anyone could edit them.
      ['algobuddy_user_email', 'algobuddy_free_used', 'coding_buddy_user_email', 'coding_buddy_free_used', 'coding_buddy_gemini_key'].forEach((k) =>
        localStorage.removeItem(k)
      );
    } catch {
      /* storage blocked */
    }
    refreshSession();
  }, [refreshSession]);

  // ── Workspace ───────────────────────────────────

  const updateCode = (newCode: string) => {
    setCode(newCode);
    store(LS.code, newCode);
    setStatusMessage(''); // the last run's status no longer describes this code
  };

  const setProblem = (text: string, id: string) => {
    setProblemText(text);
    store(LS.problem, text);
    setPresetId(id);
    store(LS.preset, id);
  };

  const confirmDiscardCode = (action: string) => isBoilerplateCode(code) || window.confirm(`${action} will replace the code in the editor. Continue?`);

  const handleProblemChange = (text: string) => {
    const preset = findPreset(presetId);
    setProblem(text, preset && text === preset.description ? presetId : '');
  };

  const loadPreset = (id: string, { askFirst = true } = {}) => {
    const preset = findPreset(id);
    if (!preset) return;
    if (askFirst && !confirmDiscardCode('Opening this problem')) return;
    setProblem(preset.description, id);
    if (isBoilerplateCode(code) || askFirst) updateCode(buildStarterCode(preset, language));
    setTraceResult(null);
  };

  const handleNewProblem = () => {
    if (!confirmDiscardCode('Starting a new problem')) return;
    setProblem('', '');
    updateCode(getStarterTemplate(language));
    setTraceResult(null);
    setStatusMessage('');
  };

  const handleResetCode = () => {
    if (!confirmDiscardCode('Resetting')) return;
    const preset = findPreset(presetId);
    updateCode(preset ? buildStarterCode(preset, language) : getStarterTemplate(language));
  };

  const handleLoadSolution = () => {
    const preset = findPreset(presetId);
    if (!preset || !confirmDiscardCode('Loading the solution')) return;
    if (language !== 'python') {
      setLanguage('python');
      store(LS.language, 'python');
      toast.info('The reference solution is in Python, so the language was switched to Python 3.');
    }
    updateCode(buildPythonSolution(preset));
  };

  const handleLanguageChange = (newLang: ProgrammingLanguage, importedCode?: string) => {
    const preset = findPreset(presetId);
    setLanguage(newLang);
    store(LS.language, newLang);

    if (importedCode !== undefined) {
      updateCode(importedCode);
    } else if (isBoilerplateCode(code)) {
      // Untouched starter or solution: replace it with the starter in the new language.
      updateCode(preset ? buildStarterCode(preset, newLang) : getStarterTemplate(newLang));
    } else if (newLang !== language) {
      toast.info(`Switched to ${languageLabel(newLang)}. Your code was kept. Click Reset for ${languageLabel(newLang)} starter code.`);
    }
  };

  // ── Settings / auth ─────────────────────────────

  const handleSaveKeys = (provider: AIProvider, key: string, model: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }));
    setSelectedModels((prev) => ({ ...prev, [provider]: model }));
    setActiveProvider(provider);
    store(LS.key(provider), key);
    store(LS.model(provider), model);
    store(LS.provider, provider);
    toast.success(key ? 'API key saved in this browser.' : 'API key removed.');
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    refreshSession();
    toast.success(`Signed in as ${email}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    setUserEmail(null);
    setQuota({ used: 0, limit: FREE_AI_REQUEST_LIMIT });
    toast.info('Signed out.');
  };

  // ── AI calls ────────────────────────────────────

  /** Shared AI request. The client gate is for UX only; the server enforces the real limits. */
  const callAI = async <T,>(endpoint: string, payload: Record<string, unknown>): Promise<T | null> => {
    if (!activeKey) {
      if (!userEmail) {
        setIsAuthModalOpen(true);
        toast.info(`Sign in to get ${quota.limit} free AI requests, or add your own free API key.`);
        return null;
      }
      if (quota.used >= quota.limit) {
        setIsKeyModalOpen(true);
        toast.warning(`You have used all ${quota.limit} free requests. Add your own free API key to continue.`);
        return null;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, provider: activeProvider, userApiKey: activeKey || undefined, model: activeModel, language }),
      });

      let resData: any;
      try {
        resData = await res.json();
      } catch {
        // Vercel returns an HTML page (not JSON) on function timeouts and crashes.
        console.error(`[AlgoBuddy] ${endpoint} returned non-JSON (HTTP ${res.status})`);
        toast.error(res.status === 504 ? 'The AI took too long to respond. Please try again.' : 'AlgoBuddy had a problem on its side. Please try again in a moment.');
        return null;
      }

      if (resData.quota) setQuota(resData.quota);
      if (resData.success) return resData.data as T;

      if (resData.requiresAuth) {
        setUserEmail(null);
        setIsAuthModalOpen(true);
      } else if (resData.requiresKey) {
        setIsKeyModalOpen(true);
      }
      toast.error(resData.error || 'Request failed.');
      return null;
    } catch (e) {
      console.error(`[AlgoBuddy] ${endpoint} request failed:`, e);
      toast.error('Could not reach AlgoBuddy. Check your internet connection and try again.');
      return null;
    }
  };

  /**
   * If the box holds only a name/number ("LeetCode 42"), turn it into a full
   * statement first: from the built-in library when possible (free), otherwise
   * via the AI lookup. Returns the statement to use, or null to abort.
   */
  const ensureFullProblem = async (): Promise<string | null> => {
    const text = problemText.trim();
    if (!text) {
      toast.warning('Enter a problem first: paste the statement, or type its name or number.');
      return null;
    }
    if (findPreset(presetId) || !looksLikeProblemReference(text)) return problemText;

    const local = matchPresetReference(text);
    if (local) {
      loadPreset(local.id, { askFirst: false });
      toast.success(`Loaded #${local.leetcode} ${local.title} from the problem library.`);
      return local.description;
    }

    setIsLookingUp(true);
    const found = await callAI<ResolvedProblem>('/api/ai/resolve-problem', { reference: text });
    setIsLookingUp(false);
    if (!found) return null;
    if (!found.found) {
      toast.error(found.message);
      return null;
    }
    setProblem(found.statement, '');
    const label = `${found.leetcodeNumber ? `#${found.leetcodeNumber} ` : ''}${found.title}`;
    if (found.confident) toast.success(`Found: ${label}. The full statement is now in the problem box.`);
    else toast.warning(`Best guess: ${label}. Please check the statement is the problem you meant.`, { duration: 8000 });
    return found.statement;
  };

  const handleLookupProblem = async () => {
    await ensureFullProblem();
  };

  const handleGenerateThinking = async () => {
    const statement = await ensureFullProblem();
    if (!statement) return;
    setIsThinkingLoading(true);
    const data = await callAI<ThinkingGuideData>('/api/ai/thinking-guide', {
      problemText: statement,
      // Starter code or a reference solution is not "the student's code", so it must not steer the hints.
      codeSnippet: isBoilerplateCode(code) ? '' : code,
    });
    if (data) setThinking({ data, forProblem: statement });
    setIsThinkingLoading(false);
  };

  const handleGenerateInterview = async () => {
    const statement = await ensureFullProblem();
    if (!statement) return;
    setIsInterviewLoading(true);
    const data = await callAI<InterviewScriptData>('/api/ai/interview-script', {
      problemText: statement,
      codeSnippet: isStarterTemplate(code) ? '' : code,
    });
    if (data) setInterview({ data, forKey: `${statement}\u0000${code}` });
    setIsInterviewLoading(false);
  };

  const handleCheckCode = async () => {
    if (!code.trim() || isStarterTemplate(code)) {
      toast.warning('Write your solution first, then Check & Fix will review it.');
      return;
    }
    const statement = await ensureFullProblem();
    if (statement === null) return;
    const traceError = traceResult && traceResult.sourceCode === code && traceResult.error && !traceResult.truncated ? traceResult.error : undefined;
    setCodeDoctorResult(null);
    setIsCheckingCode(true);
    setIsDoctorModalOpen(true);
    const data = await callAI<CodeCheckResult>('/api/ai/check-code', { problemText: statement, code, errorOutput: traceError });
    setIsCheckingCode(false);
    if (data) setCodeDoctorResult(data);
    else setIsDoctorModalOpen(false);
  };

  const handleExplainStep = (payload: ExplainStepPayload) => callAI<StepExplanation>('/api/ai/explain-step', { ...payload });

  // ── Debugger ────────────────────────────────────

  const runTrace = async (source: string) => {
    setIsTracing(true);
    setActiveTab('visualizer');
    try {
      const result = await runPythonWithTrace(source, setStatusMessage);
      setTraceResult(result);
      if (result.success) {
        setStatusMessage(`Recorded ${result.totalSteps} steps in ${result.executionTimeMs} ms.`);
      } else if (result.truncated) {
        setStatusMessage(`Stopped after ${result.totalSteps} steps.`);
      } else {
        setStatusMessage(result.errorLine ? `Your code stopped with an error on line ${result.errorLine}.` : 'Your code stopped with an error.');
      }
    } finally {
      setIsTracing(false);
    }
  };

  const handleRunTrace = () => {
    if (language !== 'python') {
      toast.info('The Debugger runs Python only. Switch the language to Python 3.');
      return;
    }
    if (!code.trim()) {
      toast.warning('Write some Python code to trace.');
      return;
    }
    runTrace(code);
  };

  /** Empty-state shortcut: load the reference solution and step through it. */
  const handleTryDemo = () => {
    const preset = findPreset(presetId) || DEFAULT_PRESET;
    if (!confirmDiscardCode('Loading the demo')) return;
    if (!findPreset(presetId)) setProblem(preset.description, preset.id);
    setLanguage('python');
    store(LS.language, 'python');
    const solution = buildPythonSolution(preset);
    updateCode(solution);
    runTrace(solution);
  };

  const handleOpenNoteProblem = (note: ProblemNote) => {
    if (!note.problemText) {
      toast.info('This note was saved by an older version, so the problem statement was not stored with it.');
      return;
    }
    const preset = DSA_PRESETS.find((p) => p.description === note.problemText);
    setProblem(note.problemText, preset?.id || '');
    if (preset && isBoilerplateCode(code)) updateCode(buildStarterCode(preset, language));
    toast.success(`Opened: ${note.problemTitle}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProvider={activeProvider}
        hasActiveKey={!!activeKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        userEmail={userEmail}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        quota={quota}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 min-h-[680px] lg:h-[calc(100vh-6.5rem)] flex flex-col">
          <CodeEditor
            code={code}
            setCode={updateCode}
            problemText={problemText}
            setProblemText={handleProblemChange}
            language={language}
            onLanguageChange={handleLanguageChange}
            presetId={presetId}
            onSelectPreset={(id) => loadPreset(id)}
            onNewProblem={handleNewProblem}
            onResetCode={handleResetCode}
            onLoadSolution={handleLoadSolution}
            onLookupProblem={handleLookupProblem}
            isLookingUp={isLookingUp}
            onRunTrace={handleRunTrace}
            isTracing={isTracing}
            statusMessage={statusMessage}
            onCheckCode={handleCheckCode}
            isCheckingCode={isCheckingCode}
          />
        </div>

        <div className="lg:col-span-7 lg:h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-1">
          {/* Views stay mounted (just hidden) so revealed hints, the chosen approach and the debugger step survive tab switches. */}
          <div hidden={activeTab !== 'thinking'}>
            <ThinkingGuideView
              data={thinking?.data || null}
              isLoading={isThinkingLoading || (isLookingUp && !thinking)}
              isStale={!!thinking && thinking.forProblem !== problemText}
              onGenerate={handleGenerateThinking}
              onLoadStarterCode={(starter) => {
                if (!confirmDiscardCode('Loading the starter code')) return;
                updateCode(starter);
                toast.success('Starter code loaded into the editor.');
              }}
            />
          </div>

          <div hidden={activeTab !== 'visualizer'}>
            <DryRunVisualizer
              isActive={activeTab === 'visualizer'}
              traceResult={traceResult}
              isOutdated={!!traceResult && traceResult.sourceCode !== code}
              isPython={language === 'python'}
              onExplainStep={handleExplainStep}
              onDiagnose={handleCheckCode}
              onTryDemo={handleTryDemo}
              demoTitle={(findPreset(presetId) || DEFAULT_PRESET).title}
            />
          </div>

          <div hidden={activeTab !== 'interview'}>
            <InterviewScriptView
              data={interview?.data || null}
              isLoading={isInterviewLoading}
              isStale={!!interview && interview.forKey !== `${problemText}\u0000${code}`}
              onGenerate={handleGenerateInterview}
            />
          </div>

          {activeTab === 'notes' && (
            <NotesView currentProblemTitle={problemTitle} currentProblemText={problemText} currentLanguage={language} onOpenProblem={handleOpenNoteProblem} />
          )}
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 pb-6 text-xs text-fg-subtle flex flex-wrap items-center gap-x-4 gap-y-1">
        <button onClick={() => setIsAboutOpen(true)} className="hover:text-fg hover:underline">
          How AlgoBuddy uses AI and your data
        </button>
        <a href="https://github.com/DeveshNathJha/AlgoBuddy" target="_blank" rel="noreferrer" className="hover:text-fg hover:underline">
          Source on GitHub
        </a>
      </footer>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} freeLimit={quota.limit} />

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        provider={activeProvider}
        setProvider={(p) => {
          setActiveProvider(p);
          store(LS.provider, p);
        }}
        apiKeys={apiKeys}
        selectedModels={selectedModels}
        onSaveKeys={handleSaveKeys}
        freeLimit={quota.limit}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <GmailAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userEmail={userEmail}
        onLogin={handleLogin}
        onLogout={handleLogout}
        freeLimit={quota.limit}
        methods={signInMethods}
        onUseOwnKey={() => setIsKeyModalOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <CodeDoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        result={codeDoctorResult}
        isLoading={isCheckingCode}
        onApplyFix={(fixed) => {
          updateCode(fixed);
          toast.success('Fixed code is now in the editor.');
        }}
        language={languageLabel(language)}
      />
    </div>
  );
}
