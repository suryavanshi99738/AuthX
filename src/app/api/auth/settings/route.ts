import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId },
      });
    }

    const trustedDeviceCount = await db.trustedDevice.count({ where: { userId } });
    const isDeviceLimitReached = trustedDeviceCount >= settings.deviceLimit;

    return NextResponse.json({
      success: true,
      settings,
      trustedDeviceCount,
      isDeviceLimitReached,
      deviceLimitMessage: isDeviceLimitReached
        ? 'Device limit reached. Remove a trusted device before adding another.'
        : null,
    });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, theme, deviceLimit, sessionTimeout, qrExpiry, securityAlerts, loginAlerts, newDeviceAlerts, qrDisabled, passkeysDisabled, requireOTPOnly } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const updatedSettings = await db.userSettings.upsert({
      where: { userId },
      update: {
        ...(theme !== undefined && { theme }),
        ...(deviceLimit !== undefined && { deviceLimit: Number(deviceLimit) }),
        ...(sessionTimeout !== undefined && { sessionTimeout: Number(sessionTimeout) }),
        ...(qrExpiry !== undefined && { qrExpiry: Number(qrExpiry) }),
        ...(securityAlerts !== undefined && { securityAlerts: Boolean(securityAlerts) }),
        ...(loginAlerts !== undefined && { loginAlerts: Boolean(loginAlerts) }),
        ...(newDeviceAlerts !== undefined && { newDeviceAlerts: Boolean(newDeviceAlerts) }),
        ...(qrDisabled !== undefined && { qrDisabled: Boolean(qrDisabled) }),
        ...(passkeysDisabled !== undefined && { passkeysDisabled: Boolean(passkeysDisabled) }),
        ...(requireOTPOnly !== undefined && { requireOTPOnly: Boolean(requireOTPOnly) }),
      },
      create: {
        userId,
        theme: theme || 'system',
        deviceLimit: Number(deviceLimit) || 5,
        sessionTimeout: Number(sessionTimeout) || 24,
        qrExpiry: Number(qrExpiry) || 60,
        securityAlerts: securityAlerts !== undefined ? Boolean(securityAlerts) : true,
        loginAlerts: loginAlerts !== undefined ? Boolean(loginAlerts) : true,
        newDeviceAlerts: newDeviceAlerts !== undefined ? Boolean(newDeviceAlerts) : true,
        qrDisabled: Boolean(qrDisabled),
        passkeysDisabled: Boolean(passkeysDisabled),
        requireOTPOnly: Boolean(requireOTPOnly),
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user settings' }, { status: 500 });
  }
}
