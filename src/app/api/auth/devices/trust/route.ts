export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/devices/trust
 *
 * Registers/trusts a device for a user.
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string; deviceName?: string; browser?: string; deviceFingerprint?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, deviceName = 'Mobile Device', browser = 'Mobile Browser', deviceFingerprint = 'default_fingerprint' } = body;
  if (!userId || typeof userId !== 'string') {
    return errorResponse('userId is required.', 400);
  }

  try {
    // Check if device is already registered
    const existing = await db.trustedDevice.findFirst({
      where: { userId, deviceFingerprint },
    });

    if (existing) {
      const updated = await db.trustedDevice.update({
        where: { id: existing.id },
        data: { lastActive: new Date() },
      });
      return successResponse({ trustedDevice: updated });
    }

    const created = await db.trustedDevice.create({
      data: {
        userId,
        deviceName,
        browser,
        deviceFingerprint,
        lastActive: new Date(),
      },
    });

    return successResponse({ trustedDevice: created });
  } catch (err) {
    console.error('Trust Device Error:', err);
    return errorResponse('Failed to trust device.', 500);
  }
}
