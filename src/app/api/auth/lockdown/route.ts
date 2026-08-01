import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, currentToken, action } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    let settings = await db.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await db.userSettings.create({ data: { userId } });
    }

    if (action === 'logout_all') {
      await db.session.deleteMany({
        where: {
          userId,
          ...(currentToken ? { NOT: { token: currentToken } } : {}),
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Successfully logged out of all other active device sessions.',
      });
    }

    if (action === 'disable_qr') {
      const updated = await db.userSettings.update({
        where: { userId },
        data: { qrDisabled: !settings.qrDisabled },
      });
      return NextResponse.json({
        success: true,
        qrDisabled: updated.qrDisabled,
        message: updated.qrDisabled ? 'QR Authentication disabled.' : 'QR Authentication enabled.',
      });
    }

    if (action === 'disable_passkeys') {
      const updated = await db.userSettings.update({
        where: { userId },
        data: { passkeysDisabled: !settings.passkeysDisabled },
      });
      return NextResponse.json({
        success: true,
        passkeysDisabled: updated.passkeysDisabled,
        message: updated.passkeysDisabled ? 'Passkey Authentication disabled.' : 'Passkey Authentication enabled.',
      });
    }

    if (action === 'require_otp') {
      const updated = await db.userSettings.update({
        where: { userId },
        data: { requireOTPOnly: !settings.requireOTPOnly },
      });
      return NextResponse.json({
        success: true,
        requireOTPOnly: updated.requireOTPOnly,
        message: updated.requireOTPOnly ? 'Strict Email OTP enforcement active.' : 'Flexible authentication restored.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid lockdown action' }, { status: 400 });
  } catch (error) {
    console.error('Lockdown API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to execute emergency lockdown' }, { status: 500 });
  }
}
