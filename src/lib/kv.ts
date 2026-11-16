/**
 * Tiny key-value store used for sessions, OTPs, rate limits and free quota.
 *
 * Production (Vercel): uses Upstash Redis over its REST API. Set either
 *   KV_REST_API_URL + KV_REST_API_TOKEN            (Vercel "Upstash for Redis" integration)
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * Local dev: falls back to an in-process Map. That fallback is NOT safe on
 * serverless, because each instance has its own memory, so OTPs and quotas
 * would be lost or bypassed. `isPersistentStore()` lets callers warn about that.
 */

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

const memory = new Map<string, { value: string; expiresAt: number | null }>();

export function isPersistentStore(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
}

async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`KV error: ${data.error || res.status}`);
  }
  return data.result as T;
}

function memGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export async function kvGet(key: string): Promise<string | null> {
  if (isPersistentStore()) return redis<string | null>(['GET', key]);
  return memGet(key);
}

export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (isPersistentStore()) {
    await redis(ttlSeconds ? ['SET', key, value, 'EX', ttlSeconds] : ['SET', key, value]);
    return;
  }
  memory.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
}

export async function kvDel(key: string): Promise<void> {
  if (isPersistentStore()) {
    await redis(['DEL', key]);
    return;
  }
  memory.delete(key);
}

/** Atomically increments a counter. `ttlSeconds` is applied when the key is first created. */
export async function kvIncr(key: string, ttlSeconds?: number): Promise<number> {
  if (isPersistentStore()) {
    const value = await redis<number>(['INCR', key]);
    if (ttlSeconds && value === 1) await redis(['EXPIRE', key, ttlSeconds]);
    return value;
  }
  const current = Number(memGet(key) || 0) + 1;
  const existing = memory.get(key);
  memory.set(key, {
    value: String(current),
    expiresAt: existing?.expiresAt ?? (ttlSeconds ? Date.now() + ttlSeconds * 1000 : null),
  });
  return current;
}

export async function kvDecr(key: string): Promise<void> {
  if (isPersistentStore()) {
    await redis(['DECR', key]);
    return;
  }
  const current = Number(memGet(key) || 0);
  const existing = memory.get(key);
  memory.set(key, { value: String(Math.max(0, current - 1)), expiresAt: existing?.expiresAt ?? null });
}
