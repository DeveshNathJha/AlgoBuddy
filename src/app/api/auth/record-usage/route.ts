import { NextRequest, NextResponse } from 'next/server';
import { incrementUserQuota, getUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const count = incrementUserQuota(email);
    const user = getUser(email);

    return NextResponse.json({
      success: true,
      questionsUsed: count,
      user,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
