export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/auth-api';

/**
 * POST /api/authenticator/disable
 * Body: { userId }
 *
 * Disables and deletes the user's active AuthenticatorCredential.
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId } = body;

  if (!userId || typeof userId !== 'string') {
    return errorResponse('userId is required.', 400);
  }

  try {
    await db.authenticatorCredential.deleteMany({
      where: { userId },
    });

    return successResponse({
      disabled: true,
      message: 'Authenticator App has been disabled.',
    });
  } catch (err) {
    console.error('Disable Authenticator error:', err);
    return errorResponse('Failed to disable Authenticator App.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
