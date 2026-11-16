'use client';

import React, { useState } from 'react';
import { CodeCheckResult, CodeCheckBug } from '@/lib/types';
import {
  X,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Copy,
  Check,
  Wrench,
  Clock,
  Database,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Code2
} from 'lucide-react';
import { toast } from 'sonner';

interface CodeDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CodeCheckResult | null;
  isLoading: boolean;
  onApplyFix: (fixedCode: string) => void;
  language: string;
}

export default function CodeDoctorModal({
  isOpen,
  onClose,
  result,
  isLoading,
  onApplyFix,
  language,
}: CodeDoctorModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'bugs' | 'code'>('bugs');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!result?.fixedFullCode) return;
    navigator.clipboard.writeText(result.fixedFullCode);
    setCopied(true);
    toast.success('Fixed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!result?.fixedFullCode) return;
    onApplyFix(result.fixedFullCode);
    toast.success('Applied corrected code to editor!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 my-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Stethoscope className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">AlgoBuddy Code Doctor</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-mono uppercase">
                  {language}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Surgical bug diagnosis, edge-case audit &amp; verified 1-click fix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Stethoscope className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-sm font-semibold text-white">Diagnosing Code Logic &amp; Invariants...</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Auditing loop boundaries, pointer progression, potential runtime crashes, and edge cases.
              </p>
            </div>
          ) : !result ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No diagnostic data available. Run inspection on your code.
            </div>
          ) : (
            <>
              {/* Overall Diagnosis Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 flex-wrap ${
                  result.status === 'clean'
                    ? 'bg-emerald-950/20 border-emerald-900/50'
                    : 'bg-amber-950/20 border-amber-900/50'
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    {result.status === 'clean' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" /> Code Logic Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" /> Issues Identified ({result.bugs.length})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {result.summary}
                  </p>
                </div>

                {/* Score & Complexity Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Correctness</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        result.overallScore >= 80
                          ? 'text-emerald-400'
                          : result.overallScore >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {result.overallScore}/100
                    </span>
                  </div>

                  <div className="text-right px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Complexity</span>
                    <div className="text-[11px] font-mono text-indigo-300">
                      <span>{result.timeComplexity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Switcher: Detected Bugs vs Full Solution */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('bugs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'bugs'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>Bug Diagnosis ({result.bugs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'code'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Corrected Code</span>
                  </button>
                </div>

                {activeTab === 'code' && (
                  <button
                    onClick={handleCopyCode}
                    className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                )}
              </div>

              {/* TAB 1: Detected Bugs */}
              {activeTab === 'bugs' && (
                <div className="space-y-3">
                  {result.bugs.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-white">No Structural Bugs Detected</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Your code handles boundary conditions and standard algorithmic invariants cleanly.
                      </p>
                    </div>
                  ) : (
                    result.bugs.map((bug: CodeCheckBug, idx: number) => {
                      const typeBadge =
                        bug.issueType === 'runtime' || bug.issueType === 'syntax'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : bug.issueType === 'edge-case'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {bug.lineNumber && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-bold">
                                  Line {bug.lineNumber}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${typeBadge}`}
                              >
                                {bug.issueType}
                              </span>
                              <h4 className="text-xs font-bold text-white">{bug.title}</h4>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {bug.explanation}
                          </p>

                          {/* Code Diff Comparison */}
                          {(bug.problematicSnippet || bug.fixedSnippet) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                              {bug.problematicSnippet && (
                                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
                                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                                    Current Buggy Logic:
                                  </span>
                                  <pre className="text-rose-200 text-[11px] overflow-x-auto whitespace-pre">
                                    {bug.problematicSnippet}
                                  </pre>
                                </div>
                              )}

                              {bug.fixedSnippet && (
                                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                    Corrected Logic:
                                  </span>
                                  <pre className="text-emerald-200 text-[11px] overflow-x-auto whitespace-pre">
                                    {bug.fixedSnippet}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Learning Takeaway Note */}
                  {result.learningAdvice && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-0.5">
                          Interview Principle Takeaway
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {result.learningAdvice}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Full Fixed Code */}
              {activeTab === 'code' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-[360px]">
                    <pre className="text-indigo-200 whitespace-pre">
                      {result.fixedFullCode}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close
          </button>

          {result?.fixedFullCode && (
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              title="Replace current Monaco editor code with this corrected solution"
            >
              <Wrench className="w-4 h-4" />
              <span>Apply Fix to Editor</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
