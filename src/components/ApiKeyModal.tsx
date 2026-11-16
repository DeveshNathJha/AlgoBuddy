'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { AIProvider } from '@/lib/types';
import { PROVIDER_MODELS } from '@/lib/config';
import Modal from './Modal';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
  apiKeys: Record<AIProvider, string>;
  selectedModels: Record<AIProvider, string>;
  onSaveKeys: (provider: AIProvider, key: string, model: string) => void;
  freeLimit: number;
}

const PROVIDERS: Record<AIProvider, { name: string; note: string; portalUrl: string; placeholder: string; steps: string[] }> = {
  gemini: {
    name: 'Google Gemini',
    note: 'Free, no credit card',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
    steps: ['Open Google AI Studio and sign in with your Google account.', 'Click "Create API key".', 'Copy the key and paste it below.'],
  },
  groq: {
    name: 'Groq',
    note: 'Free tier, very fast',
    portalUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    steps: ['Sign in at console.groq.com.', 'Open "API Keys" and click "Create API Key".', 'Copy the key and paste it below.'],
  },
  openai: {
    name: 'OpenAI',
    note: 'Paid, needs billing',
    portalUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    steps: ['Open platform.openai.com/api-keys.', 'Click "Create new secret key".', 'Copy the key and paste it below.'],
  },
};

export default function ApiKeyModal({ isOpen, onClose, provider, setProvider, apiKeys, selectedModels, onSaveKeys, freeLimit }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const curated = PROVIDER_MODELS[provider].models;
    const saved = selectedModels[provider] || PROVIDER_MODELS[provider].defaultModel;
    setKeyInput(apiKeys[provider] || '');
    setModel(saved);
    setModels(curated.includes(saved) ? curated : [saved, ...curated]);
    setStatus(null);
  }, [provider, apiKeys, selectedModels, isOpen]);

  const meta = PROVIDERS[provider];
  const hasSavedKey = Boolean(apiKeys[provider]?.trim());

  const fetchModels = async () => {
    if (!keyInput.trim()) {
      setStatus('Paste your key first.');
      return;
    }
    setFetching(true);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key: keyInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.live && data.models?.length) {
        const preferred = PROVIDER_MODELS[provider].defaultModel;
        setModels(data.models);
        if (!data.models.includes(model)) setModel(data.models.includes(preferred) ? preferred : data.models[0]);
        setStatus(`Your key can use ${data.models.length} models.`);
      } else {
        setStatus('Could not list models with this key. Check that it is correct.');
      }
    } catch {
      setStatus('Could not reach the provider. Check your connection.');
    } finally {
      setFetching(false);
    }
  };

  const save = () => {
    if (!keyInput.trim()) {
      setStatus('Paste your API key first.');
      return;
    }
    onSaveKeys(provider, keyInput.trim(), model || PROVIDER_MODELS[provider].defaultModel);
    onClose();
  };

  const footer = (
    <>
      {hasSavedKey ? (
        <button
          onClick={() => {
            onSaveKeys(provider, '', PROVIDER_MODELS[provider].defaultModel);
            setKeyInput('');
          }}
          className="btn-ghost text-danger"
        >
          Remove key
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button onClick={save} className="btn-primary">
          Save
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI provider and API key"
      subtitle={`Optional. Signed-in users get ${freeLimit} free requests. Add your own free key for unlimited use.`}
      footer={footer}
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Provider">
          {(Object.keys(PROVIDERS) as AIProvider[]).map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={provider === p}
              onClick={() => setProvider(p)}
              className={`rounded-lg border p-2.5 text-left transition ${provider === p ? 'border-accent bg-accent/10' : 'border-border hover:bg-surface-2'}`}
            >
              <span className="flex items-center justify-between gap-1 font-medium text-fg">
                {PROVIDERS[p].name}
                {apiKeys[p] && <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Key saved" />}
              </span>
              <span className="text-xs text-fg-subtle">{PROVIDERS[p].note}</span>
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-surface-2 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="font-medium text-fg">Get a {meta.name} key in a minute</p>
            <a href={meta.portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-text hover:underline">
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal pl-5 space-y-0.5 text-fg-muted">
            {meta.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        <label className="block">
          <span className="flex items-center justify-between mb-1">
            <span className="font-medium text-fg">API key</span>
            {hasSavedKey && <span className="text-xs text-success">Saved in this browser</span>}
          </span>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder={meta.placeholder} className="input font-mono" autoComplete="off" />
        </label>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="model-select" className="font-medium text-fg">
              Model
            </label>
            <button type="button" onClick={fetchModels} disabled={fetching} className="btn-ghost btn-sm -mr-2">
              <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} /> Fetch models for my key
            </button>
          </div>
          <select id="model-select" value={model} onChange={(e) => setModel(e.target.value)} className="input font-mono">
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {status && <p className="rounded-lg bg-accent/10 px-3 py-2 text-fg">{status}</p>}

        <p className="text-xs text-fg-subtle leading-5">
          Your key is stored only in this browser. With each request it is sent over HTTPS to the AlgoBuddy server, which passes it to {meta.name} and never
          stores or logs it. Tip: make a separate key just for AlgoBuddy so you can revoke it any time.
        </p>
      </div>
    </Modal>
  );
}
