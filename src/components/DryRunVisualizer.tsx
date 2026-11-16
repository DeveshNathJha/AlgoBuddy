'use client';

import { useEffect, useRef, useState } from 'react';
import { TraceResult, TraceStep } from '@/lib/types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Repeat, AlertTriangle } from 'lucide-react';
import FormattedText from './FormattedText';
import { EmptyState } from './ViewStates';
import { explainPythonError } from '@/lib/pythonErrors';

export interface StepExplanation {
  explanation: string;
  whyItRan: string;
}

/** Everything the AI needs to explain the highlighted line (sent to /api/ai/explain-step). */
export interface ExplainStepPayload {
  code: string;
  lineNumber: number;
  event: TraceStep['event'];
  functionName: string;
  iteration: number;
  variablesBefore: Record<string, string>;
  variablesAfter: Record<string, string> | null;
  changedVars: string[];
  nextAction?: string;
  returnValue?: string;
}

interface DryRunVisualizerProps {
  traceResult: TraceResult | null;
  isOutdated: boolean;
  isPython: boolean;
  onExplainStep: (payload: ExplainStepPayload) => Promise<StepExplanation | null>;
  onDiagnose: () => void;
  onTryDemo: () => void;
  demoTitle: string;
  /** Arrow-key stepping is only active while the Debugger tab is visible. */
  isActive: boolean;
}

const fnLabel = (name: string) => (name === '<module>' ? 'main program' : `${name}()`);

function buildExplainPayload(code: string, step: TraceStep, next: TraceStep | undefined): ExplainStepPayload {
  const depth = step.callStack.length;
  const nextDepth = next?.callStack.length ?? 0;
  const sameFrame = !!next && nextDepth === depth && next.functionName === step.functionName;

  let nextAction: string | undefined;
  if (!next) nextAction = 'ends the program';
  else if (nextDepth > depth) nextAction = `calls ${fnLabel(next.functionName)}`;
  else if (nextDepth < depth) nextAction = `returns to line ${next.lineNumber} in ${fnLabel(next.functionName)}`;
  else if (next.lineNumber !== step.lineNumber + 1) nextAction = `jumps to line ${next.lineNumber}`;

  return {
    code,
    lineNumber: step.lineNumber,
    event: step.event,
    functionName: step.functionName,
    iteration: step.iteration,
    variablesBefore: step.variables,
    // In this tracer a step shows the state BEFORE its line runs, so the effect of
    // the highlighted line is visible in the NEXT step of the same frame.
    variablesAfter: sameFrame ? next!.variables : null,
    changedVars: sameFrame ? next!.changedVariables : [],
    nextAction,
    returnValue: step.returnValue,
  };
}

export default function DryRunVisualizer({ traceResult, isOutdated, isPython, onExplainStep, onDiagnose, onTryDemo, demoTitle, isActive }: DryRunVisualizerProps) {
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);
  const [explaining, setExplaining] = useState(false);
  const [explanations, setExplanations] = useState<Record<number, StepExplanation>>({});
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const steps = traceResult?.steps || [];
  const lastIndex = Math.max(0, steps.length - 1);

  useEffect(() => {
    setIdx(0);
    setIsPlaying(false);
    setExplanations({});
  }, [traceResult]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setIdx((prev) => {
        if (prev >= lastIndex) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMs, lastIndex]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  useEffect(() => {
    if (steps.length === 0 || !isActive) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable], .monaco-editor')) return;
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(lastIndex, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length, lastIndex, isActive]);

  if (!traceResult) {
    return (
      <EmptyState
        title="Debugger"
        description="Click Run & Trace to run your Python code and walk through it one line at a time, with every variable shown at each step."
        actionLabel={`Try it with the ${demoTitle} solution`}
        onAction={onTryDemo}
        note={
          <>
            {!isPython && <p className="text-warning mb-1">The Debugger runs Python only. Switch the language to Python 3.</p>}
            Runs privately in your browser. Your code is never sent to a server for this.
          </>
        }
      />
    );
  }

  const plainError = traceResult.error && !traceResult.truncated && !traceResult.runnerError ? explainPythonError(traceResult.error) : null;
  const bannerTitle = traceResult.truncated ? 'Trace stopped' : traceResult.runnerError ? 'Could not run the code' : 'Your code raised an error';
  const errorBanner = traceResult.error && (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
        traceResult.truncated ? 'border-warning/40 bg-warning/10' : 'border-danger/40 bg-danger/10'
      }`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${traceResult.truncated ? 'text-warning' : 'text-danger'}`} />
        <div className="min-w-0">
          <p className="font-medium text-fg">
            {bannerTitle}
            {traceResult.errorLine && !traceResult.truncated && !traceResult.runnerError ? ` on line ${traceResult.errorLine}` : ''}
          </p>
          {plainError && <FormattedText text={plainError} className="block text-fg-muted" />}
          {traceResult.runnerError || traceResult.truncated ? (
            <p className="text-fg-muted">{traceResult.error}</p>
          ) : (
            <p className="font-mono text-xs text-fg-subtle break-words mt-0.5">Python says: {traceResult.error}</p>
          )}
        </div>
      </div>
      {!traceResult.truncated && !traceResult.runnerError && (
        <button onClick={onDiagnose} className="btn-secondary btn-sm shrink-0">
          Ask Code Doctor
        </button>
      )}
    </div>
  );

  if (steps.length === 0) return <div className="space-y-4">{errorBanner}</div>;

  const codeLines = traceResult.sourceCode.split('\n');
  const step = steps[Math.min(idx, lastIndex)];
  const prev = idx > 0 ? steps[idx - 1] : null;
  const explanation = explanations[idx];
  const isErrorStep = !traceResult.success && !traceResult.truncated && idx === lastIndex;
  const varEntries = Object.entries(step.variables);

  const jumpNextIteration = () => {
    for (let i = idx + 1; i < steps.length; i++) {
      if (steps[i].lineNumber === step.lineNumber && steps[i].event === 'line') return setIdx(i);
    }
  };

  const explain = async () => {
    setExplaining(true);
    try {
      const result = await onExplainStep(buildExplainPayload(traceResult.sourceCode, step, steps[idx + 1]));
      if (result) setExplanations((e) => ({ ...e, [idx]: result }));
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {isOutdated && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2 text-sm text-fg">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" /> You edited the code after this run. Click Run &amp; Trace again to update.
        </div>
      )}
      {errorBanner}

      {/* Controls */}
      <section className="card p-3 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={() => setIdx(0)} className="btn-ghost p-2" title="Back to start" aria-label="Back to start">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="btn-ghost btn-sm" title="Previous step (←)">
              <SkipBack className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => {
                if (!isPlaying && idx >= lastIndex) setIdx(0);
                setIsPlaying((p) => !p);
              }}
              className="btn-primary btn-sm w-[84px]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : idx >= lastIndex ? 'Replay' : 'Play'}
            </button>
            <button onClick={() => setIdx(Math.min(lastIndex, idx + 1))} disabled={idx >= lastIndex} className="btn-ghost btn-sm" title="Next step (→)">
              Next <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button onClick={jumpNextIteration} className="btn-ghost btn-sm" title="Jump to the next time this line runs">
              <Repeat className="w-3.5 h-3.5" /> Next iteration
            </button>
          </div>
          <select value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value))} className="input w-auto py-1 text-sm" aria-label="Playback speed">
            <option value={1600}>0.5x</option>
            <option value={800}>1x</option>
            <option value={400}>2x</option>
            <option value={150}>5x</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted tabular-nums whitespace-nowrap">
            Step <span className="font-semibold text-fg">{idx + 1}</span> / {steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="flex-1 accent-[rgb(var(--accent))]"
            aria-label="Step"
          />
          <span className="hidden sm:inline text-xs text-fg-subtle whitespace-nowrap">← → keys</span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Code */}
        <section className="card xl:col-span-7 overflow-hidden">
          <div className="px-4 py-2 border-b border-border text-sm text-fg-muted flex items-center justify-between gap-2">
            <span>
              {step.event === 'return' ? (
                <>
                  <span className="text-fg font-medium">{fnLabel(step.functionName)}</span> is returning
                </>
              ) : (
                <>
                  Highlighted line is <span className="text-fg font-medium">about to run</span>
                  {step.iteration > 1 && <span className="text-fg-subtle"> (run #{step.iteration})</span>}
                </>
              )}
            </span>
            <span className="text-xs text-fg-subtle">left number = times run</span>
          </div>
          <div className="font-mono text-[13px] leading-6 overflow-auto max-h-[520px] py-1">
            {codeLines.map((line, i) => {
              const lineNum = i + 1;
              const active = lineNum === step.lineNumber;
              const hits = traceResult.lineHitCounts[lineNum] || 0;
              return (
                <div
                  key={i}
                  ref={active ? activeLineRef : undefined}
                  className={`flex border-l-[3px] ${
                    active ? (isErrorStep ? 'border-danger bg-danger/10' : 'border-accent bg-accent/10') : 'border-transparent'
                  }`}
                >
                  <span className="w-8 shrink-0 text-right pr-1 text-[11px] text-fg-subtle select-none tabular-nums">{hits > 0 ? `${hits}×` : ''}</span>
                  <span className={`w-8 shrink-0 text-right pr-3 select-none tabular-nums ${active ? 'text-fg font-semibold' : 'text-fg-subtle'}`}>{lineNum}</span>
                  <pre className={`whitespace-pre pr-4 ${active ? 'text-fg' : 'text-fg-muted'}`}>{line || ' '}</pre>
                </div>
              );
            })}
          </div>
        </section>

        {/* State */}
        <div className="xl:col-span-5 space-y-4">
          <section className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-fg">
                Variables <span className="font-normal text-fg-subtle">in {fnLabel(step.functionName)}</span>
              </h3>
              <span className="text-xs text-fg-subtle">{step.changedVariables.length > 0 ? `${step.changedVariables.length} just changed` : ''}</span>
            </div>

            {step.returnValue !== undefined && (
              <div className="mb-2 flex items-start justify-between gap-3 rounded-md bg-accent/10 px-2.5 py-1.5 font-mono text-[13px]">
                <span className="text-accent-text font-semibold">return</span>
                <span className="text-fg break-all text-right">{step.returnValue}</span>
              </div>
            )}

            {varEntries.length === 0 ? (
              <p className="text-sm text-fg-subtle py-2">No variables yet.</p>
            ) : (
              <div className="divide-y divide-border max-h-[260px] overflow-y-auto font-mono text-[13px]">
                {varEntries.map(([name, val]) => {
                  const changed = step.changedVariables.includes(name);
                  const old = changed && prev && prev.functionName === step.functionName ? prev.variables[name] : undefined;
                  return (
                    <div key={name} className={`flex items-start justify-between gap-3 py-1.5 px-1 ${changed ? 'bg-success/10' : ''}`}>
                      <span className="text-fg font-medium shrink-0">{name}</span>
                      <span className="text-right break-all">
                        {old !== undefined && <span className="text-fg-subtle line-through mr-2">{old}</span>}
                        <span className={changed ? 'text-success font-medium' : 'text-fg-muted'}>{val}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="card p-4">
              <h3 className="text-sm font-semibold text-fg mb-2">Call stack</h3>
              <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-xs">
                {step.callStack.map((frame, i) => (
                  <div key={i} className={`break-words ${i === 0 ? 'text-fg' : 'text-fg-subtle'}`}>
                    {fnLabel(frame.functionName)} <span className="text-fg-subtle">line {frame.lineNumber}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="card p-4">
              <h3 className="text-sm font-semibold text-fg mb-2">Output</h3>
              <pre className="font-mono text-xs text-fg-muted whitespace-pre-wrap max-h-28 overflow-y-auto">
                {step.stdoutSoFar || <span className="text-fg-subtle">Nothing printed yet</span>}
              </pre>
            </section>
          </div>

          <section className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-fg">Explain this step</h3>
              <button onClick={explain} disabled={explaining || !!explanation} className="btn-secondary btn-sm">
                {explaining ? 'Explaining...' : explanation ? 'Explained' : 'Explain'}
              </button>
            </div>
            {explanation ? (
              <div className="space-y-2 text-sm leading-6">
                <div>
                  <p className="section-label">What happens</p>
                  <FormattedText text={explanation.explanation} className="text-fg" />
                </div>
                {explanation.whyItRan && (
                  <div>
                    <p className="section-label">Why the program is here</p>
                    <FormattedText text={explanation.whyItRan} className="text-fg-muted" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-fg-subtle">AI explains what the highlighted line does with these values, and why the program reached it. Uses 1 AI request.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
