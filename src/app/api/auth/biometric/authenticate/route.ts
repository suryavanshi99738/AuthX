export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/biometric/authenticate
 *
 * Body: { userId }
 *
 * Generates WebAuthn authentication options for Biometric / Device Authentication.
 *
 * Uses the same PasskeyCredential table as Passkey login — biometric auth reuses
 * the existing WebAuthn credential infrastructure. The distinction is:
 *   - userVerification: 'required'  (biometric/PIN must be used, not just presence)
 *   - The browser will preferentially invoke a platform authenticator
 *     (Touch ID, Face ID, Windows Hello, device PIN)
 *   - AuthX never sees, stores, or processes any biometric data.
 *     The OS/platform handles the actual biometric verification.
 *
 * NOTE: "Biometric" is a user-facing label for platform-authenticator WebAuthn.
 * Both Passkey and Biometric use the same underlying FIDO2/WebAuthn standard.
 * AuthX cannot technically enforce platform-only at the server level since
 * allowCredentials restricts to registered credentials — the platform preference
 * is communicated via the client-side hint to the browser/OS.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId } = (body ?? {}) as { userId?: string };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`biometric:auth:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Fetch the user's registered credentials (PasskeyCredential table is shared).
    const passkeys = await db.passkeyCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    if (passkeys.length === 0) {
      return errorResponse(
        'No passkey or biometric credential is registered for this account. Please register a passkey first, or use another sign-in method.',
        404,
        'NO_CREDENTIAL'
      );
    }

    const { rpID } = getWebAuthnConfig();

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key' as const,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransport[])
          : undefined,
      })),
      // 'required' asks the authenticator to verify the user (biometric/PIN).
      // This is the key difference from a simple presence-only passkey assertion.
      userVerification: 'required',
    });

    // Store the challenge (single-use, 5-min TTL) keyed by userId.
    // Key prefix is different to avoid any cross-contamination with passkey challenges.
    setChallenge(`biometric:${userId}`, options.challenge);

    return successResponse({ options });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
