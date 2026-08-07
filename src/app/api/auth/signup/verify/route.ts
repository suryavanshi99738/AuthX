export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { verifyOtpHash } from '@/lib/otp';
import { signupVerifySchema } from '@/lib/signup-schema';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { getDeviceDetails } from '@/lib/device';

const MAX_ATTEMPTS = 3;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/auth/signup/verify
 *
 * Body: { email, code }
 *
 * Verifies the 6-digit OTP against the latest pending SignupVerification for
 * the email. On success:
 *  - marks verification verified
 *  - creates User account
 *  - creates login Session with device details
 *  - logs LoginHistory, TrustedDevice, and RiskAssessment
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const parsed = signupVerifySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input.', 400);
  }
  const { email, code } = parsed.data;

  // Rate limit verify attempts
  const ip = getClientIp(request);
  const ipRl = rateLimit(`signup:verify:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);
  const emailRl = rateLimit(`signup:verify:email:${email}`, 10, 10 * 60 * 1000);
  if (!emailRl.allowed) return rateLimitedResponse(emailRl.resetAt);

  try {
    const verification = await db.signupVerification.findFirst({
      where: { email, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      await db.signupVerification.deleteMany({
        where: { email, expiresAt: { lt: new Date() } },
      }).catch(() => {});
      return errorResponse('Your verification code has expired or no code was requested. Please request a new one.', 410, 'OTP_EXPIRED');
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      await db.signupVerification.update({
        where: { id: verification.id },
        data: { verified: false },
      }).catch(() => {});
      await db.signupVerification.deleteMany({
        where: { id: verification.id },
      }).catch(() => {});
      return errorResponse('Too many incorrect attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS');
    }

    const matched = verifyOtpHash(code, verification.otpHash);

    if (!matched) {
      const nextAttempts = verification.attempts + 1;
      const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
      await db.signupVerification.update({
        where: { id: verification.id },
        data: { attempts: nextAttempts },
      });
      if (remaining <= 0) {
        return errorResponse('Too many incorrect attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS');
      }
      return errorResponse(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400, 'OTP_INVALID');
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await db.signupVerification.deleteMany({ where: { email } }).catch(() => {});
      return errorResponse('An account with this email already exists. Please log in instead.', 409, 'EMAIL_EXISTS');
    }

    const newUser = await db.user.create({
      data: {
        email,
        name: verification.fullName,
        phone: verification.phone,
        emailVerified: true,
      },
      select: { id: true, email: true, name: true, phone: true },
    });

    const userAgent = request.headers.get('user-agent');
    const deviceDetails = getDeviceDetails(userAgent, ip);

    // Create a login session with device details
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.session.create({
      data: {
        userId: newUser.id,
        token,
        expiresAt,
        loginMethod: 'Email OTP',
        isTrusted: true,
        deviceName: deviceDetails.deviceName,
        deviceType: deviceDetails.deviceType,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceFingerprint: deviceDetails.deviceFingerprint,
        ipAddress: ip,
        location: deviceDetails.location,
        platform: deviceDetails.isMobile ? 'Mobile' : 'Win32',
        userAgent: userAgent || 'Mozilla/5.0',
      },
    });

    // Safely record LoginHistory, TrustedDevice, and RiskAssessment
    try {
      await db.trustedDevice.create({
        data: {
          userId: newUser.id,
          deviceName: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          deviceFingerprint: deviceDetails.deviceFingerprint,
          location: deviceDetails.location,
          status: 'trusted',
        },
      });

      await db.loginHistory.create({
        data: {
          userId: newUser.id,
          method: 'Email OTP',
          device: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location: deviceDetails.location,
          deviceId: `dev_${deviceDetails.deviceFingerprint}`,
        },
      });

      await db.riskAssessment.create({
        data: {
          userId: newUser.id,
          score: 10,
          level: 'Low',
          reasons: JSON.stringify(['Email Signup Verification Passed', 'Trusted Device Registered']),
          ipAddress: ip,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning during signup verify:', auditErr);
    }

    await db.signupVerification.deleteMany({ where: { email } }).catch(() => {});

    return successResponse({
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
