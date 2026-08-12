export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { getChallenge, setChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { verifyAuthenticationResponse, generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { base64urlToUint8Array } from '@/lib/utils';
import { issueStepUpToken, STEPUP_SCOPE } from '@/lib/stepup-store';

/**
 * POST /api/lockdown/stepup/passkey
 * 
 * Two sub-actions:
 *
 * action: 'challenge'  — Body: { sessionToken }
 *   → Generates a fresh WebAuthn authentication challenge.
 *   → Uses the EXISTING challenge-store (single-use, 5-min TTL).
 *   → Rate limited.
 *
 * action: 'verify'  — Body: { sessionToken, credential }
 *   → Verifies the WebAuthn assertion against stored challenge + public key.
 *   → Updates counter (replay protection).
 *   → Issues step-up token on success.
 *   → Uses the EXISTING verifyAuthenticationResponse + credential lookup.
 *
 * Security:
 *  - userId derived from session — never trusted from body
 *  - Full WebAuthn assertion verification (challenge, rpId, origin, counter)
 *  - Rate limited per IP and per user
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { sessionToken, action, credential } = (body ?? {}) as {
    sessionToken?: string;
    action?: 'challenge' | 'verify';
    credential?: AuthenticationResponseJSON;
  };

  if (!sessionToken || typeof sessionToken !== 'string') {
    return errorResponse('Authenticated session is required.', 401);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`lockdown:stepup:passkey:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Derive authenticated user from session
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.status === 'revoked' || new Date() > session.expiresAt) {
      return errorResponse('Invalid or expired session. Please log in again.', 401);
    }

    const userId = session.userId;

    // ── CHALLENGE (step 1) ────────────────────────────────────────
    if (action === 'challenge') {
      const passkeys = await db.passkeyCredential.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      });

      if (passkeys.length === 0) {
        return errorResponse(
          'No passkey is registered for this account.',
          404,
          'NO_PASSKEY'
        );
      }

      const { rpID } = getWebAuthnConfig();
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: passkeys.map((p) => ({
          id: p.credentialId,
          type: 'public-key' as const,
          transports: p.transports
            ? (JSON.parse(p.transports) as AuthenticatorTransport[])
            : undefined,
        })),
        userVerification: 'preferred',
      });

      // Store challenge keyed by userId (single-use via challenge-store)
      // Use a lockdown-specific prefix to prevent interference with login challenges
      setChallenge(`lockdown:${userId}`, options.challenge);

      return successResponse({ options });
    }

    // ── VERIFY (step 2) ────────────────────────────────────────────
    if (action === 'verify') {
      if (!credential || typeof credential !== 'object') {
        return errorResponse('Credential data is required.', 400);
      }

      const userRl = rateLimit(`lockdown:stepup:passkey:user:${userId}`, 10, 10 * 60 * 1000);
      if (!userRl.allowed) return rateLimitedResponse(userRl.resetAt);

      // Retrieve and consume the lockdown-scoped challenge
      const expectedChallenge = getChallenge(`lockdown:${userId}`);
      if (!expectedChallenge) {
        return errorResponse(
          'Challenge expired or not found. Please restart the passkey verification.',
          410,
          'CHALLENGE_EXPIRED'
        );
      }

      const passkey = await db.passkeyCredential.findFirst({
        where: { userId, credentialId: credential.id },
      });

      if (!passkey) {
        return errorResponse('Passkey not recognized.', 404, 'CREDENTIAL_NOT_FOUND');
      }

      const { rpID, origins } = getWebAuthnConfig();
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
        const msg = err instanceof Error ? err.message : 'Passkey verification failed.';
        return errorResponse(msg, 400, 'VERIFICATION_FAILED');
      }

      if (!verification.verified) {
        return errorResponse('Passkey verification failed. Please try again.', 400, 'VERIFICATION_FAILED');
      }

      // Update counter (replay protection)
      await db.passkeyCredential.update({
        where: { id: passkey.id },
        data: { counter: verification.authenticationInfo.newCounter },
      });

      // Issue scoped step-up token
      const stepUpToken = issueStepUpToken(userId, 'passkey', STEPUP_SCOPE);

      return successResponse({
        verified: true,
        stepUpToken,
        method: 'Passkey',
        expiresInSeconds: 300,
        scope: STEPUP_SCOPE,
      });
    }

    return errorResponse("Invalid action. Must be 'challenge' or 'verify'.", 400);
  } catch (err) {
    console.error('Lockdown step-up passkey error:', err);
    return errorResponse('Verification failed. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
