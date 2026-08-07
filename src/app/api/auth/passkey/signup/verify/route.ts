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
import { getDeviceDetails } from '@/lib/device';

/**
 * POST /api/auth/passkey/signup/verify
 *
 * Body: { prospectiveUserId, credential }
 *
 * Verifies the WebAuthn registration response against the stored challenge.
 * On success:
 *   1. Creates the User account (with the prospective userId) — email verified.
 *   2. Stores the public credential.
 *   3. Creates an authenticated session with auto-detected device details.
 *   4. Logs LoginHistory, TrustedDevice, and RiskAssessment audit entries.
 *   5. Deletes the pending PasskeySignup record.
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

    const { rpID, origins } = getWebAuthnConfig();

    let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
    } catch (err) {
      console.error('Passkey signup verification error:', err);
      const message = err instanceof Error ? err.message : 'Passkey verification failed. Please try again.';
      return errorResponse(message, 400, 'VERIFICATION_FAILED');
    }

    if (!verification.verified || !verification.registrationInfo) {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    const { registrationInfo } = verification;

    // Safely extract fields supporting @simplewebauthn/server v13 schema
    const rawCredentialId =
      (registrationInfo as Record<string, unknown>)?.credential
        ? (registrationInfo as { credential: { id: string } }).credential.id
        : (registrationInfo as Record<string, unknown>)?.credentialID ?? credential.id;

    if (!rawCredentialId) {
      return errorResponse('Invalid credential ID generated.', 400, 'INVALID_CREDENTIAL');
    }

    const credentialId = isUint8Array(rawCredentialId)
      ? uint8ArrayToBase64url(rawCredentialId as Uint8Array)
      : String(rawCredentialId);

    const rawPublicKey =
      (registrationInfo as Record<string, unknown>)?.credential
        ? (registrationInfo as { credential: { publicKey: Uint8Array } }).credential.publicKey
        : (registrationInfo as Record<string, unknown>)?.credentialPublicKey;

    if (!rawPublicKey) {
      return errorResponse('Invalid public key generated.', 400, 'INVALID_PUBLIC_KEY');
    }

    const publicKey = isUint8Array(rawPublicKey)
      ? uint8ArrayToBase64url(rawPublicKey as Uint8Array)
      : String(rawPublicKey);

    const counter =
      (registrationInfo as Record<string, unknown>)?.credential
        ? (registrationInfo as { credential: { counter: number } }).credential.counter
        : (registrationInfo as Record<string, unknown>)?.counter ?? 0;

    // Guard against a duplicate credential id
    const dup = await db.passkeyCredential.findUnique({
      where: { credentialId },
      select: { id: true },
    });
    if (dup) {
      return errorResponse('This passkey is already registered.', 409, 'DUPLICATE_CREDENTIAL');
    }

    // Create the user account with prospective id
    const createdUser = await db.user.create({
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
        counter: Number(counter),
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: JSON.stringify(registrationInfo.credentialTransports ?? ['internal']),
      },
    });

    const userAgent = request.headers.get('user-agent');
    const deviceDetails = getDeviceDetails(userAgent, ip);

    // Create an authenticated session (24-hour expiry) with auto-detected device details
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        userId: pending.prospectiveUserId,
        token,
        expiresAt,
        loginMethod: 'Passkey WebAuthn',
        isTrusted: true,
        deviceName: deviceDetails.deviceName,
        deviceType: deviceDetails.deviceType,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceFingerprint: deviceDetails.deviceFingerprint,
        ipAddress: ip,
        location: deviceDetails.location,
        platform: deviceDetails.isMobile ? 'Mobile' : 'Win32',
        userAgent: userAgent || 'Mozilla/5.0',
      },
    });

    // Safely record LoginHistory, TrustedDevice, and RiskAssessment
    try {
      await db.trustedDevice.create({
        data: {
          userId: pending.prospectiveUserId,
          deviceName: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          deviceFingerprint: deviceDetails.deviceFingerprint,
          location: deviceDetails.location,
          status: 'trusted',
        },
      });

      await db.loginHistory.create({
        data: {
          userId: pending.prospectiveUserId,
          method: 'Passkey WebAuthn',
          device: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location: deviceDetails.location,
          deviceId: `dev_${deviceDetails.deviceFingerprint}`,
        },
      });

      await db.riskAssessment.create({
        data: {
          userId: pending.prospectiveUserId,
          score: 5,
          level: 'Low',
          reasons: JSON.stringify(['Passkey Account Creation', 'Hardware Passkey Bound']),
          ipAddress: ip,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning during Passkey signup verify:', auditErr);
    }

    // Clean up the pending sign-up record.
    await db.passkeySignup.delete({ where: { id: pending.id } }).catch(() => {});

    return successResponse({
      verified: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
      },
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch (err) {
    console.error('Passkey signup verify route error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
