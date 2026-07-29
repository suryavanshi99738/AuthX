export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify session
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 401 }
      );
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Return mock dashboard data
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isDemo: session.user.isDemo,
    };

    const recentLogins = [
      {
        id: '1',
        device: 'Chrome on macOS',
        location: 'San Francisco, CA',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        method: 'passkey',
        status: 'success',
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'San Francisco, CA',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        method: 'passkey',
        status: 'success',
      },
      {
        id: '3',
        device: 'Firefox on Windows',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        method: 'otp',
        status: 'success',
      },
      {
        id: '4',
        device: 'Unknown device',
        location: 'Lagos, Nigeria',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        method: 'password',
        status: 'failed',
      },
    ];

    const securityStatus = {
      score: 92,
      passkeyEnabled: true,
      twoFactorEnabled: true,
      lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      activeSessions: 2,
      recommendations: [
        'Enable biometric authentication for faster login',
        'Review trusted devices regularly',
      ],
    };

    const trustedDevices = [
      {
        id: '1',
        name: 'MacBook Pro',
        type: 'laptop',
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        passkeyRegistered: true,
        browser: 'Chrome 120',
      },
      {
        id: '2',
        name: 'iPhone 15 Pro',
        type: 'phone',
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        passkeyRegistered: true,
        browser: 'Safari 17',
      },
    ];

    const recentActivity = [
      {
        id: '1',
        type: 'login',
        description: 'Successful login via passkey',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
      },
      {
        id: '2',
        type: 'security_check',
        description: 'Security score updated',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
      },
      {
        id: '3',
        type: 'login_attempt',
        description: 'Failed login attempt from unknown location',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        severity: 'warning',
      },
      {
        id: '4',
        type: 'device_added',
        description: 'New passkey registered on iPhone',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
      },
      {
        id: '5',
        type: 'otp_sent',
        description: 'OTP code sent to email',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        severity: 'info',
      },
    ];

    return NextResponse.json({
      success: true,
      user,
      recentLogins,
      securityStatus,
      trustedDevices,
      recentActivity,
    });
  } catch (error) {
    console.error('Error getting demo dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
