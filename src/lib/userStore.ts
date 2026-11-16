/**
 * User verification, OTP and free-quota storage (server only).
 * Backed by `kv.ts` so it works across serverless instances when Upstash is configured.
 */

import crypto from 'crypto';
import { kvDecr, kvDel, kvGet, kvIncr, kvSet } from './kv';
import { FREE_AI_REQUEST_LIMIT } from './config';

const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
  'getnada.com',
  'trashmail.com',
  'fakeinbox.com',
  'mohmal.com',
  'generator.email',
  'mytemp.email',
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return !domain || DISPOSABLE_DOMAINS.has(domain);
}

function hashOtp(email: string, code: string): string {
  return crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
}

/** Generates a 6-digit code, stores only its hash, and resets the attempt counter. */
export async function generateAndStoreOtp(email: string): Promise<string> {
  const code = crypto.randomInt(100000, 1000000).toString();
  await kvSet(`otp:${email}`, hashOtp(email, code), OTP_TTL_SECONDS);
  await kvDel(`otp-attempts:${email}`);
  return code;
}

export type OtpResult = 'ok' | 'invalid' | 'expired' | 'locked';

export async function verifyOtp(email: string, code: string): Promise<OtpResult> {
  const stored = await kvGet(`otp:${email}`);
  if (!stored) return 'expired';

  const attempts = await kvIncr(`otp-attempts:${email}`, OTP_TTL_SECONDS);
  if (attempts > OTP_MAX_ATTEMPTS) {
    await kvDel(`otp:${email}`);
    return 'locked';
  }

  if (stored !== hashOtp(email, code.trim())) return 'invalid';

  await kvDel(`otp:${email}`);
  await kvDel(`otp-attempts:${email}`);
  return 'ok';
}

/**
 * Fixed-window rate limiter. Returns true when the action is allowed.
 * e.g. rateLimit(`send-otp:${email}`, 1, 60) => once per minute.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const count = await kvIncr(`rl:${key}`, windowSeconds);
  return count <= max;
}

export async function recordVerifiedUser(email: string, method: 'google' | 'otp', name?: string) {
  const existing = await kvGet(`user:${email}`);
  const prev = existing ? JSON.parse(existing) : {};
  await kvSet(
    `user:${email}`,
    JSON.stringify({
      email,
      name: name || prev.name || email.split('@')[0],
      authMethod: method,
      verifiedAt: prev.verifiedAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    })
  );
}

export async function getQuotaUsed(email: string): Promise<number> {
  return Number((await kvGet(`quota:${email}`)) || 0);
}

/**
 * Reserves one free request. Returns the new count, or null if the user is out of quota.
 * Reserving before the AI call (and refunding on failure) prevents parallel requests
 * from overshooting the limit.
 */
export async function reserveFreeRequest(email: string): Promise<number | null> {
  const used = await kvIncr(`quota:${email}`);
  if (used > FREE_AI_REQUEST_LIMIT) {
    await kvDecr(`quota:${email}`);
    return null;
  }
  return used;
}

export async function refundFreeRequest(email: string): Promise<void> {
  await kvDecr(`quota:${email}`);
}
