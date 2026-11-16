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
  RotateCcw,
  Eraser,
  FilePlus,
  Copy,
  Stethoscope,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

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
  onCheckCode?: () => void;
  isCheckingCode?: boolean;
}

export const getStarterTemplate = (lang: ProgrammingLanguage): string => {
  switch (lang) {
    case 'python':
      return `def solution():\n    # Write your solution here\n    pass\n\n# Test execution:\nresult = solution()\nprint(result)\n`;
    case 'java':
      return `import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your solution here\n    }\n\n    public static void main(String[] args) {\n        Solution s = new Solution();\n        s.solve();\n    }\n}\n`;
    case 'cpp':
      return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your solution here\n    }\n};\n\nint main() {\n    Solution s;\n    s.solve();\n    return 0;\n}\n`;
    case 'javascript':
      return `function solution() {\n    // Write your solution here\n    return null;\n}\n\nconsole.log(solution());\n`;
    default:
      return '';
  }
};

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
  onCheckCode,
  isCheckingCode,
}: CodeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DSA_PRESETS[0].id);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) {
      // Switched to Custom Problem
      return;
    }
    const selected = DSA_PRESETS.find((p) => p.id === presetId);
    if (selected) {
      setProblemText(selected.description);
      const codeForLang = selected.codeByLanguage?.[language] || selected.defaultCode;
      setCode(codeForLang);
      toast.info(`Loaded preset: ${selected.title}`);
    }
  };

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    const selected = DSA_PRESETS.find((p) => p.id === selectedPresetId);
    if (selected && selected.codeByLanguage?.[newLang]) {
      setCode(selected.codeByLanguage[newLang]!);
    } else if (!selectedPresetId) {
      // If custom problem, offer clean template if current code is empty or from other preset
      if (!code.trim() || code.includes('def twoSum') || code.includes('class Solution')) {
        setCode(getStarterTemplate(newLang));
      }
    }
  };

  // Reset to a clean custom problem workspace
  const handleNewCustomProblem = () => {
    setSelectedPresetId('');
    setProblemText('');
    setCode(getStarterTemplate(language));
    toast.success('Clean workspace ready! Paste your custom problem & code.');
  };

  // Reset code block to language starter template
  const handleResetCode = () => {
    setCode(getStarterTemplate(language));
    toast.info(`Reset to fresh ${language.toUpperCase()} template.`);
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
        setSelectedPresetId('');
        toast.success(`Imported code from ${file.name}`);
      } else {
        setProblemText(content);
        setSelectedPresetId('');
        toast.success(`Imported problem description from ${file.name}`);
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
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Problem Statement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Custom Problem</option>
              {DSA_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>

            <button
              onClick={handleNewCustomProblem}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-[11px] px-2 border border-slate-800 bg-slate-950"
              title="Start a fresh custom problem (clears text and sets clean starter template)"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>New</span>
            </button>
          </div>
        </div>

        <textarea
          value={problemText}
          onChange={(e) => {
            setProblemText(e.target.value);
            if (selectedPresetId) {
              setSelectedPresetId('');
            }
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
          <span className="text-[10px] text-slate-500">
            {selectedPresetId ? 'Preset Active' : 'Custom Problem Active'}
          </span>
        </div>
      </div>

      {/* 2. Monaco Code Editor & Language Switcher */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm flex-1 flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 flex-wrap gap-2">
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

            {/* Reset / Clear Code button */}
            <button
              onClick={handleResetCode}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              title="Reset code editor to starter template for current language"
            >
              <Eraser className="w-3 h-3 text-slate-500" />
              <span>Reset Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onCheckCode && (
              <button
                onClick={onCheckCode}
                disabled={isCheckingCode}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Diagnose algorithmic bugs, edge case risks & view verified fix"
              >
                {isCheckingCode ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Check &amp; Fix</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onRunTrace}
              disabled={isTracing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              title={language === 'python' ? 'Trace Python execution step-by-step' : 'Visual execution engine runs Python code'}
            >
              {isTracing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Tracing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run &amp; Trace</span>
                </>
              )}
            </button>
          </div>
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
          <div className="mt-2 text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            {onCheckCode && statusMessage.toLowerCase().includes('error') && (
              <button
                onClick={onCheckCode}
                className="text-[10px] font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 px-2 py-0.5 rounded transition flex items-center gap-1"
                title="Open Code Doctor to diagnose this execution failure"
              >
                <Stethoscope className="w-3 h-3 text-rose-400" />
                <span>Diagnose with Code Doctor</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
