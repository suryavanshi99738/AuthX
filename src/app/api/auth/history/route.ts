export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * GET /api/auth/history?userId=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  try {
    const history = await db.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return successResponse({ history });
  } catch (err) {
    console.error('Get History Error:', err);
    return errorResponse('Failed to fetch login history.', 500);
  }
}
