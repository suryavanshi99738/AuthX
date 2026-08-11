export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/authenticator/status?userId=...
 *
 * Returns safe metadata on whether Authenticator is configured/enabled.
 * NEVER returns the secret, encryption key, or raw provisioning URI.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  try {
    const cred = await db.authenticatorCredential.findUnique({
      where: { userId },
      select: {
        enabled: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return successResponse({
      enabled: cred?.enabled ?? false,
      configuredAt: cred?.createdAt ? cred.createdAt.toISOString() : null,
      lastUsedAt: cred?.lastUsedAt ? cred.lastUsedAt.toISOString() : null,
    });
  } catch (err) {
    console.error('Fetch Authenticator status error:', err);
    return errorResponse('Failed to fetch Authenticator status.', 500);
  }
}
