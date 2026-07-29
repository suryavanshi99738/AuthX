export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Delete all demo users (cascade will delete sessions, passkeys, otpCodes)
    const result = await db.user.deleteMany({
      where: { isDemo: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Demo data cleaned up',
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error cleaning up demo data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
