export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Find the demo user
    const user = await db.user.findUnique({
      where: { id: demoUserId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Demo user not found' },
        { status: 404 }
      );
    }

    // Generate a fixed demo OTP code
    const demoCode = '123456';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store the OTP in the database
    await db.oTPCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: demoCode,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      otpCode: demoCode,
      message: 'Demo OTP: 123456',
    });
  } catch (error) {
    console.error('Error generating demo OTP:', error);
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
