/**
 * Signed session cookie (server only).
 *
 * The old app trusted whatever email the browser kept in localStorage, so anyone
 * could call the AI routes and spend the owner's key. Now the server issues an
 * HMAC-signed, httpOnly cookie after a verified OTP or Google sign-in, and the
 * AI routes read the email from that cookie only.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const COOKIE_NAME = 'ab_session';
const SESSION_DAYS = 30;

let devSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (32+ chars) must be set in production.');
  }
  devSecret = devSecret || crypto.randomBytes(32).toString('hex');
  return devSecret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (typeof data.email !== 'string' || typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return data.email;
  } catch {
    return null;
  }
}

/** Returns the verified email of the current request, or null. */
export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export function attachSessionCookie(res: NextResponse, email: string): NextResponse {
  res.cookies.set(COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
