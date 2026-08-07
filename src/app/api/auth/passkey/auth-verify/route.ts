export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { base64urlToUint8Array } from '@/lib/utils';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { getDeviceDetails } from '@/lib/device';

/**
 * POST /api/auth/passkey/auth-verify
 *
 * Body: { userId, credential }
 *
 * Verifies a WebAuthn authentication response and records:
 *   - Authenticated session with auto-detected device details
 *   - LoginHistory entry for Passkey WebAuthn login
 *   - TrustedDevice entry & RiskAssessment evaluation
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId, credential } = (body ?? {}) as {
    userId?: string;
    credential?: AuthenticationResponseJSON;
  };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }
  if (!credential || typeof credential !== 'object') {
    return errorResponse('Credential data is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:authverify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Retrieve (and consume) the single-use challenge.
    const expectedChallenge = getChallenge(userId);
    if (!expectedChallenge) {
      return errorResponse(
        'Your session has expired or no passkey request was made. Please try again.',
        410,
        'CHALLENGE_EXPIRED'
      );
    }

    // Look up the credential used.
    const passkey = await db.passkeyCredential.findFirst({
      where: { userId, credentialId: credential.id },
    });
    if (!passkey) {
      return errorResponse(
        'Passkey not recognized. Please try again.',
        404,
        'CREDENTIAL_NOT_FOUND'
      );
    }

    const { rpID, origins } = getWebAuthnConfig();

    // Convert the stored base64url public key back to Uint8Array for verification.
    const publicKeyUint8Array = base64urlToUint8Array(passkey.publicKey);

    let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: publicKeyUint8Array,
          counter: passkey.counter,
        },
        requireUserVerification: false,
      });
    } catch (err) {
      console.error('Passkey authentication verification error:', err);
      const message = err instanceof Error ? err.message : 'Passkey verification failed. Please try again.';
      return errorResponse(message, 400, 'VERIFICATION_FAILED');
    }

    if (!verification.verified) {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    // Update the stored counter (replay protection — counter must increase).
    await db.passkeyCredential.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const userAgent = request.headers.get('user-agent');
    const deviceDetails = getDeviceDetails(userAgent, ip);

    // Create an authenticated session (24-hour expiry) with full device info
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        userId,
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
      let trusted = await db.trustedDevice.findFirst({
        where: { userId, deviceFingerprint: deviceDetails.deviceFingerprint },
      });

      if (!trusted) {
        await db.trustedDevice.create({
          data: {
            userId,
            deviceName: deviceDetails.deviceName,
            browser: deviceDetails.browser,
            deviceFingerprint: deviceDetails.deviceFingerprint,
            location: deviceDetails.location,
            status: 'trusted',
          },
        });
      } else {
        await db.trustedDevice.update({
          where: { id: trusted.id },
          data: { lastActive: new Date(), location: deviceDetails.location },
        });
      }

      await db.loginHistory.create({
        data: {
          userId,
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
          userId,
          score: 5,
          level: 'Low',
          reasons: JSON.stringify(['Hardware Passkey Verified', 'FIDO2 Security Standard']),
          ipAddress: ip,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning during Passkey auth-verify:', auditErr);
    }

    return successResponse({
      verified: true,
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch (err) {
    console.error('Passkey auth-verify route error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
