export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { uint8ArrayToBase64url, isUint8Array } from '@/lib/utils';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/passkey/signup/verify
 *
 * Body: { prospectiveUserId, credential }
 *
 * Verifies the WebAuthn registration response against the stored challenge.
 * On success:
 *   1. Creates the User account (with the prospective userId) — email verified.
 *   2. Stores the public credential (credentialId, publicKey, counter, ...).
 *   3. Creates an authenticated session.
 *   4. Deletes the pending PasskeySignup record.
 *
 * On failure or expiry, the pending record is preserved so the user can
 * re-request options without re-entering the sign-up form (only the challenge
 * is single-use).
 *
 * Private keys never leave the user's device.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { prospectiveUserId, credential } = (body ?? {}) as {
    prospectiveUserId?: string;
    credential?: RegistrationResponseJSON;
  };
  if (!prospectiveUserId || typeof prospectiveUserId !== 'string') {
    return errorResponse('Session token is required.', 400);
  }
  if (!credential || typeof credential !== 'object') {
    return errorResponse('Credential data is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:signup:verify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Look up the pending sign-up record.
    const pending = await db.passkeySignup.findFirst({
      where: { prospectiveUserId },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) {
      return errorResponse(
        'No active sign-up found. Please start again.',
        404,
        'SIGNUP_NOT_FOUND'
      );
    }
    if (new Date() > pending.expiresAt) {
      // Clean up the expired record.
      await db.passkeySignup.delete({ where: { id: pending.id } }).catch(() => {});
      return errorResponse(
        'Your sign-up session has expired. Please try again.',
        410,
        'SIGNUP_EXPIRED'
      );
    }

    // Re-check the email was not registered in the meantime (race safety).
    const existingUser = await db.user.findUnique({
      where: { email: pending.email },
      select: { id: true },
    });
    if (existingUser) {
      await db.passkeySignup.delete({ where: { id: pending.id } }).catch(() => {});
      return errorResponse(
        'An account with this email already exists. Please log in instead.',
        409,
        'EMAIL_EXISTS'
      );
    }

    // Retrieve (and consume) the single-use challenge.
    const expectedChallenge = getChallenge(prospectiveUserId);
    if (!expectedChallenge) {
      return errorResponse(
        'Your passkey request has expired. Please request a new one.',
        410,
        'CHALLENGE_EXPIRED'
      );
    }

    const { rpID, origin } = getWebAuthnConfig();

    let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    if (!verification.verified || !verification.registrationInfo) {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    const { registrationInfo } = verification;

    // Convert Uint8Array fields to base64url strings for SQLite storage.
    const credentialId = isUint8Array(registrationInfo.credentialID)
      ? uint8ArrayToBase64url(registrationInfo.credentialID as Uint8Array)
      : (registrationInfo.credentialID as string);

    const publicKey = isUint8Array(registrationInfo.credentialPublicKey)
      ? uint8ArrayToBase64url(registrationInfo.credentialPublicKey as Uint8Array)
      : (registrationInfo.credentialPublicKey as string);

    // Guard against a duplicate credential id (should be extremely rare).
    const dup = await db.passkeyCredential.findUnique({
      where: { credentialId },
      select: { id: true },
    });
    if (dup) {
      return errorResponse('This passkey is already registered.', 409, 'DUPLICATE_CREDENTIAL');
    }

    // Create the user account with the prospective id (so the credential's
    // user association matches). emailVerified = true because the passkey
    // ceremony proves device possession.
    await db.user.create({
      data: {
        id: pending.prospectiveUserId,
        email: pending.email,
        name: pending.fullName,
        phone: pending.phone,
        emailVerified: true,
      },
    });

    await db.passkeyCredential.create({
      data: {
        userId: pending.prospectiveUserId,
        credentialId,
        publicKey,
        counter: registrationInfo.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: JSON.stringify(registrationInfo.credentialTransports ?? ['internal']),
      },
    });

    // Create an authenticated session (24-hour expiry).
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        userId: pending.prospectiveUserId,
        token,
        expiresAt,
      },
    });

    // Clean up the pending sign-up record.
    await db.passkeySignup.delete({ where: { id: pending.id } }).catch(() => {});

    return successResponse({
      verified: true,
      user: {
        id: pending.prospectiveUserId,
        email: pending.email,
        name: pending.fullName,
      },
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
