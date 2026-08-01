export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/auth/qr/status?requestId=...
 *
 * Polled by Desktop to check if the QR request has been approved by mobile.
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
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!qrReq) {
      return errorResponse('Invalid or expired QR request.', 404, 'EXPIRED');
    }

    // Check 60s TTL expiry
    if (new Date() > qrReq.expiresAt) {
      if (qrReq.status === 'pending') {
        await db.qRLoginRequest.update({
          where: { id: qrReq.id },
          data: { status: 'expired' },
        });
      }
      return successResponse({ status: 'expired' });
    }

    if (qrReq.status === 'approved' && qrReq.sessionToken && qrReq.user) {
      // Consume request to prevent replay
      const result = {
        status: 'approved',
        sessionToken: qrReq.sessionToken,
        user: qrReq.user,
      };

      // Mark request consumed / clean up
      await db.qRLoginRequest.delete({ where: { id: qrReq.id } }).catch(() => {});

      return successResponse(result);
    }

    return successResponse({ status: qrReq.status });
  } catch (err) {
    console.error('QR Status Error:', err);
    return errorResponse('Failed to fetch QR status.', 500);
  }
}
