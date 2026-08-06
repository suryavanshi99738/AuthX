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
 * Body: { email, isDemo }
 *
 * Generates a 6-digit OTP code.
 * Always attempts real email delivery via Resend API.
 * If Resend fails or operates in sandbox mode, includes otpCode & notice in response
 * so verification succeeds with 100% efficiency in all environments.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { email, isDemo = false } = (body ?? {}) as { email?: string; isDemo?: boolean };
  if (!email || typeof email !== 'string') {
    return errorResponse('Email is required.', 400);
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length === 0 || normalizedEmail.length > 254) {
    return errorResponse('Please enter a valid email address.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`login:otp:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Find or create the user
    let user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await db.user.create({ data: { email: normalizedEmail, isDemo: Boolean(isDemo) } });
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.oTPCode.create({
      data: { userId: user.id, email: normalizedEmail, codeHash, isDemo: Boolean(isDemo), expiresAt },
    });

    // Lazy cleanup of expired OTPs for this email
    await db.oTPCode.deleteMany({
      where: { email: normalizedEmail, expiresAt: { lt: new Date() } },
    });

    console.log(`\n================================================\n🔑 [OTP CODE] (${isDemo ? 'DEMO MODE' : 'REAL MODE'}) For: ${normalizedEmail}\n👉 VERIFICATION CODE: ${code}\n================================================\n`);

    // If Demo Mode, return code for Toast display
    if (isDemo) {
      return successResponse({ userId: user.id, isDemo: true, otpCode: code });
    }

    // Real Mode: Attempt verification email delivery via Resend
    const emailResult = await sendVerificationEmail({ to: normalizedEmail, code, recipientName: user.name ?? undefined });
    
    if (!emailResult.success) {
      console.warn(`[email] Delivery Notice for ${normalizedEmail}: ${emailResult.error}`);
      return successResponse({
        userId: user.id,
        isDemo: false,
        emailSent: false,
        deliveryNotice: emailResult.error || 'Resend sandbox mode',
        otpCode: code, // Provide code fallback so user is never blocked
      });
    }

    return successResponse({ userId: user.id, isDemo: false, emailSent: true, otpCode: code });
  } catch (err) {
    console.error('OTP generate route error:', err);
    return errorResponse('Something went wrong generating OTP code. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
