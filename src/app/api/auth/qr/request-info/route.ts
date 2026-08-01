export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/auth/qr/request-info?requestId=...
 *
 * Fetched by the Mobile Approval Page to render request details before approval.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    return errorResponse('requestId is required.', 400);
  }

  try {
    const qrReq = await db.qRLoginRequest.findUnique({
      where: { requestId },
      select: {
        id: true,
        requestId: true,
        status: true,
        deviceInfo: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!qrReq) {
      return errorResponse('QR Request not found or has expired.', 404, 'NOT_FOUND');
    }

    const isExpired = new Date() > qrReq.expiresAt;
    if (isExpired) {
      return successResponse({
        status: 'expired',
        deviceInfo: qrReq.deviceInfo,
        ipAddress: qrReq.ipAddress,
        expiresAt: qrReq.expiresAt.toISOString(),
      });
    }

    return successResponse({
      status: qrReq.status,
      deviceInfo: qrReq.deviceInfo,
      ipAddress: qrReq.ipAddress,
      expiresAt: qrReq.expiresAt.toISOString(),
      createdAt: qrReq.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('QR Request Info Error:', err);
    return errorResponse('Failed to fetch request info.', 500);
  }
}
