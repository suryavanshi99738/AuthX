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
 * Verifies the 6-digit login OTP against the latest unverified, non-expired record.
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

    // Mark OTP verified
    await db.oTPCode.update({ where: { id: otp.id }, data: { verified: true } });

    // Guarantee User record existence (resolve via otp.userId or email)
    let user = otp.userId ? await db.user.findUnique({ where: { id: otp.userId } }) : null;
    if (!user) {
      user = await db.user.findUnique({ where: { email: normalizedEmail } });
    }
    if (!user) {
      user = await db.user.create({ data: { email: normalizedEmail, isDemo: Boolean(otp.isDemo) } });
    }

    // Safely perform trust and history logging (isolated catch so audit logging never breaks auth)
    try {
      const userAgent = request.headers.get('user-agent');
      const { deviceName, browser, deviceFingerprint, location } = getDeviceDetails(userAgent, ip);

      let trusted = await db.trustedDevice.findFirst({
        where: { userId: user.id, deviceFingerprint },
      });

      if (!trusted) {
        await db.trustedDevice.create({
          data: {
            userId: user.id,
            deviceName,
            browser,
            deviceFingerprint,
            location,
            status: 'trusted',
            isDemo: otp.isDemo,
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
          userId: user.id,
          method: 'Email OTP',
          device: deviceName,
          browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location,
          deviceId: `dev_${deviceFingerprint}`,
          isDemo: otp.isDemo,
        },
      });

      await db.riskAssessment.create({
        data: {
          userId: user.id,
          score: 10,
          level: 'Low',
          reasons: JSON.stringify(['Trusted Device Verified', 'Geographic Location Verified']),
          ipAddress: ip,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning during OTP verify:', auditErr);
    }

    return successResponse({ verified: true, userId: user.id, isDemo: otp.isDemo });
  } catch (err) {
    console.error('OTP verify error:', err);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
