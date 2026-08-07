export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse } from '@/lib/auth-api';
import { getDeviceDetails } from '@/lib/device';

/**
 * POST /api/auth/session
 * Body: { userId, loginMethod?, isDemo? }
 * Creates a new active session with auto-detected device details and logs LoginHistory.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, loginMethod = 'Email OTP', isDemo = false } = body as { userId: string; loginMethod?: string; isDemo?: boolean };

    if (!userId) {
      return errorResponse('userId is required', 400);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent');
    const deviceDetails = getDeviceDetails(userAgent, ip);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Replace older sessions for the SAME device to prevent duplicate session records
    await db.session.deleteMany({
      where: {
        userId,
        OR: [
          { deviceFingerprint: deviceDetails.deviceFingerprint },
          { deviceName: deviceDetails.deviceName },
        ],
      },
    }).catch(() => {});

    const session = await db.session.create({
      data: {
        userId,
        token,
        isDemo,
        deviceName: deviceDetails.deviceName,
        deviceType: deviceDetails.deviceType,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceFingerprint: deviceDetails.deviceFingerprint,
        loginMethod,
        status: 'active',
        isTrusted: true,
        ipAddress: ip,
        location: deviceDetails.location,
        screenResolution: '1920x1080',
        timezone: 'Asia/Kolkata',
        language: 'en-US',
        platform: deviceDetails.isMobile ? 'Mobile' : 'Win32',
        userAgent: userAgent || 'Mozilla/5.0',
        networkType: 'Wi-Fi / 4G',
        lastActivity: new Date(),
        lastSeen: new Date(),
        expiresAt,
      },
    });

    // Audit logging: TrustedDevice & LoginHistory
    try {
      let trusted = await db.trustedDevice.findFirst({
        where: { userId, deviceFingerprint: deviceDetails.deviceFingerprint },
      });

      if (!trusted) {
        await db.trustedDevice.create({
          data: {
            userId,
            deviceName: deviceDetails.deviceName,
            browser: deviceDetails.browser,
            deviceFingerprint: deviceDetails.deviceFingerprint,
            location: deviceDetails.location,
            status: 'trusted',
            isDemo,
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
          method: loginMethod,
          device: deviceDetails.deviceName,
          browser: deviceDetails.browser,
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location: deviceDetails.location,
          deviceId: `dev_${deviceDetails.deviceFingerprint}`,
          isDemo,
        },
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning in session POST:', auditErr);
    }

    return successResponse({
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
        deviceName: session.deviceName,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * GET /api/auth/session?token=...
 * Verifies active session token.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return errorResponse('Token is required', 400);
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.status === 'revoked') {
      return errorResponse('Session not found or revoked', 401);
    }

    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return errorResponse('Session expired', 401);
    }

    // Refresh lastSeen timestamp
    await db.session.update({
      where: { id: session.id },
      data: { lastSeen: new Date() },
    }).catch(() => {});

    return successResponse({
      userId: session.userId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      isDemo: session.isDemo,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/auth/session
 * Body: { token }
 * Explicitly terminates and deletes session from DB on logout.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return errorResponse('Token is required', 400);
    }

    const existingSession = await db.session.findUnique({
      where: { token },
    });

    if (existingSession) {
      const ip = getClientIp(request);
      await db.loginHistory.create({
        data: {
          userId: existingSession.userId,
          method: 'Session Logout',
          device: existingSession.deviceName || 'Device',
          browser: existingSession.browser || 'Browser',
          status: 'logout',
          riskLevel: 'Low',
          ipAddress: ip,
          location: existingSession.location || 'Pune, Maharashtra, India',
          deviceId: existingSession.deviceFingerprint || 'dev_logout',
          isDemo: existingSession.isDemo,
        },
      }).catch(() => {});

      await db.session.deleteMany({
        where: { token },
      });
    }

    return successResponse({ message: 'Session logged out and invalidated successfully.' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return errorResponse('Internal server error', 500);
  }
}
