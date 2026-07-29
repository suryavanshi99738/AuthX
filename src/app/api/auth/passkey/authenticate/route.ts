export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user's passkeys
    const passkeys = await db.passkeyCredential.findMany({
      where: { userId },
    });

    if (passkeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No passkeys registered for this user' },
        { status: 400 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      allowCredentials: passkeys.map((passkey) => ({
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
    console.error('Error generating authentication options:', error);
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
