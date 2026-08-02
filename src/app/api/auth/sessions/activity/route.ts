export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/sessions/activity
 * Refreshes lastActivity (user interaction) & lastSeen (heartbeat) for active session token.
 */
export async function POST(request: NextRequest) {
  let body: { sessionToken?: string; isUserInteraction?: boolean };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { sessionToken, isUserInteraction = true } = body;
  if (!sessionToken) {
    return errorResponse('sessionToken is required.', 400);
  }

  try {
    const now = new Date();
    const updateData: { lastSeen: Date; lastActivity?: Date; status: string } = {
      lastSeen: now,
      status: 'active',
    };

    if (isUserInteraction) {
      updateData.lastActivity = now;
    }

    await db.session.updateMany({
      where: { token: sessionToken },
      data: updateData,
    });

    return successResponse({ updated: true, timestamp: now.toISOString() });
  } catch (err) {
    console.error('Session Activity Update Error:', err);
    return errorResponse('Failed to update session activity.', 500);
  }
}
