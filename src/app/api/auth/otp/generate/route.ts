export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { generateOtpCode, hashOtp } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/email';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/auth/otp/generate
 *
 * Body: { email }
 *
 * Login flow: finds (or creates) the user and issues a 6-digit OTP. The OTP is
 * hashed before storage and emailed to the user. The plaintext OTP is NEVER
 * returned in the response.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { email } = (body ?? {}) as { email?: string };
  if (!email || typeof email !== 'string') {
    return errorResponse('Email is required.', 400);
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length === 0 || normalizedEmail.length > 254) {
    return errorResponse('Please enter a valid email address.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`login:otp:ip:${ip}`, 5, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);
  const emailRl = rateLimit(`login:otp:email:${normalizedEmail}`, 3, 10 * 60 * 1000);
  if (!emailRl.allowed) return rateLimitedResponse(emailRl.resetAt);

  try {
    // Find or create the user (existing login behaviour).
    let user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await db.user.create({ data: { email: normalizedEmail } });
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.oTPCode.create({
      data: { userId: user.id, email: normalizedEmail, codeHash, expiresAt },
    });

    // Lazy cleanup of expired OTPs for this email.
    await db.oTPCode.deleteMany({
      where: { email: normalizedEmail, expiresAt: { lt: new Date() } },
    });

    console.log(`\n================================================\n🔑 [OTP CODE] For: ${normalizedEmail}\n👉 VERIFICATION CODE: ${code}\n================================================\n`);

    // Send the email — fallback gracefully in development/test environments
    const emailResult = await sendVerificationEmail({ to: normalizedEmail, code, recipientName: user.name ?? undefined });
    if (!emailResult.success) {
      console.warn(`[email] Resend API Notice for ${normalizedEmail}: ${emailResult.error}`);
    }

    return successResponse({ userId: user.id });
  } catch (err) {
    console.error('OTP generate route error:', err);
    return errorResponse('Something went wrong generating OTP code. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
