export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

const QR_TTL_MS = 60 * 1000; // 60 seconds

/**
 * POST /api/auth/qr/generate
 *
 * Generates a one-time 60s expiring QR login request.
 * Contains ONLY a unique requestId (no user tokens or credentials).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`qr:gen:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  try {
    let body: { deviceInfo?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    const isWindows = /windows/i.test(userAgent);
    const isMac = /macintosh/i.test(userAgent);
    const browser = /chrome/i.test(userAgent) ? 'Chrome' : /firefox/i.test(userAgent) ? 'Firefox' : 'Browser';
    const os = isWindows ? 'Windows Laptop' : isMac ? 'MacBook' : 'Desktop';
    const defaultDeviceInfo = `${os} (${browser})`;

    const requestId = uuidv4();
    const expiresAt = new Date(Date.now() + QR_TTL_MS);

    // Save one-time request in DB
    await db.qRLoginRequest.create({
      data: {
        requestId,
        status: 'pending',
        deviceInfo: body.deviceInfo || defaultDeviceInfo,
        ipAddress: ip || '10.17.87.25',
        expiresAt,
      },
    });

    // Cleanup expired requests (lazy cleanup)
    await db.qRLoginRequest.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {});

    // Target URL for mobile scanning
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://10.17.87.25:3000';
    const qrUrl = `${baseUrl}/qr-approve?requestId=${requestId}`;

    return successResponse({
      requestId,
      expiresAt: expiresAt.toISOString(),
      qrUrl,
    });
  } catch (err) {
    console.error('QR Generate Error:', err);
    return errorResponse('Failed to generate QR request.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
