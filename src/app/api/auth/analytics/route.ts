import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Read directly from DB
    const loginHistory = await db.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const passkeyCount = await db.passkeyCredential.count({ where: { userId } });
    const qrRequestsCount = await db.qRLoginRequest.count({ where: { userId, status: 'approved' } });
    const otpCount = await db.oTPCode.count({ where: { userId, verified: true } });
    const riskAssessments = await db.riskAssessment.findMany({ where: { userId } });

    // Method breakdown for Authentication Usage (Donut Chart)
    const otpLogs = loginHistory.filter((h) => h.method.toLowerCase().includes('otp') || h.method.toLowerCase().includes('email'));
    const passkeyLogs = loginHistory.filter((h) => h.method.toLowerCase().includes('passkey'));
    const qrLogs = loginHistory.filter((h) => h.method.toLowerCase().includes('qr'));

    const otpValue = otpLogs.length || (otpCount > 0 ? otpCount : 1);
    const passkeyValue = passkeyLogs.length || (passkeyCount > 0 ? passkeyCount : 1);
    const qrValue = qrLogs.length || (qrRequestsCount > 0 ? qrRequestsCount : 1);
    const totalAuthUsage = otpValue + passkeyValue + qrValue;

    const formatTimeAgo = (date?: Date) => {
      if (!date) return 'Just now';
      const diffMs = Date.now() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${Math.floor(diffHrs / 24)}d ago`;
    };

    const authUsagePie = [
      {
        name: 'Email OTP',
        value: otpValue,
        percentage: `${((otpValue / totalAuthUsage) * 100).toFixed(1)}%`,
        lastUsed: formatTimeAgo(otpLogs[0]?.createdAt),
        fill: '#3B82F6',
      },
      {
        name: 'Passkey WebAuthn',
        value: passkeyValue,
        percentage: `${((passkeyValue / totalAuthUsage) * 100).toFixed(1)}%`,
        lastUsed: formatTimeAgo(passkeyLogs[0]?.createdAt),
        fill: '#10B981',
      },
      {
        name: 'QR Cross-Device',
        value: qrValue,
        percentage: `${((qrValue / totalAuthUsage) * 100).toFixed(1)}%`,
        lastUsed: formatTimeAgo(qrLogs[0]?.createdAt),
        fill: '#6366F1',
      },
    ];

    // Risk Distribution for Vertical Bar Chart
    const lowRiskCount = riskAssessments.filter((r) => r.level === 'Low').length || loginHistory.filter((h) => !h.riskLevel || h.riskLevel === 'Low').length || 1;
    const mediumRiskCount = riskAssessments.filter((r) => r.level === 'Medium').length || loginHistory.filter((h) => h.riskLevel === 'Medium').length || 0;
    const highRiskCount = riskAssessments.filter((r) => r.level === 'High').length || loginHistory.filter((h) => h.riskLevel === 'High').length || 0;
    const totalRiskCount = lowRiskCount + mediumRiskCount + highRiskCount;

    const riskDistributionBar = [
      {
        level: 'Low Risk',
        count: lowRiskCount,
        percentage: `${((lowRiskCount / totalRiskCount) * 100).toFixed(1)}%`,
        factor: 'Trusted Device Verified',
        fill: '#10B981',
      },
      {
        level: 'Medium Risk',
        count: mediumRiskCount,
        percentage: `${((mediumRiskCount / totalRiskCount) * 100).toFixed(1)}%`,
        factor: 'New Browser / Location',
        fill: '#F59E0B',
      },
      {
        level: 'High Risk',
        count: highRiskCount,
        percentage: `${((highRiskCount / totalRiskCount) * 100).toFixed(1)}%`,
        factor: 'Multiple Failed Attempts',
        fill: '#EF4444',
      },
    ];

    // 7-Day Login Trend for Vertical Bar Chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const trendMap: Record<string, { total: number; success: number; failed: number; dateStr: string }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap[dayName] = { total: 0, success: 0, failed: 0, dateStr };
    }

    loginHistory.forEach((item) => {
      const d = new Date(item.createdAt);
      const dayName = days[d.getDay()];
      if (trendMap[dayName]) {
        trendMap[dayName].total += 1;
        if (item.status === 'failed' || item.status === 'rejected') {
          trendMap[dayName].failed += 1;
        } else {
          trendMap[dayName].success += 1;
        }
      }
    });

    const loginTrendBar = Object.keys(trendMap).map((day) => {
      const info = trendMap[day];
      const logins = info.total > 0 ? info.total : 1;
      const successCount = info.total > 0 ? info.success : 1;
      const failedCount = info.failed;
      return {
        day,
        date: info.dateStr,
        logins,
        successCount,
        failedCount,
        mostUsed: passkeyValue >= otpValue ? 'Passkey WebAuthn' : 'Email OTP',
        fill: '#2563EB',
      };
    });

    const failedLogins = loginHistory.filter((h) => h.status === 'failed' || h.status === 'rejected').length;
    const totalLogins = loginHistory.length || totalAuthUsage;
    const successfulLogins = Math.max(0, totalLogins - failedLogins);
    const successRate = totalLogins > 0 ? `${(((totalLogins - failedLogins) / totalLogins) * 100).toFixed(1)}%` : '100%';

    return NextResponse.json({
      success: true,
      analytics: {
        totalLogins,
        successfulLogins,
        failedAttempts: failedLogins,
        successRate,
        passkeyCount,
        qrRequestsCount,
        authUsagePie,
        riskDistributionBar,
        loginTrendBar,
      },
    });
  } catch (error) {
    console.error('Analytics Backend Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics metrics' }, { status: 500 });
  }
}
