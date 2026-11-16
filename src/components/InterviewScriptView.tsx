'use client';

import { useEffect, useRef, useState } from 'react';
import { InterviewScriptData } from '@/lib/types';
import { Volume2, Square, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import FormattedText from './FormattedText';
import { EmptyState, LoadingState, StaleBanner } from './ViewStates';

interface InterviewScriptViewProps {
  data: InterviewScriptData | null;
  isLoading: boolean;
  isStale?: boolean;
  onGenerate: () => void;
}

/** Strips markdown so text-to-speech does not read out backticks and asterisks. */
function toSpeakable(text: string): string {
  return text.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
}

/** Chrome silently stops utterances longer than ~15s, so speak sentence by sentence. */
function splitSentences(text: string): string[] {
  return toSpeakable(text).match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
}

export default function InterviewScriptView({ data, isLoading, isStale, onGenerate }: InterviewScriptViewProps) {
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const speechRun = useRef(0);

  const stopSpeech = () => {
    speechRun.current++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
  };

  useEffect(() => stopSpeech, []);
  useEffect(() => {
    stopSpeech();
  }, [data]);

  const speak = (text: string, idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Your browser does not support text-to-speech.');
      return;
    }
    if (speakingIdx === idx) return stopSpeech();
    stopSpeech();
    const run = ++speechRun.current;
    const sentences = splitSentences(text);
    setSpeakingIdx(idx);
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      u.rate = 0.95;
      if (i === sentences.length - 1) u.onend = () => run === speechRun.current && setSpeakingIdx(null);
      u.onerror = () => run === speechRun.current && setSpeakingIdx(null);
      window.speechSynthesis.speak(u);
    });
  };

  const copy = (text: string, idx: number) =>
    navigator.clipboard.writeText(toSpeakable(text)).then(
      () => {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
      },
      () => toast.error('Could not copy to clipboard.')
    );

  if (isLoading) {
    return <LoadingState title="Writing your interview script..." detail="Clarifying questions, a worked example, the brute force to optimal story, and the code walkthrough." />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Interview Prep"
        description="The exact words to say in a real interview, stage by stage, and what the interviewer is checking at each one. Listen to it, then practise out loud."
        actionLabel="Generate interview script"
        onAction={onGenerate}
        note="If your editor has code, the script explains your code. Otherwise it explains the optimal solution."
      />
    );
  }

  return (
    <div className="space-y-4 pb-12 text-[15px] leading-7 text-fg-muted">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Interview Prep</h2>
          <p className="text-sm text-fg-subtle">{data.sections.length} stages. Read each one aloud until it feels natural.</p>
        </div>
        <button onClick={onGenerate} className="btn-secondary btn-sm shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
      </div>

      {isStale && <StaleBanner text="The problem or your code changed after this script was made." onRegenerate={onGenerate} />}

      {data.problemSummary && (
        <section className="card p-5">
          <p className="section-label mb-1">Start by confirming the problem</p>
          <FormattedText text={data.problemSummary} className="text-fg" />
        </section>
      )}

      <ol className="space-y-4">
        {data.sections.map((section, idx) => {
          const isSpeaking = speakingIdx === idx;
          return (
            <li key={section.id} className={`card p-5 ${isSpeaking ? 'ring-2 ring-accent/40' : ''}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="flex items-center gap-3 text-[15px] font-semibold text-fg">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent-text text-xs font-semibold flex items-center justify-center shrink-0">{idx + 1}</span>
                  {section.phase}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => speak(section.speakingScript, idx)} className={isSpeaking ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>
                    {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isSpeaking ? 'Stop' : 'Listen'}
                  </button>
                  <button onClick={() => copy(section.speakingScript, idx)} className="btn-ghost btn-sm" aria-label="Copy what to say">
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pl-9 space-y-4">
                <blockquote className="border-l-2 border-accent pl-4">
                  <p className="section-label mb-1">What to say</p>
                  <FormattedText text={section.speakingScript} className="text-fg" />
                </blockquote>

                {(section.keyPoints.length > 0 || section.interviewerReactionHint) && (
                  <div className="grid gap-4 md:grid-cols-2 text-sm leading-6">
                    {section.keyPoints.length > 0 && (
                      <div>
                        <p className="section-label mb-1">Must cover</p>
                        <ul className="space-y-1">
                          {section.keyPoints.map((point, pIdx) => (
                            <li key={pIdx} className="flex gap-2">
                              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-1" />
                              <FormattedText text={point} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.interviewerReactionHint && (
                      <div>
                        <p className="section-label mb-1">Interviewer is checking</p>
                        <FormattedText text={section.interviewerReactionHint} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {(data.timeComplexityExplanation || data.spaceComplexityExplanation) && (
        <section className="card p-5 grid gap-5 md:grid-cols-2">
          {data.timeComplexityExplanation && (
            <div>
              <p className="section-label mb-1">Explaining time complexity</p>
              <FormattedText text={data.timeComplexityExplanation} className="text-fg" />
            </div>
          )}
          {data.spaceComplexityExplanation && (
            <div>
              <p className="section-label mb-1">Explaining space complexity</p>
              <FormattedText text={data.spaceComplexityExplanation} className="text-fg" />
            </div>
          )}
        </section>
      )}

      {data.proTips.length > 0 && (
        <section className="card p-5">
          <p className="section-label mb-2">Communication tips</p>
          <ul className="space-y-2">
            {data.proTips.map((tip, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-fg-subtle shrink-0" />
                <FormattedText text={tip} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
