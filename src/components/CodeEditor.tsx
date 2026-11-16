'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { findPreset, looksLikeProblemReference } from '@/lib/presets';
import { ProgrammingLanguage } from '@/lib/types';
import { Play, Upload, FilePlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProblemPicker, { DifficultyChip } from './ProblemPicker';
import { useTheme } from './Providers';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[300px] flex items-center justify-center text-fg-subtle text-sm">Loading editor...</div>,
});

const EXT_TO_LANG: Record<string, ProgrammingLanguage> = { py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', js: 'javascript' };

interface CodeEditorProps {
  code: string;
  setCode: (c: string) => void;
  problemText: string;
  setProblemText: (p: string) => void;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage, importedCode?: string) => void;
  presetId: string;
  onSelectPreset: (presetId: string) => void;
  onNewProblem: () => void;
  onResetCode: () => void;
  onLoadSolution: () => void;
  onLookupProblem: () => void;
  isLookingUp: boolean;
  onRunTrace: () => void;
  isTracing: boolean;
  statusMessage: string;
  onCheckCode: () => void;
  isCheckingCode: boolean;
}

export default function CodeEditor(props: CodeEditorProps) {
  const {
    code,
    setCode,
    problemText,
    setProblemText,
    language,
    onLanguageChange,
    presetId,
    onSelectPreset,
    onNewProblem,
    onResetCode,
    onLoadSolution,
    onLookupProblem,
    isLookingUp,
    onRunTrace,
    isTracing,
    statusMessage,
    onCheckCode,
    isCheckingCode,
  } = props;
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPython = language === 'python';
  const preset = findPreset(presetId);
  const isReference = !preset && looksLikeProblemReference(problemText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 200_000) {
      toast.error('File is too large (max 200 KB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const lang = EXT_TO_LANG[file.name.split('.').pop()?.toLowerCase() || ''];
      if (lang) {
        onLanguageChange(lang, content);
        toast.success(`Imported code from ${file.name}`);
      } else {
        setProblemText(content);
        toast.success(`Imported problem from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Problem */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-fg">Problem</h2>
            {preset && <DifficultyChip difficulty={preset.difficulty} />}
            {preset && <span className="chip bg-surface-2 text-fg-muted">{preset.pattern}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <ProblemPicker presetId={presetId} onSelect={onSelectPreset} />
            <button onClick={onNewProblem} className="btn-ghost btn-sm" title="Start your own problem">
              <FilePlus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>

        <textarea
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder={'Paste the full problem statement (description, examples, constraints),\nor just type its name or number, e.g. "LeetCode 42" or "Trapping Rain Water".'}
          rows={6}
          className="input resize-y leading-relaxed"
        />

        {isReference && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-accent/10 px-3 py-2 text-sm">
            <span className="text-fg">This looks like a problem name or number. Load the full statement first so the AI works on the right problem.</span>
            <button onClick={onLookupProblem} disabled={isLookingUp} className="btn-primary btn-sm shrink-0">
              <Search className="w-3.5 h-3.5" /> {isLookingUp ? 'Looking up...' : 'Look up'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-2 text-xs text-fg-subtle">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.md,.py,.java,.cpp,.cc,.js" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost btn-sm -ml-2">
            <Upload className="w-3.5 h-3.5" /> Import file
          </button>
          {preset && (
            <button onClick={onLoadSolution} className="btn-ghost btn-sm" title="Load the reference solution in Python, e.g. to step through it in the Debugger">
              Load solution (Python)
            </button>
          )}
        </div>
      </section>

      {/* Code */}
      <section className="card p-4 flex-1 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as ProgrammingLanguage)}
              className="input w-auto py-1 pr-8 text-sm font-medium cursor-pointer"
              aria-label="Programming language"
            >
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button onClick={onResetCode} className="btn-ghost btn-sm" title="Replace the code with the starter code">
              Reset
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={onCheckCode} disabled={isCheckingCode} className="btn-secondary btn-sm" title="AI reviews your code for bugs and missed edge cases">
              {isCheckingCode ? 'Checking...' : 'Check & Fix'}
            </button>
            <button
              onClick={onRunTrace}
              disabled={isTracing || !isPython}
              className="btn-primary btn-sm"
              title={isPython ? 'Run the code and step through it line by line' : 'The Debugger runs Python only'}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {isTracing ? 'Running...' : 'Run & Trace'}
            </button>
          </div>
        </div>

        {!isPython && (
          <p className="mb-2 text-xs text-fg-muted">
            Run &amp; Trace works for Python only. Check &amp; Fix, How to Think and Interview Prep work in every language.
          </p>
        )}

        <div className="flex-1 w-full rounded-lg overflow-hidden border border-border">
          <Editor
            height="100%"
            language={language}
            theme={theme === 'dark' ? 'algobuddy-dark' : 'algobuddy-light'}
            beforeMount={(monaco) => {
              // Match the editor background to the app's card surface in both themes.
              monaco.editor.defineTheme('algobuddy-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#161b22' } });
              monaco.editor.defineTheme('algobuddy-light', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ffffff' } });
            }}
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 10, bottom: 10 },
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          />
        </div>

        {statusMessage && <p className="mt-2 text-xs text-fg-muted">{statusMessage}</p>}
      </section>
    </div>
  );
}
