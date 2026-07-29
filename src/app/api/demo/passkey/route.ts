export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { demoUserId } = body as { demoUserId: string };

    if (!demoUserId) {
      return NextResponse.json(
        { success: false, error: 'demoUserId is required' },
        { status: 400 }
      );
    }

    // Simulated passkey authentication for demo mode
    // No real WebAuthn verification is performed
    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Demo passkey verified',
    });
  } catch (error) {
    console.error('Error in demo passkey verification:', error);
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
