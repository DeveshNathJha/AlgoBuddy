import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionEmail } from '@/lib/session';
import { getQuotaUsed } from '@/lib/userStore';
import { FREE_AI_REQUEST_LIMIT } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** GET /api/auth/session -> current user + free quota (the server is the source of truth). */
export async function GET() {
  try {
    const email = await getSessionEmail();
    return NextResponse.json({
      email,
      quota: { used: email ? await getQuotaUsed(email) : 0, limit: FREE_AI_REQUEST_LIMIT },
    });
  } catch {
    return NextResponse.json({ email: null, quota: { used: 0, limit: FREE_AI_REQUEST_LIMIT } });
  }
}

/** DELETE /api/auth/session -> sign out. */
export async function DELETE() {
  return clearSessionCookie(NextResponse.json({ success: true }));
}
