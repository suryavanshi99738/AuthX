export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { generateOtpCode, hashOtp } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/email';
import { signupInitSchema } from '@/lib/signup-schema';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

/**
 * POST /api/auth/signup/init
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

  // Rate limit by IP (5 inits / 10 min) and by email (3 inits / 10 min).
  const ip = getClientIp(request);
  const ipRl = rateLimit(`signup:init:ip:${ip}`, 5, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);
  const emailRl = rateLimit(`signup:init:email:${email}`, 3, 10 * 60 * 1000);
  if (!emailRl.allowed) return rateLimitedResponse(emailRl.resetAt);

  try {
    // Block registration for already-registered emails.
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return errorResponse('An account with this email already exists. Please log in instead.', 409, 'EMAIL_EXISTS');
    }

    // Enforce the 30-second resend cooldown
    const cooldownSince = new Date(Date.now() - RESEND_COOLDOWN_MS);
    const recent = await db.signupVerification.findFirst({
      where: { email, createdAt: { gt: cooldownSince } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, expiresAt: true },
    });
    if (recent) {
      const retryAfter = Math.ceil((recent.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000);
      return Response.json(
        { success: false, error: 'Please wait before requesting another code.', code: 'COOLDOWN' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } }
      );
    }

    // Generate, hash, and store the OTP.
    const code = generateOtpCode();
    const otpHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.signupVerification.create({
      data: { email, fullName, phone, otpHash, expiresAt },
    });

    // Lazy cleanup of expired verifications for this email.
    await db.signupVerification.deleteMany({
      where: { email, expiresAt: { lt: new Date() } },
    });

    console.log(`\n================================================\n🔑 [SIGNUP OTP EMAIL] For: ${email}\n👉 VERIFICATION CODE: ${code}\n================================================\n`);

    // Send real-time email via Resend API to recipient inbox
    const emailResult = await sendVerificationEmail({ to: email, code, recipientName: fullName });
    if (!emailResult.success) {
      console.warn(`[email] Real-time delivery notice for ${email}: ${emailResult.error}`);
      return errorResponse(emailResult.error || 'Failed to send verification email. Please check your recipient email address.', 400);
    }

    return successResponse({ expiresAt: expiresAt.toISOString(), emailSent: true });
  } catch (err) {
    console.error('Signup init route error:', err);
    return errorResponse('Something went wrong during signup initialization. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
