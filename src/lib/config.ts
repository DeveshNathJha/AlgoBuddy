/**
 * AlgoBuddy - Shared configuration (safe to import from client and server).
 */

import type { AIProvider, ProgrammingLanguage } from './types';

/**
 * Number of free AI requests a signed-in user gets on the server's key.
 * Every AI action (Thinking Guide, Interview Script, Code Doctor, Explain Step)
 * costs one request. Users with their own key are never counted.
 * Override per deployment with NEXT_PUBLIC_FREE_AI_REQUESTS.
 */
export const FREE_AI_REQUEST_LIMIT = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_FREE_AI_REQUESTS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 15;
})();

/** Max characters accepted for a problem statement / code snippet. */
export const MAX_PROBLEM_LENGTH = 12000;
export const MAX_CODE_LENGTH = 20000;

/**
 * Default + curated models per provider.
 * Gemini 1.5 / 2.0 models are shut down; 2.5 is scheduled for shutdown on 2026-12-01.
 * Users can always click "Fetch live models" to pull the provider's current list.
 */
export const PROVIDER_MODELS: Record<AIProvider, { defaultModel: string; models: string[] }> = {
  gemini: {
    defaultModel: 'gemini-3.6-flash',
    models: ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'],
  },
  groq: {
    defaultModel: 'openai/gpt-oss-20b',
    models: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
  },
  openai: {
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
  },
};

/** Models that no longer exist; saved selections pointing at them are migrated. */
export const RETIRED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'qwen/qwen3.6-27b',
]);

export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  python: 'Python 3',
  java: 'Java',
  cpp: 'C++',
  javascript: 'JavaScript',
};

export function languageLabel(lang?: string): string {
  return LANGUAGE_LABELS[(lang || 'python') as ProgrammingLanguage] || 'Python 3';
}

/** Line-comment prefix per language (used in prompts so Python never gets `//`). */
export function commentPrefix(lang?: string): string {
  return lang === 'python' || !lang ? '#' : '//';
}

/** localStorage key for the light/dark theme choice (read by an inline script before paint). */
export const THEME_STORAGE_KEY = 'algobuddy_theme';
