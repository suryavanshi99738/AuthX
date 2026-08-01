export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { signupInitSchema } from '@/lib/signup-schema';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/auth/passkey/signup/options
 *
 * Body: { fullName, email, phone }
 *
 * Validates the sign-up intent, ensures the email is not already registered,
 * and issues a WebAuthn registration challenge. A PasskeySignup record holds
 * the sign-up intent + a prospective userId until the ceremony completes.
 *
 * The account is NOT created here — only after a successful verification.
 * The challenge is stored server-side (single-use) and never returned to the
 * client except inside the standard WebAuthn options object.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const parsed = signupInitSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input.', 400);
  }
  const { fullName, email, phone } = parsed.data;

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:signup:opt:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);
  const emailRl = rateLimit(`passkey:signup:opt:email:${email}`, 5, 10 * 60 * 1000);
  if (!emailRl.allowed) return rateLimitedResponse(emailRl.resetAt);

  try {
    // Block sign-up for already-registered emails.
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(
        'An account with this email already exists. Please log in instead.',
        409,
        'EMAIL_EXISTS'
      );
    }

    // Lazy cleanup of expired pending passkey sign-ups for this email.
    await db.passkeySignup.deleteMany({
      where: { email, expiresAt: { lt: new Date() } },
    });

    // Reuse an existing pending record if still valid; otherwise create one.
    let pending = await db.passkeySignup.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      pending = await db.passkeySignup.create({
        data: {
          email,
          fullName,
          phone,
          prospectiveUserId: randomUUID(),
          challenge: '',
          expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        },
      });
    } else {
      // Refresh the sign-up intent in case the user edited details.
      pending = await db.passkeySignup.update({
        where: { id: pending.id },
        data: { fullName, phone, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
      });
    }

    const { rpName, rpID } = getWebAuthnConfig();
    const userIDBuffer = new TextEncoder().encode(pending.prospectiveUserId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer,
      userName: email,
      userDisplayName: fullName,
      excludeCredentials: [], // no existing credentials for a brand-new account
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store the challenge (single-use, in-memory) keyed by the prospective userId.
    setChallenge(pending.prospectiveUserId, options.challenge, CHALLENGE_TTL_MS);

    // Also persist the challenge + expiry on the pending record (defensive;
    // the in-memory store is authoritative for single-use semantics).
    await db.passkeySignup.update({
      where: { id: pending.id },
      data: { challenge: options.challenge, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
    });

    return successResponse({
      options,
      prospectiveUserId: pending.prospectiveUserId,
    });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
