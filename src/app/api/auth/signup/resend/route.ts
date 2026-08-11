export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { generateOtpCode, hashOtp } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/email';
import { signupResendSchema } from '@/lib/signup-schema';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

/**
 * POST /api/auth/signup/resend
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const parsed = signupResendSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid email.', 400);
  }
  const { email } = parsed.data;

  const ip = getClientIp(request);
  const ipRl = rateLimit(`signup:resend:ip:${ip}`, 5, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);
  const emailRl = rateLimit(`signup:resend:email:${email}`, 3, 10 * 60 * 1000);
  if (!emailRl.allowed) return rateLimitedResponse(emailRl.resetAt);

  try {
    const latest = await db.signupVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return errorResponse('No pending verification found. Please start again.', 404, 'NO_PENDING');
    }

    // Cooldown check.
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return Response.json(
        { success: false, error: 'Please wait before requesting another code.', code: 'COOLDOWN' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } }
      );
    }

    // Issue a fresh OTP.
    const code = generateOtpCode();
    const otpHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.signupVerification.create({
      data: { email, fullName: latest.fullName, phone: latest.phone, otpHash, expiresAt },
    });

    // Lazy cleanup of expired verifications for this email.
    await db.signupVerification.deleteMany({
      where: { email, expiresAt: { lt: new Date() } },
    });

    console.log(`\n================================================\n🔑 [RESEND SIGNUP OTP EMAIL] For: ${email}\n👉 VERIFICATION CODE: ${code}\n================================================\n`);

    const emailResult = await sendVerificationEmail({ to: email, code, recipientName: latest.fullName });
    if (!emailResult.success) {
      console.warn(`[email] Real-time delivery notice for ${email}: ${emailResult.error}`);
    }

    return successResponse({ expiresAt: expiresAt.toISOString(), emailSent: Boolean(emailResult.success) });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
