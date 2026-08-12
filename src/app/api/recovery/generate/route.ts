export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse } from '@/lib/auth-api';
import { generateRecoveryCodes, hashRecoveryCode } from '@/lib/recovery';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/recovery/generate
 * Body: { userId }
 *
 * Generates 12 cryptographically-secure recovery codes, stores ONLY their
 * hashes in the database, and returns the plaintext codes ONCE.
 *
 * Any existing recovery codes for the user are atomically deleted before
 * the new codes are inserted (regeneration invalidates all old codes).
 *
 * The plaintext codes are NEVER stored, logged, or returned again after
 * this response.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId } = (body ?? {}) as { userId?: string };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('userId is required.', 400);
  }

  // Rate limit: 5 generations per user per hour
  const ip = getClientIp(request);
  const rl = rateLimit(`recovery:generate:${userId}:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return errorResponse('Too many requests. Please wait before generating new recovery codes.', 429);
  }

  try {
    // Verify the user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse('User not found.', 404);
    }

    // Generate 12 unique plaintext codes
    const plaintextCodes = generateRecoveryCodes();

    // Hash each code before storage
    const codeHashes = plaintextCodes.map(hashRecoveryCode);

    // Atomically: delete all old recovery codes for this user, then insert 12 new hashed codes
    await db.$transaction([
      db.recoveryCode.deleteMany({ where: { userId } }),
      db.recoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);

    // Return plaintext codes ONLY in this initial response
    // They are never stored, never logged, never sent again
    return successResponse({
      codes: plaintextCodes,
      count: plaintextCodes.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recovery generate error:', error);
    return errorResponse('Failed to generate recovery codes.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
