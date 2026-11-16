'use client';

import React, { useState, useEffect } from 'react';
import { InterviewScriptData, ScriptSection } from '@/lib/types';
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Award,
  Clock,
  Database
} from 'lucide-react';

interface InterviewScriptViewProps {
  data: InterviewScriptData | null;
  isLoading: boolean;
  onGenerate: () => void;
}

export default function InterviewScriptView({
  data,
  isLoading,
  onGenerate,
}: InterviewScriptViewProps) {
  const [activeSpeakingSection, setActiveSpeakingSection] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (text: string, sectionId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Your browser does not support Web Speech synthesis.');
      return;
    }

    if (isSpeaking && activeSpeakingSection === sectionId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeakingSection(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeakingSection(sectionId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeakingSection(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeakingSection(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Mic className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <h3 className="text-sm font-semibold text-white">Synthesizing Spoken Interview Script...</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Formulating clarifying questions, verbal walkthroughs, and complexity justifications.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
        <div className="p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <Mic className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">Interview Verbal Script Generator</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
          Produce the exact word-for-word spoken dialogue to deliver in a real technical interview, including edge case questions, whiteboard walkthroughs, and transitions.
        </p>
        <button
          onClick={onGenerate}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Generate Interview Script
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            Verbal Interview Delivery
          </span>
          <p className="text-xs text-slate-200">{data.problemSummary}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            5 Stages Covered
          </span>
        </div>
      </div>

      {/* Script Sections */}
      <div className="space-y-4">
        {data.sections.map((section: ScriptSection) => {
          const isCurrentSpeaking = isSpeaking && activeSpeakingSection === section.id;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border transition-all ${isCurrentSpeaking
                  ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500/30 p-5'
                  : 'bg-slate-900/70 border-slate-800 p-5'
                }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {section.phase}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSpeak(section.speakingScript, section.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${isCurrentSpeaking
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    title="Audio playback via Web Speech API"
                  >
                    {isCurrentSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Listen
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopy(section.speakingScript, section.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Copy dialogue"
                  >
                    {copiedId === section.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Exact Spoken Words */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-3 font-sans text-slate-100 text-xs leading-relaxed">
                <p className="text-slate-200">&ldquo;{section.speakingScript}&rdquo;</p>
              </div>

              {/* Interviewer Insight & Key Points */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-900/40">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px]">{section.interviewerReactionHint}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {section.keyPoints.map((point, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Complexity Justifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" />
            <span>Time Complexity Articulation</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            &ldquo;{data.timeComplexityExplanation}&rdquo;
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <Database className="w-4 h-4" />
            <span>Space Complexity Articulation</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            &ldquo;{data.spaceComplexityExplanation}&rdquo;
          </p>
        </div>
      </div>

      {/* Pro Tips */}
      {data.proTips && data.proTips.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>Interview Presentation Principles</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {data.proTips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2"
              >
                <span className="text-amber-400 font-bold">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
