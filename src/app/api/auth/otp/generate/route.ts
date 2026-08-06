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
 * If isDemo === true, skips email sending and returns the OTP code in response for demo toast.
 * In Real Mode: Sends real-time verification email to recipient via Resend API.
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

    console.log(`\n================================================\n🔑 [REAL-TIME OTP EMAIL] For: ${normalizedEmail}\n👉 VERIFICATION CODE: ${code}\n================================================\n`);

    // Demo Mode: Skip real email sending & return code for Demo toast
    if (isDemo) {
      return successResponse({ userId: user.id, isDemo: true, otpCode: code });
    }

    // Real Mode: Send real-time email via Resend API to recipient inbox
    const emailResult = await sendVerificationEmail({ to: normalizedEmail, code, recipientName: user.name ?? undefined });
    
    if (!emailResult.success) {
      console.warn(`[email] Real-time delivery notice for ${normalizedEmail}: ${emailResult.error}`);
      return errorResponse(emailResult.error || 'Failed to send verification email. Please check your recipient email address.', 400);
    }

    return successResponse({ userId: user.id, isDemo: false, emailSent: true });
  } catch (err) {
    console.error('OTP generate route error:', err);
    return errorResponse('Something went wrong generating OTP code. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
