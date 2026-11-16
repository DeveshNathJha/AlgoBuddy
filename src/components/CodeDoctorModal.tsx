'use client';

import { useEffect, useState } from 'react';
import { CodeCheckResult } from '@/lib/types';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './Modal';
import FormattedText from './FormattedText';

interface CodeDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CodeCheckResult | null;
  isLoading: boolean;
  onApplyFix: (fixedCode: string) => void;
  language: string;
}

const ISSUE_LABEL: Record<string, string> = {
  syntax: 'Syntax',
  runtime: 'Crash',
  logic: 'Logic',
  'edge-case': 'Edge case',
  complexity: 'Too slow',
};

export default function CodeDoctorModal({ isOpen, onClose, result, isLoading, onApplyFix, language }: CodeDoctorModalProps) {
  const [tab, setTab] = useState<'issues' | 'code'>('issues');
  const [copied, setCopied] = useState(false);

  useEffect(() => setTab('issues'), [result]);

  const hasFix = Boolean(result?.fixedFullCode);

  const copy = () => {
    if (!result?.fixedFullCode) return;
    navigator.clipboard.writeText(result.fixedFullCode).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => toast.error('Could not copy to clipboard.')
    );
  };

  const footer = (
    <>
      <button onClick={onClose} className="btn-ghost">
        Close
      </button>
      {hasFix && !isLoading && (
        <button
          onClick={() => {
            onApplyFix(result!.fixedFullCode);
            onClose();
          }}
          className="btn-primary"
        >
          Replace my code with the fix
        </button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Code Doctor" subtitle={`Bug and edge-case review · ${language}`} size="xl" footer={footer}>
      {isLoading ? (
        <div className="py-14 flex flex-col items-center text-center" role="status">
          <div className="w-9 h-9 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
          <p className="font-medium text-fg">Reviewing your code...</p>
          <p className="text-sm text-fg-muted mt-1">Checking loop bounds, edge cases and possible crashes.</p>
        </div>
      ) : !result ? (
        <p className="py-10 text-center text-sm text-fg-muted">No review yet.</p>
      ) : (
        <div className="space-y-4 text-[15px] leading-7">
          <div className={`rounded-lg border px-4 py-3 ${result.status === 'clean' ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-semibold text-fg">
                {result.status === 'clean' ? 'No problems found' : `${result.bugs.length} issue${result.bugs.length === 1 ? '' : 's'} found`}
              </p>
              <div className="flex items-center gap-3 text-sm text-fg-muted">
                {result.overallScore !== null && (
                  <span>
                    Score <span className="font-semibold text-fg">{result.overallScore}/100</span>
                  </span>
                )}
                {(result.timeComplexity || result.spaceComplexity) && (
                  <span className="font-mono">
                    {result.timeComplexity || '?'} time · {result.spaceComplexity || '?'} space
                  </span>
                )}
              </div>
            </div>
            <FormattedText text={result.summary} className="block text-fg-muted mt-1" />
          </div>

          {hasFix && (
            <div className="flex gap-1 p-1 rounded-lg bg-surface-2 w-fit" role="tablist">
              {(['issues', 'code'] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-md text-sm ${tab === t ? 'bg-surface text-fg shadow-sm font-medium' : 'text-fg-muted hover:text-fg'}`}
                >
                  {t === 'issues' ? `Issues (${result.bugs.length})` : 'Fixed code'}
                </button>
              ))}
            </div>
          )}

          {tab === 'issues' && (
            <div className="space-y-3">
              {result.bugs.length === 0 && <p className="text-fg-muted">Nothing to fix. Still dry-run the edge cases yourself before you submit.</p>}
              {result.bugs.map((bug, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="chip bg-surface-2 text-fg-muted">{ISSUE_LABEL[bug.issueType]}</span>
                    {bug.lineNumber && <span className="chip bg-surface-2 text-fg-muted font-mono">line {bug.lineNumber}</span>}
                    <h4 className="font-semibold text-fg">{bug.title}</h4>
                  </div>
                  {bug.explanation && <FormattedText text={bug.explanation} className="block text-fg-muted" />}
                  {(bug.problematicSnippet || bug.fixedSnippet) && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {bug.problematicSnippet && (
                        <div>
                          <p className="section-label mb-1">Now</p>
                          <pre className="code-block border-danger/40">{bug.problematicSnippet}</pre>
                        </div>
                      )}
                      {bug.fixedSnippet && (
                        <div>
                          <p className="section-label mb-1">Fix</p>
                          <pre className="code-block border-success/40">{bug.fixedSnippet}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {result.learningAdvice && (
                <div className="rounded-lg bg-accent/10 px-4 py-3">
                  <p className="section-label mb-0.5">Remember for interviews</p>
                  <FormattedText text={result.learningAdvice} className="text-fg" />
                </div>
              )}
            </div>
          )}

          {tab === 'code' && hasFix && (
            <div>
              <div className="flex justify-end mb-1">
                <button onClick={copy} className="btn-ghost btn-sm">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="code-block max-h-[400px]">{result.fixedFullCode}</pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
