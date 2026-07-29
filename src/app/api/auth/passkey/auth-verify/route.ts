export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential } = body as {
      userId: string;
      credential: AuthenticationResponseJSON;
    };

    if (!userId || !credential) {
      return NextResponse.json(
        { success: false, error: 'userId and credential are required' },
        { status: 400 }
      );
    }

    // Retrieve the stored challenge
    const expectedChallenge = getChallenge(userId);
    if (!expectedChallenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Get the passkey credential from the database
    const passkey = await db.passkeyCredential.findFirst({
      where: {
        userId,
        credentialId: credential.id,
      },
    });

    if (!passkey) {
      return NextResponse.json(
        { success: false, error: 'Passkey credential not found' },
        { status: 400 }
      );
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { success: false, error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Update the counter in the database
    await db.passkeyCredential.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
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
