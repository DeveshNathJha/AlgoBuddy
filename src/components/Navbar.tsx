'use client';

import React from 'react';
import { Terminal, BrainCircuit, Mic, Key, LogIn, CheckCircle2, Cpu, BookOpen } from 'lucide-react';
import { AIProvider } from '@/lib/types';

interface NavbarProps {
  activeTab: 'visualizer' | 'thinking' | 'interview' | 'notes';
  setActiveTab: (tab: 'visualizer' | 'thinking' | 'interview' | 'notes') => void;
  activeProvider: AIProvider;
  hasActiveKey: boolean;
  onOpenKeyModal: () => void;
  userEmail: string | null;
  onOpenAuthModal: () => void;
  freeQuestionsUsed: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  activeProvider,
  hasActiveKey,
  onOpenKeyModal,
  userEmail,
  onOpenAuthModal,
  freeQuestionsUsed,
}: NavbarProps) {
  const providerLabel = activeProvider.toUpperCase();
  const freeRemaining = Math.max(0, 2 - freeQuestionsUsed);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">AlgoBuddy</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                DSA Coach
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Algorithmic Problem Solving &amp; Interview Presentation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('thinking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'thinking'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thinking Guide</span>
            <span className="sm:hidden">Thinking</span>
          </button>

          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'visualizer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dry Run</span>
            <span className="sm:hidden">Trace</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'interview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Interview Script</span>
            <span className="sm:hidden">Script</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Notes</span>
            <span className="sm:hidden">Notes</span>
          </button>
        </nav>

        {/* Provider, Key & Auth Status */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenKeyModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              hasActiveKey
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/30'
                : freeRemaining > 0
                ? 'bg-amber-950/40 border-amber-800/50 text-amber-300 hover:bg-amber-900/30'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/30'
              }`}
            title="Configure AI Provider & Key"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px] font-semibold">{providerLabel}</span>
            <span className="text-[11px]">
              {hasActiveKey
                ? 'Configured'
                : freeRemaining > 0
                ? `${freeRemaining} Free Left`
                : 'Set Key'}
            </span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
          >
            {userEmail ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[100px] truncate text-slate-200">
                  {userEmail.split('@')[0]}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Sign In</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
