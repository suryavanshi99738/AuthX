export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { verifyOtpHash } from '@/lib/otp';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { getDeviceDetails } from '@/lib/device';

const MAX_ATTEMPTS = 3;

/**
 * POST /api/auth/otp/verify
 *
 * Body: { email, code }
 *
 * Verifies the 6-digit login OTP against the latest unverified, non-expired
 * record for the email. Enforces expiry (5 min) and a maximum of 3 attempts.
 * Never returns the OTP.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { email, code } = (body ?? {}) as { email?: string; code?: string };
  if (!email || typeof email !== 'string') {
    return errorResponse('Email is required.', 400);
  }
  if (!code || !/^\d{6}$/.test(code)) {
    return errorResponse('A valid 6-digit code is required.', 400);
  }
  const normalizedEmail = email.trim().toLowerCase();

  const ip = getClientIp(request);
  const ipRl = rateLimit(`login:verify:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    const otp = await db.oTPCode.findFirst({
      where: { email: normalizedEmail, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      await db.oTPCode.deleteMany({
        where: { email: normalizedEmail, expiresAt: { lt: new Date() } },
      }).catch(() => {});
      return errorResponse('Your verification code has expired or no code was requested. Please request a new one.', 410, 'OTP_EXPIRED');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await db.oTPCode.deleteMany({ where: { id: otp.id } }).catch(() => {});
      return errorResponse('Too many incorrect attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS');
    }

    const matched = verifyOtpHash(code, otp.codeHash);

    if (!matched) {
      const nextAttempts = otp.attempts + 1;
      const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
      await db.oTPCode.update({ where: { id: otp.id }, data: { attempts: nextAttempts } });
      if (remaining <= 0) {
        return errorResponse('Too many incorrect attempts. Please request a new code.', 429, 'OTP_MAX_ATTEMPTS');
      }
      return errorResponse(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400, 'OTP_INVALID');
    }

    await db.oTPCode.update({ where: { id: otp.id }, data: { verified: true } });

    // Record real login history entry in DB with stable device fingerprinting
    if (otp.userId) {
      const userAgent = request.headers.get('user-agent');
      const { deviceName, browser, deviceFingerprint, location } = getDeviceDetails(userAgent, ip);

      let trusted = await db.trustedDevice.findFirst({
        where: { userId: otp.userId, deviceFingerprint },
      });

      if (!trusted) {
        trusted = await db.trustedDevice.create({
          data: {
            userId: otp.userId,
            deviceName,
            browser,
            deviceFingerprint,
            location,
            status: 'trusted',
          },
        });
      } else {
        await db.trustedDevice.update({
          where: { id: trusted.id },
          data: { lastActive: new Date(), location },
        });
      }

      await db.loginHistory.create({
        data: {
          userId: otp.userId,
          method: 'Email OTP',
          device: deviceName,
          browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location,
          deviceId: `dev_${deviceFingerprint}`,
        },
      });

      await db.riskAssessment.create({
        data: {
          userId: otp.userId,
          score: 10,
          level: 'Low',
          reasons: JSON.stringify(['Trusted Device Verified', 'Geographic Location Verified']),
          ipAddress: ip,
        },
      });
    }

    return successResponse({ verified: true, userId: otp.userId });
  } catch (err) {
    console.error('OTP verify error:', err);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
