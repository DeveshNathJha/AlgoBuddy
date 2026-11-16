'use client';

import React, { useEffect, useState } from 'react';
import { ThinkingGuideData } from '@/lib/types';
import { Copy, Check, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import FormattedText from './FormattedText';
import { EmptyState, LoadingState, StaleBanner } from './ViewStates';

interface ThinkingGuideViewProps {
  data: ThinkingGuideData | null;
  isLoading: boolean;
  isStale?: boolean;
  onGenerate: () => void;
  onLoadStarterCode?: (code: string) => void;
}

const TIER_LABEL: Record<string, string> = { 'brute-force': 'Brute force', better: 'Better', optimal: 'Optimal' };

/** One numbered step of the guide. */
function Step({ n, title, hint, action, children }: { n: number; title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-accent/10 text-accent-text text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
            {n}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
            {hint && <p className="text-sm text-fg-subtle">{hint}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="pl-9">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-fg-subtle shrink-0" />
          <FormattedText text={item} />
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-fg-subtle tabular-nums w-5 shrink-0 text-right">{i + 1}.</span>
          <FormattedText text={item} />
        </li>
      ))}
    </ol>
  );
}

export default function ThinkingGuideView({ data, isLoading, isStale, onGenerate, onLoadStarterCode }: ThinkingGuideViewProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [approachIdx, setApproachIdx] = useState(0);
  const [showSolutions, setShowSolutions] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRevealedCount(0);
    setApproachIdx(0);
    setShowSolutions(false);
  }, [data]);

  if (isLoading) {
    return <LoadingState title="Breaking the problem down..." detail="Reading the constraints, finding the pattern and preparing hints. This usually takes 10 to 30 seconds." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="How to Think"
        description="A step-by-step way into the problem: what it asks, what the constraints tell you, which pattern fits, hints to try on your own, and only then the solutions."
        actionLabel="Generate thinking guide"
        onAction={onGenerate}
      />
    );
  }

  const approaches = data.approaches;
  const current = approaches[Math.min(approachIdx, approaches.length - 1)];
  const blueprint = data.implementationBlueprint;
  let n = 0;

  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast.error('Could not copy to clipboard.')
    );

  return (
    <div className="space-y-4 pb-12 text-[15px] leading-7 text-fg-muted">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">How to Think</h2>
          <p className="text-sm text-fg-subtle">Go step by step. Try each hint yourself before opening the solutions.</p>
        </div>
        <button onClick={onGenerate} className="btn-secondary btn-sm shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
      </div>

      {isStale && <StaleBanner text="The problem changed after this guide was made." onRegenerate={onGenerate} />}

      {data.simplifiedProblem && (
        <Step n={++n} title="Understand the problem" hint="Say it back in your own words before solving.">
          <FormattedText text={data.simplifiedProblem} className="text-fg" />
        </Step>
      )}

      {data.coreConstraints.length > 0 && (
        <Step n={++n} title="Read the constraints" hint="Input size tells you which time complexity is acceptable.">
          <BulletList items={data.coreConstraints} />
        </Step>
      )}

      {data.recognizedPatterns.length > 0 && (
        <Step n={++n} title="Spot the pattern" hint="Which clue in the problem points to a known technique?">
          <div className="space-y-3">
            {data.recognizedPatterns.map((p, i) => (
              <div key={i}>
                <p className="font-semibold text-fg">{p.patternName}</p>
                {p.whyThisPattern && <FormattedText text={p.whyThisPattern} />}
              </div>
            ))}
          </div>
        </Step>
      )}

      {data.hints.length > 0 && (
        <Step
          n={++n}
          title="Try it with hints"
          hint="Open one hint at a time. Stop as soon as you can continue on your own."
          action={
            revealedCount > 0 ? (
              <button onClick={() => setRevealedCount(0)} className="btn-ghost btn-sm shrink-0">
                Hide all
              </button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {data.hints.map((hint, idx) => {
              const revealed = idx < revealedCount;
              const isNext = idx === revealedCount;
              return (
                <div key={idx} className={`rounded-lg border px-3.5 py-2.5 ${revealed ? 'border-border bg-surface-2' : 'border-dashed border-border'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium ${revealed ? 'text-fg' : 'text-fg-subtle'}`}>
                      Hint {idx + 1}: {hint.title}
                    </span>
                    {isNext ? (
                      <button onClick={() => setRevealedCount(idx + 1)} className="btn-secondary btn-sm">
                        Show hint
                      </button>
                    ) : !revealed ? (
                      <Lock className="w-3.5 h-3.5 text-fg-subtle" aria-label="Open the previous hint first" />
                    ) : null}
                  </div>
                  {revealed && <FormattedText text={hint.content} className="block mt-1.5 text-fg" />}
                </div>
              );
            })}
          </div>
        </Step>
      )}

      <Step
        n={++n}
        title="Compare approaches"
        hint="From the obvious idea to the optimal one."
        action={
          <button onClick={() => setShowSolutions((s) => !s)} className={showSolutions ? 'btn-ghost btn-sm shrink-0' : 'btn-primary btn-sm shrink-0'}>
            {showSolutions ? 'Hide solutions' : 'Show solutions'}
          </button>
        }
      >
        {!showSolutions ? (
          <p className="text-sm text-fg-subtle">Hidden so you can think first. {approaches.length} approaches are ready when you are.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 p-1 rounded-lg bg-surface-2 w-fit max-w-full overflow-x-auto" role="tablist">
              {approaches.map((a, idx) => (
                <button
                  key={idx}
                  role="tab"
                  aria-selected={idx === approachIdx}
                  onClick={() => setApproachIdx(idx)}
                  className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition ${
                    idx === approachIdx ? 'bg-surface text-fg shadow-sm font-medium' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {idx + 1}. {TIER_LABEL[a.tier]}
                  {a.timeComplexity && <span className="ml-1.5 font-mono text-xs text-fg-subtle">{a.timeComplexity}</span>}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-fg">{current.approachName}</h4>
                <p className="text-sm text-fg-subtle font-mono">
                  {current.timeComplexity && <>Time {current.timeComplexity}</>}
                  {current.timeComplexity && current.spaceComplexity && ' · '}
                  {current.spaceComplexity && <>Space {current.spaceComplexity}</>}
                </p>
              </div>

              {current.intuition && (
                <div>
                  <p className="section-label mb-1">Idea</p>
                  <FormattedText text={current.intuition} className="text-fg" />
                </div>
              )}

              {current.stepByStepAlgorithm.length > 0 && (
                <div>
                  <p className="section-label mb-1">Steps</p>
                  <NumberedList items={current.stepByStepAlgorithm} />
                </div>
              )}

              {current.pseudocodeOrSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="section-label">Code sketch</p>
                    <button onClick={() => copy(current.pseudocodeOrSnippet)} className="btn-ghost btn-sm">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="code-block">{current.pseudocodeOrSnippet}</pre>
                </div>
              )}

              {current.tradeoffsAndDrawbacks && (
                <div>
                  <p className="section-label mb-1">Trade-off</p>
                  <FormattedText text={current.tradeoffsAndDrawbacks} />
                </div>
              )}
            </div>
          </div>
        )}
      </Step>

      {blueprint && (blueprint.dataStructuresNeeded.length > 0 || blueprint.algorithmSteps.length > 0 || blueprint.starterCodeTemplate.trim()) && (
        <Step
          n={++n}
          title="Turn it into code"
          hint="What to set up, and the order to write it in."
          action={
            onLoadStarterCode && blueprint.starterCodeTemplate.trim() ? (
              <button onClick={() => onLoadStarterCode(blueprint.starterCodeTemplate)} className="btn-secondary btn-sm shrink-0">
                Load starter code
              </button>
            ) : undefined
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            {blueprint.dataStructuresNeeded.length > 0 && (
              <div>
                <p className="section-label mb-1">Data structures</p>
                <BulletList items={blueprint.dataStructuresNeeded} />
              </div>
            )}
            {blueprint.algorithmSteps.length > 0 && (
              <div>
                <p className="section-label mb-1">Coding order</p>
                <NumberedList items={blueprint.algorithmSteps} />
              </div>
            )}
          </div>
          {blueprint.starterCodeTemplate.trim() && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-accent-text select-none">Preview starter code</summary>
              <pre className="code-block mt-2">{blueprint.starterCodeTemplate}</pre>
            </details>
          )}
        </Step>
      )}

      {data.edgeCases.length > 0 && (
        <Step n={++n} title="Test the edge cases" hint="Dry-run these before you say you are done.">
          <BulletList items={data.edgeCases} />
        </Step>
      )}
    </div>
  );
}
