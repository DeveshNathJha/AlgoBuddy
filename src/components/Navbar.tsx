'use client';

import { Moon, Sun, KeyRound, BrainCircuit } from 'lucide-react';
import { AIProvider, FreeQuota } from '@/lib/types';
import { useTheme } from './Providers';

export type AppTab = 'thinking' | 'visualizer' | 'interview' | 'notes';

const TABS: { id: AppTab; label: string }[] = [
  { id: 'thinking', label: 'How to Think' },
  { id: 'visualizer', label: 'Debugger' },
  { id: 'interview', label: 'Interview Prep' },
  { id: 'notes', label: 'Notes' },
];

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activeProvider: AIProvider;
  hasActiveKey: boolean;
  onOpenKeyModal: () => void;
  userEmail: string | null;
  onOpenAuthModal: () => void;
  quota: FreeQuota;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  activeProvider,
  hasActiveKey,
  onOpenKeyModal,
  userEmail,
  onOpenAuthModal,
  quota,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const remaining = Math.max(0, quota.limit - quota.used);

  const keyLabel = hasActiveKey
    ? `${activeProvider === 'gemini' ? 'Gemini' : activeProvider === 'groq' ? 'Groq' : 'OpenAI'} key`
    : userEmail
    ? `${remaining} of ${quota.limit} free left`
    : `${quota.limit} free requests`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 md:py-0 md:h-14 flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 shrink-0 mr-auto md:mr-0">
          <span className="p-1.5 rounded-lg bg-accent text-white">
            <BrainCircuit className="w-4 h-4" />
          </span>
          <span className="font-semibold text-fg">AlgoBuddy</span>
        </div>

        <nav className="order-last md:order-none w-full md:w-auto md:flex-1 flex items-center gap-1 overflow-x-auto -mx-1 px-1" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-current={activeTab === t.id ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === t.id ? 'bg-accent/10 text-accent-text' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenKeyModal}
            className={`btn btn-sm border ${
              hasActiveKey
                ? 'border-success/40 text-success'
                : userEmail && remaining === 0
                ? 'border-danger/40 text-danger'
                : 'border-border text-fg-muted hover:text-fg'
            }`}
            title="AI provider and API key settings"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{keyLabel}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="btn-ghost p-2"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button onClick={onOpenAuthModal} className={userEmail ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}>
            {userEmail ? <span className="max-w-[110px] truncate">{userEmail.split('@')[0]}</span> : 'Sign in'}
          </button>
        </div>
      </div>
    </header>
  );
}
