import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reset
 * Wipes all LoginHistory, TrustedDevice, RiskAssessment, Session, OTPCode,
 * and QRLoginRequest rows for a fresh start.
 */
export async function POST() {
  try {
    await db.loginHistory.deleteMany({});
    await db.trustedDevice.deleteMany({});
    await db.riskAssessment.deleteMany({});
    await db.session.deleteMany({});
    await db.oTPCode.deleteMany({});
    await db.qRLoginRequest.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Database security logs, sessions, and trusted devices cleared for a fresh start.',
    });
  } catch (error) {
    console.error('Reset DB Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset database' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
