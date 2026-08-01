export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/qr/approve
 *
 * Body: { requestId, email, action: 'approve' | 'reject', mobileDeviceInfo?: string }
 *
 * Executed by Mobile after user authenticates.
 * Approves or rejects the pending Desktop QR login request.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`qr:approve:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  let body: { requestId?: string; email?: string; action?: 'approve' | 'reject'; mobileDeviceInfo?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { requestId, email, action = 'approve', mobileDeviceInfo = 'Mobile Phone' } = body;
  if (!requestId || typeof requestId !== 'string') {
    return errorResponse('requestId is required.', 400);
  }
  if (!email || typeof email !== 'string') {
    return errorResponse('User email is required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Fetch user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return errorResponse('User account not found.', 404, 'USER_NOT_FOUND');
    }

    // 2. Fetch pending QR request
    const qrReq = await db.qRLoginRequest.findUnique({
      where: { requestId },
    });
    if (!qrReq) {
      return errorResponse('QR request has expired or does not exist.', 404, 'EXPIRED');
    }

    if (new Date() > qrReq.expiresAt) {
      await db.qRLoginRequest.update({ where: { id: qrReq.id }, data: { status: 'expired' } }).catch(() => {});
      return errorResponse('QR request has expired (60s limit). Please generate a new QR.', 410, 'EXPIRED');
    }

    if (action === 'reject') {
      await db.qRLoginRequest.update({
        where: { id: qrReq.id },
        data: { status: 'rejected' },
      });

      // Audit log
      await db.loginHistory.create({
        data: {
          userId: user.id,
          method: 'QR Login (Mobile Approval)',
          device: qrReq.deviceInfo || 'Windows Laptop',
          browser: 'Chrome / Edge',
          status: 'rejected',
          ipAddress: ip,
        },
      });

      return successResponse({ status: 'rejected' });
    }

    // On Approve: Create Desktop session
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Update QR Request to approved
    await db.qRLoginRequest.update({
      where: { id: qrReq.id },
      data: {
        status: 'approved',
        userId: user.id,
        sessionToken,
      },
    });

    // Audit logs with location and device ID
    const locationStr = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.') ? 'Local Network (Wi-Fi)' : 'Nearby Location';

    await db.loginHistory.create({
      data: {
        userId: user.id,
        method: 'QR Login (Desktop)',
        device: qrReq.deviceInfo || 'Windows Laptop',
        browser: 'Desktop Browser',
        status: 'success',
        riskLevel: 'Low',
        ipAddress: qrReq.ipAddress || ip,
        location: locationStr,
        deviceId: `dev_desk_${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    await db.loginHistory.create({
      data: {
        userId: user.id,
        method: 'QR Scanner Approval',
        device: mobileDeviceInfo,
        browser: 'Mobile Web Scanner',
        status: 'success',
        riskLevel: 'Low',
        ipAddress: ip,
        location: locationStr,
        deviceId: `dev_mob_${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    return successResponse({
      status: 'approved',
      user,
      sessionToken,
    });
  } catch (err) {
    console.error('QR Approve Error:', err);
    return errorResponse('Failed to approve QR request.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
