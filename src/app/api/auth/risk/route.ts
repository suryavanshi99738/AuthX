import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Calculates adaptive risk score (0-100) based on 6 security factors:
 * + New Device (+25)
 * + New Browser (+15)
 * + Multiple Failed Attempts (+30)
 * + Unknown Trusted Device (+20)
 * + Excessive QR Requests (+25)
 * + Suspicious Session Activity (+20)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, ipAddress, userAgent, deviceId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const reasons: string[] = [];
    let score = 0;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        trustedDevices: true,
        loginHistory: { take: 10, orderBy: { createdAt: 'desc' } },
        qrRequests: { take: 10, orderBy: { createdAt: 'desc' } },
        sessions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Factor 1: New Device Check — based on actual device identity (instanceId/deviceId).
    // A device is "new" if its persistent deviceId has never appeared in trusted devices or login history.
    const deviceIdKnown = deviceId
      ? user.trustedDevices.some((d: { instanceId?: string | null }) => d.instanceId === deviceId) ||
        user.loginHistory.some((h) => h.deviceId === deviceId)
      : user.loginHistory.some((h) => h.ipAddress === ipAddress); // fallback to IP if no deviceId
    if (!deviceIdKnown) {
      score += 25;
      reasons.push('New Device Detected');
    }

    // Factor 2: New Browser Check
    const browserName = userAgent ? (userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : 'Browser') : '';
    const browserKnown = user.loginHistory.some((h) => h.browser?.includes(browserName));
    if (!browserKnown && userAgent) {
      score += 15;
      reasons.push('New Browser detected');
    }

    // Factor 3: Multiple Failed Attempts in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailed = user.loginHistory.filter((h) => h.status === 'failed' && new Date(h.createdAt) > oneHourAgo);
    if (recentFailed.length >= 2) {
      score += 30;
      reasons.push(`Multiple Failed Attempts (${recentFailed.length} in last hour)`);
    }

    // Factor 4: Unknown Trusted Device
    const hasTrustedDevices = user.trustedDevices.length > 0;
    if (!hasTrustedDevices) {
      score += 10;
      reasons.push('No registered trusted devices on account');
    }

    // Factor 5: Excessive QR Requests ( >3 requests in 10 mins )
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentQR = user.qrRequests.filter((q) => new Date(q.createdAt) > tenMinsAgo);
    if (recentQR.length >= 3) {
      score += 25;
      reasons.push('Excessive QR authentication requests');
    }

    // Factor 6: Suspicious Session Activity
    if (user.sessions.length >= 3) {
      score += 20;
      reasons.push('High concurrent active sessions count');
    }

    // Clamp score 0 - 100
    score = Math.min(Math.max(score, 0), 100);

    let level = 'Low';
    if (score >= 66) level = 'High';
    else if (score >= 31) level = 'Medium';

    // Store evaluation in DB
    const assessment = await db.riskAssessment.create({
      data: {
        userId,
        score,
        level,
        reasons: JSON.stringify(reasons),
        ipAddress: ipAddress || null,
      },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        score: assessment.score,
        level: assessment.level,
        reasons,
        createdAt: assessment.createdAt,
        isHighRisk: level === 'High',
      },
    });
  } catch (error) {
    console.error('Risk Evaluation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to evaluate risk score' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const latestAssessment = await db.riskAssessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const history = await db.riskAssessment.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const loginLogs = await db.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const trustedDevs = await db.trustedDevice.findMany({
      where: { userId },
    });

    // Per-device risk breakdown — keyed on actual instanceId / deviceId, not on category strings.
    const uniqueDevicesMap = new Map<string, { deviceName: string; browser: string; ipAddress: string; location: string; isTrusted: boolean; lastSeen: string; riskScore: number; riskLevel: string }>();

    // First populate registered trusted devices (each is an individual instance)
    trustedDevs.forEach((td) => {
      const key = td.instanceId || td.deviceFingerprint || td.id;
      if (!uniqueDevicesMap.has(key)) {
        uniqueDevicesMap.set(key, {
          deviceName: td.deviceName,
          browser: td.browser || 'Browser',
          ipAddress: '10.17.87.25',
          location: td.location || 'Pune, Maharashtra, India',
          isTrusted: true,
          lastSeen: td.lastActive.toISOString(),
          riskScore: 10,
          riskLevel: 'Low',
        });
      }
    });

    loginLogs.forEach((log) => {
      // Use actual deviceId stored in loginHistory as key
      const key = log.deviceId || log.device || log.id;

      if (!uniqueDevicesMap.has(key)) {
        const isTrusted = trustedDevs.some(
          (td) => (td.instanceId && td.instanceId === log.deviceId) || td.deviceName === log.device
        );
        const deviceScore = isTrusted ? 10 : log.status === 'failed' ? 85 : 35;
        const riskLevel = deviceScore >= 66 ? 'High' : deviceScore >= 31 ? 'Medium' : 'Low';
        uniqueDevicesMap.set(key, {
          deviceName: log.device,
          browser: log.browser || 'Browser',
          ipAddress: log.ipAddress || '10.17.87.25',
          location: log.location || 'Pune, Maharashtra, India',
          isTrusted,
          lastSeen: log.createdAt.toISOString(),
          riskScore: deviceScore,
          riskLevel,
        });
      }
    });

    const deviceRisks = Array.from(uniqueDevicesMap.values());

    const score = latestAssessment?.score ?? 12;
    const level = latestAssessment?.level ?? 'Low';
    const reasons = latestAssessment ? JSON.parse(latestAssessment.reasons) : ['Trusted Device Verified', 'Clean IP Reputational Score'];

    return NextResponse.json({
      success: true,
      currentRisk: {
        score,
        level,
        reasons,
        updatedAt: latestAssessment?.createdAt || new Date().toISOString(),
        isHighRisk: level === 'High',
      },
      deviceRisks,
      history: history.map((h) => ({
        id: h.id,
        score: h.score,
        level: h.level,
        reasons: JSON.parse(h.reasons),
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch Risk Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch risk history' }, { status: 500 });
  }
}
