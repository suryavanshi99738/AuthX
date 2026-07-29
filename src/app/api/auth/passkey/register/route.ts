export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body as { userId: string; email: string };

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Get user's existing passkeys to exclude them
    const existingPasskeys = await db.passkeyCredential.findMany({
      where: { userId },
    });

    // @simplewebauthn/server v13 requires userID as Uint8Array, not string
    const userIDBuffer = new TextEncoder().encode(userId);

    const options = await generateRegistrationOptions({
      rpName: 'BankShield Auth',
      rpID: 'localhost',
      userID: userIDBuffer,
      userName: email,
      userDisplayName: email,
      excludeCredentials: existingPasskeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key' as const,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransport[])
          : undefined,
      })),
    });

    // Store the challenge for verification later
    setChallenge(userId, options.challenge);

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('Error generating registration options:', error);
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
