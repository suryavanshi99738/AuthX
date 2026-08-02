export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/demo/cleanup
 * Automatically purges all temporary Demo accounts, sessions, OTP codes,
 * QR requests, trusted devices, and login history records.
 */
export async function POST() {
  try {
    const deletedUsers = await db.user.deleteMany({ where: { isDemo: true } });
    const deletedSessions = await db.session.deleteMany({ where: { isDemo: true } });
    const deletedOtps = await db.oTPCode.deleteMany({ where: { isDemo: true } });
    const deletedQrs = await db.qRLoginRequest.deleteMany({ where: { isDemo: true } });
    const deletedDevices = await db.trustedDevice.deleteMany({ where: { isDemo: true } });
    const deletedHistory = await db.loginHistory.deleteMany({ where: { isDemo: true } });

    return NextResponse.json({
      success: true,
      message: 'Demo temporary data cleaned up successfully.',
      purged: {
        users: deletedUsers.count,
        sessions: deletedSessions.count,
        otps: deletedOtps.count,
        qrs: deletedQrs.count,
        devices: deletedDevices.count,
        history: deletedHistory.count,
      },
    });
  } catch (error) {
    console.error('Error cleaning up demo data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
