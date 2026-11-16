'use client';

import React, { useState } from 'react';
import { ThinkingGuideData } from '@/lib/types';
import {
  HelpCircle,
  Shield,
  Cpu,
  GitBranch,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ThinkingGuideViewProps {
  data: ThinkingGuideData | null;
  isLoading: boolean;
  onGenerate: () => void;
}

export default function ThinkingGuideView({ data, isLoading, onGenerate }: ThinkingGuideViewProps) {
  const [revealedLevels, setRevealedLevels] = useState<number[]>([1]);

  const toggleHint = (level: number) => {
    if (revealedLevels.includes(level)) {
      setRevealedLevels(revealedLevels.filter((l) => l !== level));
    } else {
      setRevealedLevels([...revealedLevels, level]);
    }
  };

  const revealNextHint = () => {
    const nextLevel = (revealedLevels[revealedLevels.length - 1] || 0) + 1;
    if (nextLevel <= 4) {
      setRevealedLevels([...revealedLevels, nextLevel]);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Cpu className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <h3 className="text-sm font-semibold text-white">Analyzing Problem Structure...</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Identifying algorithmic patterns, constraints, optimization paths, and progressive hints.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
        <div className="p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">Algorithmic Thinking Guide</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
          Input your problem statement and click &quot;Generate Thinking Guide&quot; to inspect constraints, pattern logic, and progressive hints rather than memorizing solutions.
        </p>
        <button
          onClick={onGenerate}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Generate Thinking Guide
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* 1. Simplified Restatement */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>1. Problem Restatement</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {data.simplifiedProblem}
        </p>
      </div>

      {/* 2. Constraints & Pattern Recognition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Constraints */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Shield className="w-4 h-4" />
            <span>Constraints &amp; Invariants</span>
          </div>
          <ul className="space-y-2">
            {data.coreConstraints.map((c, i) => (
              <li
                key={i}
                className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60"
              >
                <span className="text-amber-400 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recognized Patterns */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Cpu className="w-4 h-4" />
            <span>Pattern Recognition</span>
          </div>
          <div className="space-y-2.5">
            {data.recognizedPatterns.map((p, i) => (
              <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5 font-mono">
                  {p.patternName}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{p.whyThisPattern}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Brute Force vs Optimized Comparison */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
          <GitBranch className="w-4 h-4" />
          <span>Brute Force to Optimization Analysis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brute Force */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                Baseline (Brute Force)
              </span>
              <div className="flex gap-1.5 font-mono">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                  {data.bruteForce.timeComplexity}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {data.bruteForce.spaceComplexity}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">{data.bruteForce.approach}</p>
            <p className="text-[11px] text-rose-300/80">
              <span className="font-semibold">Limitation:</span> {data.bruteForce.drawback}
            </p>
          </div>

          {/* Optimized */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Optimal Approach
              </span>
              <div className="flex gap-1.5 font-mono">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  {data.optimizedApproach.timeComplexity}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {data.optimizedApproach.spaceComplexity}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">{data.optimizedApproach.approach}</p>
            <p className="text-[11px] text-emerald-300/90">
              <span className="font-semibold">Core Intuition:</span> {data.optimizedApproach.keyIntuition}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Progressive Hints System */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Progressive Hints (Active Recall)</span>
          </div>
          {revealedLevels.length < 4 && (
            <button
              onClick={revealNextHint}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition flex items-center gap-1.5 font-medium"
            >
              <span>Reveal Next Level</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Test your problem-solving process by stepping through guidance levels sequentially before inspecting full implementations:
        </p>

        <div className="space-y-3">
          {data.hints.map((hint) => {
            const isRevealed = revealedLevels.includes(hint.level);
            return (
              <div
                key={hint.level}
                className={`rounded-xl border transition-all ${isRevealed
                    ? 'bg-slate-950 border-slate-700/80 p-4'
                    : 'bg-slate-950/40 border-slate-800/50 p-3 opacity-60'
                  }`}
              >
                <div
                  onClick={() => toggleHint(hint.level)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isRevealed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                    >
                      {hint.level}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{hint.title}</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {isRevealed ? 'Hide' : 'Reveal'}
                  </span>
                </div>

                {isRevealed && (
                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-sans pl-7">
                    {hint.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Edge Cases Checklist */}
      {data.edgeCases && data.edgeCases.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Edge Cases &amp; Boundary Conditions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.edgeCases.map((edge, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{edge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
