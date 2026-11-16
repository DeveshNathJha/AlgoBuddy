'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CodeEditor from '@/components/CodeEditor';
import DryRunVisualizer from '@/components/DryRunVisualizer';
import ThinkingGuideView from '@/components/ThinkingGuideView';
import InterviewScriptView from '@/components/InterviewScriptView';
import NotesView from '@/components/NotesView';
import ApiKeyModal from '@/components/ApiKeyModal';
import GmailAuthModal from '@/components/GmailAuthModal';
import { runPythonWithTrace } from '@/lib/pyodideRunner';
import {
  TraceResult,
  ThinkingGuideData,
  InterviewScriptData,
  AIProvider,
  ProgrammingLanguage
} from '@/lib/types';
import { DSA_PRESETS } from '@/lib/presets';
import { toast } from 'sonner';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'thinking' | 'visualizer' | 'interview' | 'notes'>('visualizer');

  // Multi-Language State
  const [language, setLanguage] = useState<ProgrammingLanguage>('python');

  // Input states
  const [problemText, setProblemText] = useState<string>(DSA_PRESETS[0].description);
  const [code, setCode] = useState<string>(DSA_PRESETS[0].defaultCode);
  const [problemTitle, setProblemTitle] = useState<string>(DSA_PRESETS[0].title);

  // Pyodide Execution Trace state
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // AI Analysis States
  const [thinkingData, setThinkingData] = useState<ThinkingGuideData | null>(null);
  const [isThinkingLoading, setIsThinkingLoading] = useState<boolean>(false);
  const [interviewData, setInterviewData] = useState<InterviewScriptData | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState<boolean>(false);

  // Multi-Provider & BYOK States
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    gemini: '',
    groq: '',
    openai: '',
  });
  const [selectedModels, setSelectedModels] = useState<Record<AIProvider, string>>({
    gemini: 'gemini-1.5-flash',
    groq: 'openai/gpt-oss-20b',
    openai: 'gpt-4o-mini',
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  // Auth & 2-Free Quota States
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [freeQuestionsUsed, setFreeQuestionsUsed] = useState<number>(0);

  // Restore saved credentials & preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('algobuddy_language') as ProgrammingLanguage) || 'python';
      const savedProvider = (localStorage.getItem('algobuddy_provider') as AIProvider) || 'gemini';
      const geminiKey = localStorage.getItem('algobuddy_key_gemini') || localStorage.getItem('coding_buddy_gemini_key') || '';
      const groqKey = localStorage.getItem('algobuddy_key_groq') || '';
      const openaiKey = localStorage.getItem('algobuddy_key_openai') || '';

      const geminiModel = localStorage.getItem('algobuddy_model_gemini') || 'gemini-1.5-flash';
      const groqModel = localStorage.getItem('algobuddy_model_groq') || 'openai/gpt-oss-20b';
      const openaiModel = localStorage.getItem('algobuddy_model_openai') || 'gpt-4o-mini';

      let savedEmail = localStorage.getItem('algobuddy_user_email') || localStorage.getItem('coding_buddy_user_email');
      // Clean up legacy test mock email
      if (savedEmail === 'engineer@domain.com') {
        localStorage.removeItem('algobuddy_user_email');
        localStorage.removeItem('coding_buddy_user_email');
        savedEmail = null;
      }
      const savedUsed = parseInt(localStorage.getItem('algobuddy_free_used') || localStorage.getItem('coding_buddy_free_used') || '0', 10);

      setLanguage(savedLang);
      setActiveProvider(savedProvider);
      setApiKeys({
        gemini: geminiKey,
        groq: groqKey,
        openai: openaiKey,
      });
      setSelectedModels({
        gemini: geminiModel,
        groq: groqModel,
        openai: openaiModel,
      });
      setUserEmail(savedEmail);
      setFreeQuestionsUsed(savedUsed);
    }
  }, []);

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('algobuddy_language', newLang);
    toast.info(`Language switched to ${newLang.toUpperCase()}`);
  };

  const handleSaveKeys = (provider: AIProvider, key: string, model: string) => {
    const updatedKeys = { ...apiKeys, [provider]: key };
    const updatedModels = { ...selectedModels, [provider]: model };
    setApiKeys(updatedKeys);
    setSelectedModels(updatedModels);

    localStorage.setItem(`algobuddy_key_${provider}`, key);
    localStorage.setItem(`algobuddy_model_${provider}`, model);
    localStorage.setItem('algobuddy_provider', provider);
    toast.success(`${provider.toUpperCase()} credentials saved securely.`);
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('algobuddy_user_email', email);
    toast.success(`Signed in as ${email}`);
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem('algobuddy_user_email');
    toast.info('Signed out successfully.');
  };

  const activeKey = apiKeys[activeProvider] || '';
  const activeModel = selectedModels[activeProvider];

  // 2 Free Starter Questions Gatekeeper
  const checkAccessPermission = (): boolean => {
    if (!userEmail) {
      setIsAuthModalOpen(true);
      toast.info('Please sign in with your Google account to proceed.');
      return false;
    }

    if (freeQuestionsUsed >= 2 && !activeKey) {
      setIsKeyModalOpen(true);
      toast.warning(
        `Your 2 complimentary questions are complete! Please configure your free ${activeProvider.toUpperCase()} API key in Settings.`
      );
      return false;
    }

    return true;
  };

  const recordQuestionUsage = () => {
    if (!activeKey) {
      const updated = freeQuestionsUsed + 1;
      setFreeQuestionsUsed(updated);
      localStorage.setItem('algobuddy_free_used', updated.toString());
      if (userEmail) {
        fetch('/api/auth/record-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        }).catch((err) => console.error('Failed to sync quota to server', err));
      }
    }
  };

  // 1. Run Python Code & Trace (Pyodide WebAssembly)
  const handleRunTrace = async () => {
    if (!code || !code.trim()) {
      toast.warning('Please write or paste Python code to trace.');
      return;
    }

    if (language !== 'python') {
      toast.info('Interactive line-by-line visual tracing engine runs Python code.');
    }

    setIsTracing(true);
    setStatusMessage('Initializing sandboxed Python WebAssembly environment...');
    setActiveTab('visualizer');

    try {
      const result = await runPythonWithTrace(code, (status) => {
        setStatusMessage(status);
      });

      setTraceResult(result);

      if (!result.success) {
        setStatusMessage(`Execution Error: ${result.error}`);
        toast.error(`Execution error: ${result.error}`);
      } else {
        setStatusMessage(`Trace complete: ${result.totalSteps} steps recorded in ${result.executionTimeMs}ms.`);
        toast.success(`Recorded ${result.totalSteps} execution steps.`);
      }
    } catch (err: any) {
      setStatusMessage(`Trace failed: ${err.message}`);
      toast.error(`Trace failed: ${err.message}`);
    } finally {
      setIsTracing(false);
    }
  };

  // 2. Generate Thinking Guide
  const handleGenerateThinking = async () => {
    if (!problemText || !problemText.trim()) {
      toast.warning('Please enter a problem description first.');
      return;
    }

    if (!checkAccessPermission()) return;

    setIsThinkingLoading(true);
    try {
      const res = await fetch('/api/ai/thinking-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText,
          codeSnippet: code,
          provider: activeProvider,
          userApiKey: activeKey || undefined,
          model: activeModel,
          language,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setThinkingData(resData.data);
        recordQuestionUsage();
        toast.success('Algorithmic Thinking Guide ready!');
      } else {
        if (resData.requiresKey) {
          setIsKeyModalOpen(true);
        }
        toast.error(resData.error || 'Failed to generate thinking guide.');
      }
    } catch (e: any) {
      toast.error('Network error: ' + e.message);
    } finally {
      setIsThinkingLoading(false);
    }
  };

  // 3. Generate Interview Script
  const handleGenerateInterview = async () => {
    if (!problemText || !problemText.trim()) {
      toast.warning('Please enter a problem description first.');
      return;
    }

    if (!checkAccessPermission()) return;

    setIsInterviewLoading(true);
    try {
      const res = await fetch('/api/ai/interview-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText,
          codeSnippet: code,
          provider: activeProvider,
          userApiKey: activeKey || undefined,
          model: activeModel,
          language,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setInterviewData(resData.data);
        recordQuestionUsage();
        toast.success('Interview Presentation Script ready!');
      } else {
        if (resData.requiresKey) {
          setIsKeyModalOpen(true);
        }
        toast.error(resData.error || 'Failed to generate interview script.');
      }
    } catch (e: any) {
      toast.error('Network error: ' + e.message);
    } finally {
      setIsInterviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProvider={activeProvider}
        hasActiveKey={!!activeKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        userEmail={userEmail}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        freeQuestionsUsed={freeQuestionsUsed}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Code & Problem Input */}
        <div className="lg:col-span-5 h-[calc(100vh-7rem)] flex flex-col">
          <CodeEditor
            code={code}
            setCode={setCode}
            problemText={problemText}
            setProblemText={(txt) => {
              setProblemText(txt);
              // Extract first line as title candidate
              const firstLine = txt.trim().split('\n')[0].replace(/^#+\s*/, '').substring(0, 40);
              setProblemTitle(firstLine || 'Custom Problem');
            }}
            language={language}
            setLanguage={handleLanguageChange}
            onRunTrace={handleRunTrace}
            isTracing={isTracing}
            statusMessage={statusMessage}
          />
        </div>

        {/* Right Column: Active Perspective */}
        <div className="lg:col-span-7 h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          {activeTab === 'thinking' && (
            <ThinkingGuideView
              data={thinkingData}
              isLoading={isThinkingLoading}
              onGenerate={handleGenerateThinking}
            />
          )}

          {activeTab === 'visualizer' && (
            <DryRunVisualizer
              traceResult={traceResult}
              code={code}
              provider={activeProvider}
              userApiKey={activeKey}
            />
          )}

          {activeTab === 'interview' && (
            <InterviewScriptView
              data={interviewData}
              isLoading={isInterviewLoading}
              onGenerate={handleGenerateInterview}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              currentProblemTitle={problemTitle}
              currentLanguage={language}
              userEmail={userEmail}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLoadProblem={(title) => {
                const found = DSA_PRESETS.find((p) => p.title.toLowerCase().includes(title.toLowerCase()));
                if (found) {
                  setProblemText(found.description);
                  setCode(found.codeByLanguage?.[language] || found.defaultCode);
                  setProblemTitle(found.title);
                }
              }}
            />
          )}
        </div>

      </main>

      {/* Provider & Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        provider={activeProvider}
        setProvider={(p) => {
          setActiveProvider(p);
          localStorage.setItem('algobuddy_provider', p);
        }}
        apiKeys={apiKeys}
        selectedModels={selectedModels}
        onSaveKeys={handleSaveKeys}
      />

      {/* Google Authentication Modal */}
      <GmailAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userEmail={userEmail}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

    </div>
  );
}
