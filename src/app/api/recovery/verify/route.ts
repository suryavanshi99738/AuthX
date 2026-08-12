export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse } from '@/lib/auth-api';
import { getDeviceDetails, type ClientHints } from '@/lib/device';
import { verifyRecoveryCode, normalizeRecoveryCode } from '@/lib/recovery';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/recovery/verify
 * Body: { userId, recoveryCode, clientHints? }
 *
 * Verifies a single-use recovery code against stored hashes.
 * Uses an atomic database update to prevent race-condition double use.
 *
 * On success:
 *  - The matching code is atomically marked used.
 *  - A new authenticated session is created through the existing session pipeline.
 *  - A LoginHistory record is created.
 *  - Device detection runs as normal.
 *  - Never returns the recovery code in the response.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, recoveryCode, clientHints } = (body ?? {}) as {
    userId?: string;
    recoveryCode?: string;
    clientHints?: ClientHints;
  };

  if (!userId || typeof userId !== 'string') {
    return errorResponse('Invalid request.', 400);
  }
  if (!recoveryCode || typeof recoveryCode !== 'string') {
    return errorResponse('Recovery code is required.', 400);
  }

  const ip = getClientIp(request);

  // Rate limit: 10 attempts per user per 15 minutes (brute-force protection)
  const rl = rateLimit(`recovery:verify:${userId}:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return errorResponse('Too many recovery attempts. Please wait before trying again.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Normalize the input code for comparison
  const normalized = normalizeRecoveryCode(recoveryCode);
  if (normalized.length < 6) {
    return errorResponse('Invalid recovery code format.', 400);
  }

  try {
    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Don't reveal whether user exists or not
      return errorResponse('Invalid recovery code.', 401, 'INVALID_CODE');
    }

    // Fetch all unused recovery codes for this user
    const unusedCodes = await db.recoveryCode.findMany({
      where: { userId, used: false },
      select: { id: true, codeHash: true },
    });

    if (unusedCodes.length === 0) {
      return errorResponse('No recovery codes remaining. Please regenerate your Recovery Kit.', 401, 'NO_CODES_REMAINING');
    }

    // Find the matching code using constant-time comparison
    let matchedCodeId: string | null = null;
    for (const entry of unusedCodes) {
      if (verifyRecoveryCode(normalized, entry.codeHash)) {
        matchedCodeId = entry.id;
        break;
      }
    }

    if (!matchedCodeId) {
      return errorResponse('Invalid recovery code.', 401, 'INVALID_CODE');
    }

    // Atomically mark the matching code as used (race-condition protection):
    // updateMany with `used: false` filter — only one concurrent request can win.
    const updateResult = await db.recoveryCode.updateMany({
      where: { id: matchedCodeId, used: false },
      data: { used: true, usedAt: new Date() },
    });

    if (updateResult.count === 0) {
      // Another concurrent request already consumed this code
      return errorResponse('Invalid recovery code.', 401, 'INVALID_CODE');
    }

    // ── Create session using the existing session pipeline ──
    const userAgent = request.headers.get('user-agent');
    const deviceDetails = getDeviceDetails(userAgent, ip, clientHints);
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Invalidate prior sessions for this exact device instance
    if (deviceDetails.instanceId) {
      await db.session.deleteMany({
        where: { userId, instanceId: deviceDetails.instanceId },
      }).catch(() => {});
    }

    const session = await db.session.create({
      data: {
        userId,
        token,
        isDemo: false,
        instanceId: deviceDetails.instanceId,
        deviceName: deviceDetails.deviceName,
        deviceType: deviceDetails.deviceType,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceFingerprint: deviceDetails.deviceFingerprint,
        loginMethod: 'Recovery Code',
        status: 'active',
        isTrusted: true,
        ipAddress: ip,
        location: deviceDetails.location,
        screenResolution: deviceDetails.screenResolution,
        timezone: deviceDetails.timezone,
        language: deviceDetails.language,
        platform: deviceDetails.platform,
        userAgent: userAgent || 'Mozilla/5.0',
        networkType: 'Wi-Fi / 4G',
        lastActivity: new Date(),
        lastSeen: new Date(),
        expiresAt,
      },
    });

    // Audit logging — non-blocking
    try {
      let trusted = await db.trustedDevice.findFirst({
        where: { userId, instanceId: deviceDetails.instanceId },
      });

      if (!trusted) {
        await db.trustedDevice.create({
          data: {
            userId,
            instanceId: deviceDetails.instanceId,
            deviceName: deviceDetails.deviceName,
            browser: deviceDetails.browser,
            deviceFingerprint: deviceDetails.deviceFingerprint,
            location: deviceDetails.location,
            status: 'untrusted',
            isDemo: false,
          },
        });
      } else {
        await db.trustedDevice.update({
          where: { id: trusted.id },
          data: { lastActive: new Date(), location: deviceDetails.location },
        });
      }

      await db.loginHistory.create({
        data: {
          userId,
          method: 'Recovery Code',
          device: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          status: 'success',
          riskLevel: 'Medium',
          ipAddress: ip,
          location: deviceDetails.location,
          deviceId: deviceDetails.instanceId,
          isDemo: false,
        },
      });

      // Risk assessment for recovery code use
      await db.riskAssessment.create({
        data: {
          userId,
          score: 40,
          level: 'Medium',
          reasons: JSON.stringify(['Recovery Code Authentication', 'Backup credential used']),
          ipAddress: ip,
        },
      }).catch(() => {});
    } catch (auditErr) {
      console.warn('Non-blocking audit warning in recovery verify:', auditErr);
    }

    // Get remaining unused codes count for response
    const remainingCount = await db.recoveryCode.count({
      where: { userId, used: false },
    }).catch(() => -1);

    return successResponse({
      verified: true,
      session: {
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        deviceName: session.deviceName,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      remainingCodes: remainingCount,
    });
  } catch (error) {
    console.error('Recovery verify error:', error);
    return errorResponse('Recovery verification failed. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
