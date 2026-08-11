export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { signupCheckSchema } from '@/lib/signup-schema';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/signup/check
 * Checks whether an email is already registered. Used by the sign-up form to
 * route the user to sign up vs. login. Returns only an existence boolean —
 * never user details.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const parsed = signupCheckSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid email.', 400);
  }
  const { email } = parsed.data;

  // Rate limit: 20 checks per IP per 10 minutes (cheap endpoint).
  const ip = getClientIp(request);
  const rl = rateLimit(`signup:check:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        passkeys: { select: { id: true } },
        authenticator: { select: { enabled: true } },
      },
    });

    if (!existing) {
      return successResponse({ exists: false });
    }

    return successResponse({
      exists: true,
      userId: existing.id,
      methods: {
        otp: true,
        passkey: existing.passkeys.length > 0,
        authenticator: Boolean(existing.authenticator?.enabled),
        biometric: false,
        qr: false,
      },
    });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
