'use client';

import React, { useState } from 'react';
import { ThinkingGuideData, ProblemApproach } from '@/lib/types';
import {
  HelpCircle,
  Shield,
  Cpu,
  GitBranch,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Code2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';

interface ThinkingGuideViewProps {
  data: ThinkingGuideData | null;
  isLoading: boolean;
  onGenerate: () => void;
  onLoadStarterCode?: (code: string) => void;
}

export default function ThinkingGuideView({
  data,
  isLoading,
  onGenerate,
  onLoadStarterCode,
}: ThinkingGuideViewProps) {
  const [revealedLevels, setRevealedLevels] = useState<number[]>([1]);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState<number>(0);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Cpu className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <h3 className="text-sm font-semibold text-white">Decomposing Problem Structure...</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
          Formulating pattern recognition, multiple algorithmic approaches (Brute Force $\rightarrow$ Optimal), and concrete implementation steps.
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
          Input your problem statement and click &quot;Generate Thinking Guide&quot; to inspect multi-tier approaches, pattern logic, and progressive hints rather than memorizing solutions.
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

  const approaches = (Array.isArray(data.approaches) && data.approaches.length > 0)
    ? data.approaches
    : [
        {
          approachName: 'Approach 1: Brute Force',
          tier: 'brute-force' as const,
          timeComplexity: data.bruteForce?.timeComplexity || 'O(N^2)',
          spaceComplexity: data.bruteForce?.spaceComplexity || 'O(1)',
          intuition: data.bruteForce?.approach || 'Check all possibilities',
          stepByStepAlgorithm: [data.bruteForce?.approach || 'Exhaustive nested check'],
          pseudocodeOrSnippet: '',
          tradeoffsAndDrawbacks: data.bruteForce?.drawback || 'Too slow for large N',
        },
        {
          approachName: 'Approach 2: Optimal Solution',
          tier: 'optimal' as const,
          timeComplexity: data.optimizedApproach?.timeComplexity || 'O(N)',
          spaceComplexity: data.optimizedApproach?.spaceComplexity || 'O(1)',
          intuition: data.optimizedApproach?.keyIntuition || 'Direct optimal lookup',
          stepByStepAlgorithm: [data.optimizedApproach?.approach || 'Optimal single pass traversal'],
          pseudocodeOrSnippet: '',
          tradeoffsAndDrawbacks: 'Optimal time complexity',
        },
      ];

  const currentApproach = approaches[selectedApproachIndex] || approaches[0] || {
    approachName: 'Approach',
    tier: 'optimal',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    intuition: 'Algorithmic approach',
    stepByStepAlgorithm: ['Initialize variables', 'Process elements', 'Return output'],
    pseudocodeOrSnippet: '',
    tradeoffsAndDrawbacks: '',
  };

  const coreConstraints = Array.isArray(data.coreConstraints) ? data.coreConstraints : [];
  const recognizedPatterns = Array.isArray(data.recognizedPatterns) ? data.recognizedPatterns : [];
  const edgeCases = Array.isArray(data.edgeCases) ? data.edgeCases : [];
  const hints = Array.isArray(data.hints) ? data.hints : [];
  const blueprint = data.implementationBlueprint;
  const dataStructures = Array.isArray(blueprint?.dataStructuresNeeded) ? blueprint.dataStructuresNeeded : [];
  const algorithmSteps = Array.isArray(blueprint?.algorithmSteps) ? blueprint.algorithmSteps : [];
  const stepByStepAlgorithm = Array.isArray(currentApproach.stepByStepAlgorithm) ? currentApproach.stepByStepAlgorithm : [];

  return (
    <div className="space-y-6 pb-12">

      {/* Top Action Header with Always-Available Regenerate Button */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Algorithmic Thinking Guide</span>
          </span>
          <p className="text-[11px] text-slate-400">
            Multi-approach analysis &amp; step-by-step implementation bridge
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0"
          title="Re-run analysis for the current problem statement"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Regenerate Guide</span>
        </button>
      </div>

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
            {coreConstraints.map((c, i) => (
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
            {recognizedPatterns.map((p, i) => (
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

      {/* 3. MULTIPLE APPROACHES (Brute Force -> Better -> Optimal) */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>2. Multiple Approaches ({approaches.length} Explored)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans">
            Compare progression from naive to production-grade
          </span>
        </div>

        {/* Approach Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {approaches.map((app: ProblemApproach, idx: number) => {
            const isSelected = idx === selectedApproachIndex;
            const badgeColor =
              app.tier === 'optimal'
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                : app.tier === 'better'
                ? 'text-amber-400 border-amber-500/30 bg-amber-950/40'
                : 'text-rose-400 border-rose-500/30 bg-rose-950/40';

            return (
              <button
                key={idx}
                onClick={() => setSelectedApproachIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? `${badgeColor} ring-1 ring-indigo-500/50 shadow-sm`
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{app.approachName}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40">
                  {app.timeComplexity}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Approach Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
            <div>
              <h4 className="text-sm font-bold text-white">{currentApproach.approachName}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentApproach.intuition}
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                Time: {currentApproach.timeComplexity}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                Space: {currentApproach.spaceComplexity}
              </span>
            </div>
          </div>

          {/* Step-by-Step Algorithm */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
              Step-by-Step Algorithmic Logic
            </span>
            <div className="space-y-1.5">
              {stepByStepAlgorithm.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {sIdx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code / Logic Snippet (if available) */}
          {currentApproach.pseudocodeOrSnippet && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Algorithmic Logic Snippet:</span>
                <button
                  onClick={() => handleCopy(currentApproach.pseudocodeOrSnippet)}
                  className="hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre">
                {currentApproach.pseudocodeOrSnippet}
              </pre>
            </div>
          )}

          {/* Tradeoffs & Drawbacks */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <span className="font-semibold text-slate-300 block mb-0.5">Tradeoff Assessment:</span>
            <p className="text-slate-400 leading-relaxed">{currentApproach.tradeoffsAndDrawbacks}</p>
          </div>
        </div>
      </div>

      {/* 4. IMPLEMENTATION BLUEPRINT (The Bridge to Code) */}
      {data.implementationBlueprint && (
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>3. Implementation Blueprint (Bridge to Code)</span>
            </div>
            {onLoadStarterCode && data.implementationBlueprint.starterCodeTemplate && (
              <button
                onClick={() => {
                  onLoadStarterCode(data.implementationBlueprint!.starterCodeTemplate);
                  toast.success('Starter scaffold loaded into editor!');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                title="Load starter template directly into the Monaco editor"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Load Template into Editor</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Data Structures */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Required Data Structures
              </span>
              <ul className="space-y-1.5">
                {dataStructures.map((ds, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{ds}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Execution Steps */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Coding Action Checklist
              </span>
              <ul className="space-y-1.5">
                {algorithmSteps.map((step, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Progressive Hints System */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>4. Progressive Hints (Active Recall)</span>
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
          {hints.map((hint) => {
            const isRevealed = revealedLevels.includes(hint.level);
            return (
              <div
                key={hint.level}
                className={`rounded-xl border transition-all ${
                  isRevealed
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
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isRevealed ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
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

      {/* 6. Edge Cases Checklist */}
      {edgeCases.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            5. Edge Cases &amp; Boundary Conditions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {edgeCases.map((edge, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60"
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
