'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DSA_PRESETS } from '@/lib/presets';
import { ProgrammingLanguage } from '@/lib/types';
import {
  Play,
  Upload,
  FileCode,
  FileText,
  Sparkles,
  Code2
} from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-950 rounded-xl text-slate-500 font-mono text-xs">
      Loading Code Editor...
    </div>
  ),
});

interface CodeEditorProps {
  code: string;
  setCode: (c: string) => void;
  problemText: string;
  setProblemText: (p: string) => void;
  language: ProgrammingLanguage;
  setLanguage: (lang: ProgrammingLanguage) => void;
  onRunTrace: () => void;
  isTracing: boolean;
  statusMessage: string;
}

export default function CodeEditor({
  code,
  setCode,
  problemText,
  setProblemText,
  language,
  setLanguage,
  onRunTrace,
  isTracing,
  statusMessage,
}: CodeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DSA_PRESETS[0].id);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const selected = DSA_PRESETS.find((p) => p.id === presetId);
    if (selected) {
      setProblemText(selected.description);
      const codeForLang = selected.codeByLanguage?.[language] || selected.defaultCode;
      setCode(codeForLang);
    }
  };

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    const selected = DSA_PRESETS.find((p) => p.id === selectedPresetId);
    if (selected && selected.codeByLanguage?.[newLang]) {
      setCode(selected.codeByLanguage[newLang]!);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (
        file.name.endsWith('.py') ||
        file.name.endsWith('.java') ||
        file.name.endsWith('.cpp') ||
        file.name.endsWith('.js')
      ) {
        setCode(content);
      } else {
        setProblemText(content);
      }
    };
    reader.readAsText(file);
  };

  // Map to Monaco language IDs
  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Problem Description Input */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Problem Statement &amp; Constraints
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Custom Problem</option>
              {DSA_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          value={problemText}
          onChange={(e) => {
            setProblemText(e.target.value);
            setSelectedPresetId('');
          }}
          placeholder="Paste problem description, input/output samples, or import .md file..."
          rows={3}
          className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans resize-y"
        />

        <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.py,.java,.cpp,.js"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-indigo-400 transition flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-300"
              title="Import file (.txt, .md, .py, .java, .cpp, .js)"
            >
              <Upload className="w-3 h-3" />
              <span>Import File</span>
            </button>
          </div>
          <span className="text-[10px] text-slate-500">Supports Raw Text and Markdown</span>
        </div>
      </div>

      {/* 2. Monaco Code Editor & Language Switcher */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm flex-1 flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            
            {/* Language Selector Dropdown */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="cpp">C++ (STL)</option>
              <option value="javascript">JavaScript (ES6)</option>
            </select>
          </div>

          <button
            onClick={onRunTrace}
            disabled={isTracing}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            title={language === 'python' ? 'Trace Python execution' : 'Visual execution engine runs Python code'}
          >
            {isTracing ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Tracing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code &amp; Trace</span>
              </>
            )}
          </button>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
          <Editor
            height="100%"
            language={monacoLanguage}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12.5,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          />
        </div>

        {statusMessage && (
          <div className="mt-2 text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

    </div>
  );
}
