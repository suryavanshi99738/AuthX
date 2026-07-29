export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Create demo user
    const demoUser = await db.user.create({
      data: {
        email: 'demo@bankshield.app',
        name: 'Demo User',
        isDemo: true,
      },
    });

    // Create demo session with 30-minute expiry
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const demoSession = await db.session.create({
      data: {
        userId: demoUser.id,
        token,
        isDemo: true,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      demoUser: {
        id: demoUser.id,
        email: demoUser.email,
      },
      demoSession: {
        token: demoSession.token,
        expiresAt: demoSession.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error starting demo:', error);
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
