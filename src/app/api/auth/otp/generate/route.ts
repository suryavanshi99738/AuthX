export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await db.user.create({
        data: { email },
      });
    }

    // Generate 6-digit OTP code
    const code = generateOTPCode();

    // Store OTP with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otpCode = await db.oTPCode.create({
      data: {
        userId: user.id,
        email,
        code,
        expiresAt,
      },
    });

    // In production, the OTP would be sent via email.
    // For development/demo, we return the code so users can verify.
    // NOTE: Remove `code` from the response in production!
    return NextResponse.json({
      success: true,
      otpId: otpCode.id,
      code, // Dev mode: return code for testing (remove in production)
      message: 'OTP sent to email',
      userId: user.id,
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
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
