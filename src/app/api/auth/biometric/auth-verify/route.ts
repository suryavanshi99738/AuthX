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
import { getDeviceDetails, type ClientHints } from '@/lib/device';

/**
 * POST /api/auth/biometric/auth-verify
 *
 * Body: { userId, credential, clientHints? }
 *
 * Verifies a WebAuthn authentication response for Biometric / Device Authentication.
 *
 * Identical cryptographic verification to Passkey auth-verify, but records:
 *   - loginMethod: 'Biometric'  (instead of 'Passkey WebAuthn')
 *   - riskLevel: 'Low' (platform authenticator is user-verifying hardware)
 *   - risk reasons: 'Biometric / Platform Authenticator Verified'
 *
 * AuthX NEVER receives or stores any biometric data. The WebAuthn assertion
 * proves the platform authenticator successfully verified the user — the
 * actual biometric matching is performed entirely by the OS/browser.
 *
 * Security Properties:
 *   - Challenge consumed (single-use, keyed biometric:userId)
 *   - Counter enforced (replay protection)
 *   - Session created with full device metadata
 *   - LoginHistory recorded as 'Biometric'
 *   - RiskAssessment recorded (Low risk — hardware-verified)
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId, credential, clientHints } = (body ?? {}) as {
    userId?: string;
    credential?: AuthenticationResponseJSON;
    clientHints?: ClientHints;
  };

  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }
  if (!credential || typeof credential !== 'object') {
    return errorResponse('Credential data is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`biometric:authverify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Retrieve (and consume) the single-use biometric challenge.
    const expectedChallenge = getChallenge(`biometric:${userId}`);
    if (!expectedChallenge) {
      return errorResponse(
        'Your session has expired or no biometric request was initiated. Please try again.',
        410,
        'CHALLENGE_EXPIRED'
      );
    }

    // Look up the credential used — PasskeyCredential table is shared with Passkey.
    const passkey = await db.passkeyCredential.findFirst({
      where: { userId, credentialId: credential.id },
    });
    if (!passkey) {
      return errorResponse(
        'Biometric credential not recognized. Please ensure you registered a passkey for this account.',
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
        // Platform authenticators must user-verify (biometric/PIN check done by OS).
        requireUserVerification: true,
      });
    } catch (err) {
      console.error('Biometric authentication verification error:', err);
      const message = err instanceof Error ? err.message : 'Biometric verification failed. Please try again.';
      return errorResponse(message, 400, 'VERIFICATION_FAILED');
    }

    if (!verification.verified) {
      return errorResponse(
        'Biometric verification failed. Please try again.',
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
    const deviceDetails = getDeviceDetails(userAgent, ip, clientHints);

    // Create an authenticated session (24-hour expiry) with full device info.
    // loginMethod is 'Biometric' — distinct from 'Passkey WebAuthn' in analytics.
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        userId,
        token,
        expiresAt,
        loginMethod: 'Biometric',
        isTrusted: true,
        instanceId: deviceDetails.instanceId,
        deviceName: deviceDetails.deviceName,
        deviceType: deviceDetails.deviceType,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceFingerprint: deviceDetails.deviceFingerprint,
        ipAddress: ip,
        location: deviceDetails.location,
        screenResolution: deviceDetails.screenResolution,
        timezone: deviceDetails.timezone,
        language: deviceDetails.language,
        platform: deviceDetails.platform,
        userAgent: userAgent || 'Mozilla/5.0',
      },
    });

    // Non-blocking audit logging (same pattern as passkey auth-verify).
    try {
      let trusted = await db.trustedDevice.findFirst({
        where: { userId, instanceId: deviceDetails.instanceId },
      });

      if (!trusted && deviceDetails.instanceId === deviceDetails.deviceFingerprint) {
        trusted = await db.trustedDevice.findFirst({
          where: { userId, deviceFingerprint: deviceDetails.deviceFingerprint },
        });
      }

      if (!trusted) {
        await db.trustedDevice.create({
          data: {
            userId,
            instanceId: deviceDetails.instanceId,
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
          data: {
            lastActive: new Date(),
            location: deviceDetails.location,
            instanceId: deviceDetails.instanceId,
            deviceName: deviceDetails.deviceName,
          },
        });
      }

      // LoginHistory: method = 'Biometric' — appears in analytics method breakdown.
      await db.loginHistory.create({
        data: {
          userId,
          method: 'Biometric',
          device: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location: deviceDetails.location,
          deviceId: deviceDetails.instanceId,
        },
      });

      // RiskAssessment: Low — platform authenticator is user-verifying hardware.
      await db.riskAssessment.create({
        data: {
          userId,
          score: 5,
          level: 'Low',
          reasons: JSON.stringify([
            'Biometric / Platform Authenticator Verified',
            'FIDO2 User Verification Required',
          ]),
          ipAddress: ip,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning during Biometric auth-verify:', auditErr);
    }

    return successResponse({
      verified: true,
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch (err) {
    console.error('Biometric auth-verify route error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
