export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential } = body as {
      userId: string;
      credential: RegistrationResponseJSON;
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

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { success: false, error: 'Registration verification failed' },
        { status: 400 }
      );
    }

    const { registrationInfo } = verification;

    // Store the credential in the database
    const newCredential = await db.passkeyCredential.create({
      data: {
        userId,
        credentialId: registrationInfo.credentialID,
        publicKey: registrationInfo.credentialPublicKey,
        counter: registrationInfo.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: registrationInfo.credentialDeviceType
          ? JSON.stringify(['internal'])
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      credentialId: newCredential.credentialId,
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
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
