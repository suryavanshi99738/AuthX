export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/auth/devices?userId=...
 * DELETE /api/auth/devices?deviceId=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  try {
    const devices = await db.trustedDevice.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
    });

    return successResponse({ devices });
  } catch (err) {
    console.error('Get Devices Error:', err);
    return errorResponse('Failed to fetch devices.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return errorResponse('deviceId is required.', 400);
  }

  try {
    await db.trustedDevice.delete({
      where: { id: deviceId },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('Delete Device Error:', err);
    return errorResponse('Failed to remove trusted device.', 500);
  }
}
