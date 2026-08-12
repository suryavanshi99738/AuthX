export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/recovery/status?userId=...
 *
 * Returns the Recovery Kit status for a user:
 *  - configured: boolean — whether any recovery codes exist
 *  - total: number — total codes generated (always 12 when configured)
 *  - remaining: number — codes not yet used
 *
 * Never returns the actual codes or hashes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  try {
    const [total, remaining] = await Promise.all([
      db.recoveryCode.count({ where: { userId } }),
      db.recoveryCode.count({ where: { userId, used: false } }),
    ]);

    return successResponse({
      configured: total > 0,
      total,
      remaining,
    });
  } catch (error) {
    console.error('Recovery status error:', error);
    return errorResponse('Failed to fetch recovery kit status.', 500);
  }
}

export async function POST() {
  return errorResponse('Method not allowed.', 405);
}
