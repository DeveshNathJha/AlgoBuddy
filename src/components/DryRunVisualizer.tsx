'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TraceResult, TraceStep, AIProvider } from '@/lib/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Layers,
  Terminal as TerminalIcon,
  HelpCircle,
  Repeat
} from 'lucide-react';

interface DryRunVisualizerProps {
  traceResult: TraceResult | null;
  code: string;
  provider: AIProvider;
  userApiKey: string;
}

export default function DryRunVisualizer({
  traceResult,
  code,
  provider,
  userApiKey,
}: DryRunVisualizerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(800);
  const [clickedLineNumber, setClickedLineNumber] = useState<number | null>(null);

  // AI Step Explanation State (Feature D)
  const [explainingStep, setExplainingStep] = useState<boolean>(false);
  const [stepExplanation, setStepExplanation] = useState<{
    explanation: string;
    whyItRan: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const codeLines = code.split('\n');

  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setStepExplanation(null);
  }, [traceResult]);

  // Clear step explanation when navigating to a different step
  useEffect(() => {
    setStepExplanation(null);
  }, [currentStepIndex]);

  useEffect(() => {
    if (isPlaying && traceResult && traceResult.steps.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= traceResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, traceResult, playbackSpeedMs]);

  if (!traceResult || traceResult.steps.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
        <div className="p-3.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <TerminalIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">Execution Trace Visualizer</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-2">
          Click <strong>&quot;Run Code &amp; Trace&quot;</strong> in the editor panel to simulate execution step-by-step.
        </p>
        <p className="text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          Sandboxed WebAssembly runtime via Pyodide. No remote server execution.
        </p>
      </div>
    );
  }

  const steps = traceResult.steps;
  const currentStep: TraceStep = steps[currentStepIndex] || steps[0];
  const activeLineNumber = currentStep.lineNumber;

  const handleJumpNextIteration = () => {
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      if (steps[i].lineNumber === activeLineNumber) {
        setCurrentStepIndex(i);
        return;
      }
    }
  };

  const handleExplainCurrentStep = async () => {
    setExplainingStep(true);
    setStepExplanation(null);
    try {
      const lineText = codeLines[activeLineNumber - 1] || '';
      const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

      const res = await fetch('/api/ai/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeLine: lineText,
          lineNumber: activeLineNumber,
          variablesBefore: prevStep ? prevStep.variables : {},
          variablesAfter: currentStep.variables,
          changedVars: currentStep.changedVariables,
          provider,
          userApiKey: userApiKey || undefined,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setStepExplanation(resData.data);
      } else {
        alert(resData.error || 'Failed to explain step.');
      }
    } catch (e: any) {
      alert('Error fetching explanation: ' + e.message);
    } finally {
      setExplainingStep(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Playback & Scrubber Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        
        {/* Top Row: Step Indicator & Scrubber */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-[130px]">
            <span className="text-xs font-semibold text-slate-300">
              Step <span className="text-indigo-400 font-bold text-sm font-mono">{currentStepIndex + 1}</span> of{' '}
              <span className="text-slate-400 font-mono">{steps.length}</span>
            </span>

            {currentStep.loopInfo && currentStep.loopInfo.iteration && currentStep.loopInfo.iteration > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                <Repeat className="w-3 h-3" />
                Iteration {currentStep.loopInfo.iteration}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
              className="w-full max-w-[160px] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title="Step Scrubber"
            />

            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none shrink-0"
            >
              <option value={1400}>0.5x</option>
              <option value={800}>1.0x</option>
              <option value={400}>2.0x</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Fixed-Position Step Controls */}
        <div className="flex items-center justify-center pt-2.5 border-t border-slate-800/60">
          <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setCurrentStepIndex(0)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition flex items-center gap-1 text-xs"
              title="Previous step"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-24 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              title={isPlaying ? 'Pause auto-play' : 'Auto-play execution'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Play
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 disabled:opacity-30 disabled:hover:bg-transparent transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Next step (Click repeatedly to step through)"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleJumpNextIteration}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium flex items-center gap-1.5"
              title="Jump to next occurrence of active line"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Loop</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. Visualizer Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left: Code Viewer with Line Highlights & Hit Counts */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 font-mono text-xs overflow-y-auto max-h-[580px] shadow-inner">
          <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[11px]">
            <span>Code Execution Trace</span>
            {clickedLineNumber && (
              <span className="text-amber-400">
                Line {clickedLineNumber} executed{' '}
                <strong>{traceResult.lineHitCounts[clickedLineNumber] || 0} times</strong>
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            {codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === activeLineNumber;
              const hits = traceResult.lineHitCounts[lineNum] || 0;

              return (
                <div
                  key={idx}
                  onClick={() => setClickedLineNumber(lineNum)}
                  className={`flex items-center group cursor-pointer px-2 py-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600/30 text-white border-l-4 border-indigo-500 shadow-sm'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-8 shrink-0 text-right pr-3 select-none text-[11px] ${
                      isActive ? 'text-indigo-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {lineNum}
                  </span>

                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-sans shrink-0 mr-2 select-none ${
                      hits > 0 ? 'bg-slate-800 text-slate-400 group-hover:bg-amber-950/80 group-hover:text-amber-300' : 'text-transparent'
                    }`}
                  >
                    {hits > 0 ? `${hits}x` : ''}
                  </span>

                  <pre className="overflow-x-auto whitespace-pre font-mono flex-1">
                    {line || ' '}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: State Inspector */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Variables Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Variables State
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                {currentStep.changedVariables.length > 0 ? (
                  <span className="text-emerald-400 font-medium">
                    {currentStep.changedVariables.length} variable modified
                  </span>
                ) : (
                  'No state mutation'
                )}
              </span>
            </div>

            {Object.keys(currentStep.variables).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No active variables initialized in this frame.
              </p>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-[220px]">
                {Object.entries(currentStep.variables).map(([name, val]) => {
                  const isChanged = currentStep.changedVariables.includes(name);

                  return (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono transition-all ${
                        isChanged
                          ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-950/70 border border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <span className="font-semibold text-indigo-300">{name}</span>
                      <span className="max-w-[200px] truncate text-slate-100 font-medium bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Call Stack & Stdout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Call Stack
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto text-xs font-mono">
                {currentStep.callStack && currentStep.callStack.length > 0 ? (
                  currentStep.callStack.map((frame, i) => (
                    <div key={i} className="text-slate-300 bg-slate-950 px-2 py-1 rounded text-[11px] truncate">
                      {frame.functionName}() <span className="text-slate-500 font-sans">#line {frame.lineNumber}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">&lt;module&gt;</span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Standard Output
              </span>
              <pre className="text-[11px] text-emerald-400 bg-slate-950 p-2 rounded font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
                {currentStep.stdoutSoFar || '<no output>'}
              </pre>
            </div>
          </div>

          {/* FEATURE D: AI Step Explainer */}
          <div className="rounded-2xl bg-indigo-950/20 border border-indigo-900/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Step Explainer</span>
              </div>
              <button
                onClick={handleExplainCurrentStep}
                disabled={explainingStep}
                className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition flex items-center gap-1"
              >
                {explainingStep ? (
                  <>
                    <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5" /> Explain Step
                  </>
                )}
              </button>
            </div>

            {stepExplanation ? (
              <div className="space-y-1.5 text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-indigo-900/30">
                <p><span className="font-semibold text-slate-300">Mutation:</span> {stepExplanation.explanation}</p>
                <p className="text-indigo-300"><span className="font-semibold text-indigo-200">Algorithmic Context:</span> {stepExplanation.whyItRan}</p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Click &quot;Explain Step&quot; to inspect why this line was reached and its effect on state.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
