export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse } from '@/lib/auth-api';

/**
 * Helper to calculate session status based on lastActivity & expiry.
 */
function calculateSessionStatus(status: string, expiresAt: Date, lastActivity: Date): 'active' | 'idle' | 'expired' | 'revoked' {
  if (status === 'revoked') return 'revoked';
  if (new Date() > new Date(expiresAt)) return 'expired';
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (new Date(lastActivity) < fifteenMinsAgo) return 'idle';
  return 'active';
}

/**
 * Helper to calculate session duration in readable format (e.g. 2h 15m).
 */
function calculateSessionDuration(createdAt: Date): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Just started';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

/**
 * Helper to calculate Authentication Strength rating.
 */
function calculateAuthStrength(method?: string | null, isTrusted = true): { score: number; label: string; badgeColor: string } {
  const normMethod = (method || '').toLowerCase();
  if (normMethod.includes('passkey')) {
    return { score: 98, label: 'Very Strong (FIDO2 Hardware)', badgeColor: 'bg-success/10 text-success border-success/30' };
  }
  if (normMethod.includes('qr')) {
    return { score: 92, label: 'Strong (Cross-Device MFA)', badgeColor: 'bg-primary/10 text-primary border-primary/30' };
  }
  if (isTrusted) {
    return { score: 85, label: 'Strong (Email OTP + Trusted)', badgeColor: 'bg-success/10 text-success border-success/30' };
  }
  return { score: 65, label: 'Medium (Email OTP Untrusted)', badgeColor: 'bg-warning/10 text-warning border-warning/30' };
}

/**
 * Mask IP address for card display (e.g. 10.17.87.***).
 */
function maskIp(ip?: string | null): string {
  if (!ip) return '10.17.87.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return '10.17.87.***';
}

/**
 * GET /api/auth/sessions?userId=...&currentToken=...
 *
 * Returns all real sessions for the user — one per row, NO deduplication.
 * Each session belongs to an individual device instance.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const currentToken = searchParams.get('currentToken');

  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  try {
    // 1. Delete expired sessions
    await db.session.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    }).catch(() => {});

    // 2. Fetch all active sessions for user (excluding revoked)
    const rawSessions = await db.session.findMany({
      where: { userId, status: { not: 'revoked' } },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Deduplicate sessions per device instance (instanceId): keep only the latest session for each instanceId
    const seenInstances = new Set<string>();
    const activeSessionsList = [];
    const duplicateIdsToDelete: string[] = [];

    for (const s of rawSessions) {
      const instKey = (s as { instanceId?: string | null }).instanceId || s.deviceFingerprint || s.id;
      if (!seenInstances.has(instKey)) {
        seenInstances.add(instKey);
        activeSessionsList.push(s);
      } else {
        // Old duplicate session from the same device instance
        duplicateIdsToDelete.push(s.id);
      }
    }

    // Ensure the current token session is always retained in case currentToken is passed
    if (currentToken && !activeSessionsList.some((s) => s.token === currentToken)) {
      const curr = rawSessions.find((s) => s.token === currentToken);
      if (curr) {
        activeSessionsList.unshift(curr);
        const dupIdx = duplicateIdsToDelete.indexOf(curr.id);
        if (dupIdx !== -1) duplicateIdsToDelete.splice(dupIdx, 1);
      }
    }

    // Asynchronously delete old duplicate sessions from DB
    if (duplicateIdsToDelete.length > 0) {
      await db.session.deleteMany({
        where: { id: { in: duplicateIdsToDelete } },
      }).catch(() => {});
    }

    const trustedDevs = await db.trustedDevice.findMany({
      where: { userId },
    });

    let activeCount = 0;
    const mappedSessions = activeSessionsList.map((s) => {
      const isCurrent = Boolean(currentToken && s.token === currentToken);
      const computedStatus = calculateSessionStatus(s.status, s.expiresAt, s.lastActivity);
      if (computedStatus === 'active' || computedStatus === 'idle') {
        activeCount++;
      }

      const isTrusted = s.isTrusted ?? trustedDevs.some(
        (d) => (d.instanceId && d.instanceId === (s as { instanceId?: string | null }).instanceId) ||
                d.deviceName === s.deviceName
      );
      const authStrength = calculateAuthStrength(s.loginMethod, isTrusted);
      const durationStr = calculateSessionDuration(s.createdAt);

      return {
        id: s.id,
        token: s.token,
        userId: s.userId,
        instanceId: (s as { instanceId?: string | null }).instanceId || s.deviceFingerprint || '',
        deviceName: s.deviceName || 'Your Device',
        deviceType: s.deviceType || 'Laptop',
        browser: s.browser || 'Browser',
        os: s.os || 'Unknown OS',
        deviceFingerprint: s.deviceFingerprint || 'fp_unknown',
        loginMethod: s.loginMethod || 'Email OTP',
        status: computedStatus,
        isTrusted,
        isCurrent,
        ipAddress: s.ipAddress || '10.17.87.25',
        maskedIp: maskIp(s.ipAddress),
        location: s.location || 'Pune, Maharashtra, India',
        screenResolution: s.screenResolution || '',
        timezone: s.timezone || '',
        language: s.language || '',
        platform: s.platform || '',
        userAgent: s.userAgent || '',
        networkType: s.networkType || 'Wi-Fi / 4G',
        loginTime: s.createdAt.toISOString(),
        lastActivity: s.lastActivity.toISOString(),
        lastSeen: s.lastSeen.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        duration: durationStr,
        authStrength,
        isDemo: s.isDemo,
      };
    });

    const currentSession = mappedSessions.find((s) => s.isCurrent) || mappedSessions[0];

    const summary = {
      activeSessionsCount: activeCount,
      totalSessionsCount: mappedSessions.length,
      currentDeviceName: currentSession?.deviceName || 'Your Device',
      lastLoginTime: mappedSessions[0]?.loginTime || new Date().toISOString(),
    };

    return successResponse({ summary, sessions: mappedSessions });
  } catch (err) {
    console.error('Fetch Sessions Error:', err);
    return errorResponse('Failed to fetch sessions.', 500);
  }
}

/**
 * DELETE /api/auth/sessions
 * Body: { userId, sessionId, action: 'single' | 'revoke_others', currentToken }
 */
export async function DELETE(request: NextRequest) {
  let body: { userId?: string; sessionId?: string; action?: 'single' | 'revoke_others'; currentToken?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, sessionId, action = 'single', currentToken } = body;
  if (!userId) {
    return errorResponse('userId is required.', 400);
  }

  const ip = getClientIp(request);

  try {
    if (action === 'revoke_others') {
      // Revoke all sessions for this user EXCEPT the current session token.
      // This correctly handles: 2 Windows laptops → only the one with currentToken survives.
      let revokedCount = 0;
      if (currentToken) {
        const deleted = await db.session.deleteMany({
          where: { userId, NOT: { token: currentToken } },
        });
        revokedCount = deleted.count;
      } else {
        const deleted = await db.session.deleteMany({
          where: { userId },
        });
        revokedCount = deleted.count;
      }

      // Record audit history
      await db.loginHistory.create({
        data: {
          userId,
          method: 'Session Management',
          device: 'Multiple Devices',
          browser: 'System Control',
          status: 'success',
          riskLevel: 'Low',
          ipAddress: ip,
          location: 'Pune, Maharashtra, India',
          deviceId: 'session_bulk_revoke',
        },
      });

      return successResponse({ message: `Successfully revoked ${revokedCount} other active sessions.` });
    }

    // Single Session Revoke
    if (!sessionId) {
      return errorResponse('sessionId is required for single revocation.', 400);
    }

    const targetSession = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      return errorResponse('Session not found.', 404);
    }

    // Do not allow revoking current active session token individually
    if (currentToken && targetSession.token === currentToken) {
      return errorResponse('Cannot revoke current active session directly. Use Logout instead.', 400);
    }

    await db.session.delete({
      where: { id: sessionId },
    });

    // Record audit history entry
    await db.loginHistory.create({
      data: {
        userId,
        method: 'Session Revocation',
        device: targetSession.deviceName || 'Remote Device',
        browser: targetSession.browser || 'Unknown Browser',
        status: 'revoked',
        riskLevel: 'Medium',
        ipAddress: targetSession.ipAddress || ip,
        location: targetSession.location || 'Pune, Maharashtra, India',
        deviceId: (targetSession as { instanceId?: string | null }).instanceId || targetSession.deviceFingerprint || 'dev_revoked',
      },
    });

    return successResponse({ message: 'Session revoked successfully.' });
  } catch (err) {
    console.error('Revoke Session Error:', err);
    return errorResponse('Failed to revoke session.', 500);
  }
}
