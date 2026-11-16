import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/userStore';

export async function GET(req: NextRequest) {
  try {
    const users = getAllUsers();
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to list users.' },
      { status: 500 }
    );
  }
}
