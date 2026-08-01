export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/devices/trust
 * Registers/trusts a device for a user.
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string; deviceName?: string; browser?: string; deviceFingerprint?: string; location?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, deviceName = 'Mobile Device', browser = 'Mobile Browser', deviceFingerprint = 'default_fingerprint', location = 'Local Network' } = body;
  if (!userId || typeof userId !== 'string') {
    return errorResponse('userId is required.', 400);
  }

  const ip = getClientIp(request);

  try {
    const existing = await db.trustedDevice.findFirst({
      where: { userId, deviceFingerprint },
    });

    if (existing) {
      const updated = await db.trustedDevice.update({
        where: { id: existing.id },
        data: { lastActive: new Date(), location, status: 'trusted' },
      });
      return successResponse({ trustedDevice: updated });
    }

    const created = await db.trustedDevice.create({
      data: {
        userId,
        deviceName,
        browser,
        deviceFingerprint,
        location,
        status: 'trusted',
        lastActive: new Date(),
      },
    });

    // Record low risk entry
    await db.riskAssessment.create({
      data: {
        userId,
        score: 10,
        level: 'Low',
        reasons: JSON.stringify(['Device Trusted by User', 'Fingerprint Validated']),
        ipAddress: ip,
      },
    });

    return successResponse({ trustedDevice: created });
  } catch (err) {
    console.error('Trust Device Error:', err);
    return errorResponse('Failed to trust device.', 500);
  }
}

/**
 * DELETE /api/auth/devices/trust
 * Action: "No, it's not me" -> Instantly revokes session, marks login as high risk, and logs out the device.
 */
export async function DELETE(request: NextRequest) {
  let body: { userId?: string; currentToken?: string; deviceFingerprint?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, currentToken } = body;
  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  const ip = getClientIp(request);

  try {
    // Revoke all sessions for this user EXCEPT current active token if supplied
    if (currentToken) {
      await db.session.deleteMany({
        where: { userId, NOT: { token: currentToken } },
      });
    } else {
      await db.session.deleteMany({
        where: { userId },
      });
    }

    // Record high risk security alert
    await db.riskAssessment.create({
      data: {
        userId,
        score: 95,
        level: 'High',
        reasons: JSON.stringify(['Unauthorized Login Reported by User', 'Session Instantly Terminated', 'Device Revoked']),
        ipAddress: ip,
      },
    });

    await db.loginHistory.create({
      data: {
        userId,
        method: 'Security System',
        device: 'Unauthorized Device',
        browser: 'Unknown Browser',
        status: 'rejected',
        riskLevel: 'High',
        ipAddress: ip,
        location: 'Suspicious / Untrusted Location',
        deviceId: `dev_revoked_${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    return successResponse({ message: 'Unauthorized device session revoked successfully.' });
  } catch (err) {
    console.error('Revoke Device Error:', err);
    return errorResponse('Failed to revoke untrusted device.', 500);
  }
}
