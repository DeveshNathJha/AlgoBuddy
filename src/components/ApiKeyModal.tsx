'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  Check,
  AlertCircle,
  Trash2,
  X,
  RefreshCw,
  ShieldCheck,
  Lock,
  Sparkles
} from 'lucide-react';
import { AIProvider } from '@/lib/types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
  apiKeys: Record<AIProvider, string>;
  selectedModels: Record<AIProvider, string>;
  onSaveKeys: (provider: AIProvider, key: string, model: string) => void;
}

const PROVIDER_METADATA: Record<
  AIProvider,
  {
    name: string;
    description: string;
    portalUrl: string;
    placeholder: string;
    defaultModel: string;
    supportedModels: string[];
    features: string[];
    stepsToGet: string[];
  }
> = {
  gemini: {
    name: 'Google Gemini',
    description: 'Generous free tier via Google AI Studio. No credit card required.',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
    defaultModel: 'gemini-1.5-flash',
    supportedModels: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    features: ['Generous free rate limits', 'No credit card required', 'Sub-second latency'],
    stepsToGet: [
      'Open Google AI Studio with your personal Gmail account.',
      'Click the blue "Create API Key" button.',
      'Copy the generated key and paste it below. (100% Free)',
    ],
  },
  groq: {
    name: 'Groq Cloud',
    description: 'Ultra-fast LPU inference hosting active open-weight models.',
    portalUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    defaultModel: 'openai/gpt-oss-20b',
    supportedModels: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'],
    features: ['Ultra-fast LPU tokens/sec', 'Free developer tier', 'Production open models'],
    stepsToGet: [
      'Sign in to console.groq.com with Google or GitHub.',
      'Navigate to API Keys in the left sidebar.',
      'Click "Create API Key", copy the key, and paste it below.',
    ],
  },
  openai: {
    name: 'OpenAI',
    description: 'Industry benchmark models including GPT-4o and GPT-4o-mini.',
    portalUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
    defaultModel: 'gpt-4o-mini',
    supportedModels: ['gpt-4o-mini', 'gpt-4o'],
    features: ['Standard benchmark quality', 'Requires billing account', 'High consistency'],
    stepsToGet: [
      'Visit platform.openai.com/api-keys.',
      'Click "Create new secret key".',
      'Copy and paste your key below.',
    ],
  },
};

export default function ApiKeyModal({
  isOpen,
  onClose,
  provider,
  setProvider,
  apiKeys,
  selectedModels,
  onSaveKeys,
}: ApiKeyModalProps) {
  const [currentInputKey, setCurrentInputKey] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const activeMeta = PROVIDER_METADATA[provider];
    setCurrentInputKey(apiKeys[provider] || '');
    setCurrentModel(selectedModels[provider] || activeMeta.defaultModel);
    setAvailableModels(activeMeta.supportedModels);
    setStatus(null);
  }, [provider, apiKeys, selectedModels, isOpen]);

  const handleFetchLiveModels = async () => {
    if (!currentInputKey.trim()) {
      setStatus('Please enter an API key first to discover live models.');
      return;
    }

    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          key: currentInputKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        if (!data.models.includes(currentModel)) {
          setCurrentModel(data.models[0]);
        }
        setStatus(`Discovered ${data.models.length} active models from provider.`);
      }
    } catch (e: any) {
      console.warn('Failed to fetch live models:', e);
    } finally {
      setIsFetchingModels(false);
    }
  };

  if (!isOpen) return null;

  const activeMeta = PROVIDER_METADATA[provider];
  const hasSavedKey = !!(apiKeys[provider] && apiKeys[provider].trim().length > 0);

  const handleSave = () => {
    if (!currentInputKey.trim()) {
      setStatus('Please enter a valid API key.');
      return;
    }

    onSaveKeys(provider, currentInputKey.trim(), currentModel || activeMeta.defaultModel);
    setStatus(`Credentials saved for ${activeMeta.name}.`);
    setTimeout(() => {
      setStatus(null);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    onSaveKeys(provider, '', activeMeta.defaultModel);
    setCurrentInputKey('');
    setStatus(`Credentials removed for ${activeMeta.name}.`);
    setTimeout(() => setStatus(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Provider &amp; Key Settings</h2>
            <p className="text-xs text-slate-400">
              Configure credentials for unlimited practice after your 2 complimentary questions.
            </p>
          </div>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['gemini', 'groq', 'openai'] as AIProvider[]).map((p) => {
            const isSelected = provider === p;
            const hasKey = !!apiKeys[p];

            return (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold">{PROVIDER_METADATA[p].name}</span>
                  {hasKey && <span className="w-2 h-2 rounded-full bg-emerald-400" title="Configured" />}
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {PROVIDER_METADATA[p].defaultModel}
                </span>
              </button>
            );
          })}
        </div>

        {/* How to Get Key 3-Step Guide Card */}
        <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 mb-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              How to get a free {activeMeta.name} key (1-Minute):
            </span>
            <a
              href={activeMeta.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium text-[11px] underline"
            >
              Open Key Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
            {activeMeta.stepsToGet.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Key Input Field */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-300">
              {activeMeta.name} API Key
            </label>
            {hasSavedKey && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <Check className="w-3 h-3" /> Saved on this browser
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder={activeMeta.placeholder}
            value={currentInputKey}
            onChange={(e) => setCurrentInputKey(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
          />
        </div>

        {/* Model Selector Dropdown & Live Discover */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-300">Model</label>
            {provider === 'groq' && (
              <button
                type="button"
                onClick={handleFetchLiveModels}
                disabled={isFetchingModels}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                <span>Fetch live models</span>
              </button>
            )}
          </div>

          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Security & Privacy Guarantee Card */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300/90 flex items-start gap-2.5 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-300">Your API Key is 100% Safe &amp; Private</p>
            <p className="text-slate-400 leading-relaxed">
              Keys are stored strictly inside your browser&apos;s local storage. They are never sent to or logged on our servers. You can delete or revoke your key at any time.
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {status && (
          <div className="mb-4 text-xs p-2.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/80 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{status}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {hasSavedKey ? (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/40 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
