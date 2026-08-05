'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Mail,
  Clock,
  Smartphone,
  Activity,
  Lock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Loader2,
  QrCode,
  Camera,
  Laptop,
  ShieldAlert,
  MapPin,
  Server,
  Wifi,
  Radio,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
  User,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Trash2,
  RefreshCw,
  Bell,
  Sliders,
  Award,
  Calendar,
  Check,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  SlidersHorizontal,
  Info,
  LogOut,
  Laptop2,
  Tv,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import {
  performPasskeyRegistration,
  getTrustedDevices,
  removeTrustedDevice,
  getLoginHistory,
  getRiskAssessment,
  getSecurityAnalytics,
  getUserSettings,
  updateUserSettings,
  executeEmergencyLockdown,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  updateSessionActivity,
  SessionItem,
} from '@/services/auth-client';
import { MobileQRScannerModal } from '@/components/auth/MobileQRScannerModal';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartCard } from '@/components/ui/chart-card';
import { InfoCallout } from '@/components/ui/info-callout';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useDashboardTheme } from '@/hooks/useDashboardTheme';

interface DashboardContentProps {
  activeSection?: string;
  dashboardData?: Record<string, unknown>;
}

/* ── Smooth Animated Counter Helper ── */
function AnimatedCounter({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMs = duration * 1000;
    const intervalMs = 20;
    const steps = Math.max(Math.floor(totalMs / intervalMs), 1);
    const stepVal = (end - start) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCount(Math.min(Math.round(stepVal * currentStep), end));
      if (currentStep >= steps) clearInterval(timer);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

export function DashboardContent({ activeSection = 'home', dashboardData }: DashboardContentProps) {
  const router = useRouter();
  const { user, sessionToken } = useAuth();
  const { themePref, setThemePref, resolvedTheme } = useDashboardTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals & Scanner
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);

  // Core Data States
  const [trustedDevices, setTrustedDevices] = useState<Array<{ id: string; deviceName: string; browser: string; location?: string; status?: string; lastActive: string; createdAt: string }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; method: string; device: string; browser: string; status: string; riskLevel?: string; ipAddress: string; location?: string; deviceId?: string; createdAt: string }>>([]);
  const [riskData, setRiskData] = useState<{ score: number; level: string; reasons: string[]; updatedAt: string; isHighRisk: boolean } | null>(null);
  const [deviceRisks, setDeviceRisks] = useState<Array<{ deviceName: string; browser: string; ipAddress: string; location: string; isTrusted: boolean; lastSeen: string; riskScore: number; riskLevel: string }>>([]);
  const [analyticsData, setAnalyticsData] = useState<{ totalLogins: number; successfulLogins: number; failedAttempts: number; successRate: string; passkeyCount: number; qrRequestsCount: number; authUsagePie: Array<{ name: string; value: number; percentage: string; lastUsed: string; fill: string }>; riskDistributionBar: Array<{ level: string; count: number; percentage: string; factor: string; fill: string }>; loginTrendBar: Array<{ day: string; date: string; logins: number; successCount: number; failedCount: number; mostUsed: string; fill: string }> } | null>(null);
  const [userSettingsState, setUserSettingsState] = useState<{ theme: string; deviceLimit: number; sessionTimeout: number; qrExpiry: number; securityAlerts: boolean; loginAlerts: boolean; qrDisabled: boolean; passkeysDisabled: boolean; requireOTPOnly: boolean } | null>(null);
  const [deviceLimitMsg, setDeviceLimitMsg] = useState<string | null>(null);

  // Session Management States
  const [sessionSummary, setSessionSummary] = useState<{ activeSessionsCount: number; totalSessionsCount: number; currentDeviceName: string; lastLoginTime: string } | null>(null);
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
  const [sessionTrustFilter, setSessionTrustFilter] = useState('all');
  const [sessionMethodFilter, setSessionMethodFilter] = useState('all');
  const [sessionSortBy, setSessionSortBy] = useState<'latest' | 'oldest' | 'active'>('latest');

  // Session Modals
  const [selectedSessionModal, setSelectedSessionModal] = useState<SessionItem | null>(null);
  const [logoutOthersModalOpen, setLogoutOthersModalOpen] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Chart Interactive Active Hover Slices
  const [pieActiveIndex, setPieActiveIndex] = useState<number | null>(null);

  // Filters & Search for Login History
  const [historySearch, setHistorySearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Vertical Settings Section Selector
  const [settingsSection, setSettingsSection] = useState<'appearance' | 'security' | 'account' | 'notifications'>('appearance');

  // Lockdown Modal Dialog
  const [lockdownModalOpen, setLockdownModalOpen] = useState(false);
  const [pendingLockdownAction, setPendingLockdownAction] = useState<string | null>(null);
  const [lockdownActionTitle, setLockdownActionTitle] = useState('');
  const [lockdownProcessing, setLockdownProcessing] = useState(false);
  const [lockdownSuccessMsg, setLockdownSuccessMsg] = useState('');

  // Initial Fetching
  const fetchAllData = () => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      getTrustedDevices(user.id),
      getLoginHistory(user.id),
      getRiskAssessment(user.id),
      getSecurityAnalytics(user.id),
      getUserSettings(user.id),
      getActiveSessions(user.id, sessionToken || undefined),
    ]).then(([devRes, histRes, riskRes, analyticsRes, settingsRes, sessionRes]) => {
      if (devRes.success && devRes.devices) setTrustedDevices(devRes.devices);
      if (histRes.success && histRes.history) {
        setHistory(histRes.history);
        if (histRes.history.some((h) => h.method.toLowerCase().includes('passkey'))) setHasPasskey(true);
      }
      if (riskRes.success && riskRes.currentRisk) {
        setRiskData(riskRes.currentRisk);
        if ((riskRes as unknown as { deviceRisks?: typeof deviceRisks }).deviceRisks) {
          setDeviceRisks((riskRes as unknown as { deviceRisks: typeof deviceRisks }).deviceRisks);
        }
      }
      if (analyticsRes.success && analyticsRes.analytics) setAnalyticsData(analyticsRes.analytics);
      if (settingsRes.success && settingsRes.settings) {
        setUserSettingsState(settingsRes.settings);
        if (settingsRes.deviceLimitMessage) setDeviceLimitMsg(settingsRes.deviceLimitMessage);
      }
      if (sessionRes.success) {
        if (sessionRes.summary) setSessionSummary(sessionRes.summary);
        if (sessionRes.sessions) setSessionsList(sessionRes.sessions);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchAllData();
  }, [user?.id, sessionToken]);

  // Activity Heartbeat Listener
  useEffect(() => {
    if (!sessionToken) return;
    const handleUserAction = () => {
      updateSessionActivity(sessionToken, true).catch(() => {});
    };
    window.addEventListener('click', handleUserAction, { passive: true });
    window.addEventListener('keydown', handleUserAction, { passive: true });

    const heartbeat = setInterval(() => {
      updateSessionActivity(sessionToken, false).catch(() => {});
    }, 60 * 1000);

    return () => {
      window.removeEventListener('click', handleUserAction);
      window.removeEventListener('keydown', handleUserAction);
      clearInterval(heartbeat);
    };
  }, [sessionToken]);

  const handleRegisterPasskey = async () => {
    if (!user?.id || !user?.email) return;
    setPasskeyRegistering(true);
    setPasskeyError('');

    try {
      const res = await performPasskeyRegistration(user.id, user.email);
      if (!res.success) {
        setPasskeyError(res.error || 'Failed to register passkey.');
      } else {
        setPasskeySuccess(true);
        setHasPasskey(true);
      }
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : 'Passkey creation failed.');
    } finally {
      setPasskeyRegistering(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeTrustedDevice(deviceId);
      setTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
      if (user?.id) {
        getUserSettings(user.id).then((res) => {
          if (res.success && res.settings) {
            setUserSettingsState(res.settings);
            setDeviceLimitMsg(res.deviceLimitMessage || null);
          }
        });
      }
    } catch {
      // ignore
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    if (!user?.id) return;
    try {
      const res = await revokeSession(user.id, sessionId, sessionToken || undefined);
      if (res.success) {
        fetchAllData();
      }
    } catch {
      // ignore
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!user?.id) return;
    setRevokingOthers(true);
    try {
      const res = await revokeAllOtherSessions(user.id, sessionToken || undefined);
      if (res.success) {
        setLogoutOthersModalOpen(false);
        fetchAllData();
      }
    } catch {
      // ignore
    } finally {
      setRevokingOthers(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: unknown) => {
    if (!user?.id) return;
    const res = await updateUserSettings(user.id, { [key]: value });
    if (res.success && res.settings) {
      setUserSettingsState(res.settings as typeof userSettingsState);
    }
  };

  const handleTriggerLockdown = async (action: string, title: string) => {
    setPendingLockdownAction(action);
    setLockdownActionTitle(title);
    setLockdownModalOpen(true);
  };

  const confirmLockdownAction = async () => {
    if (!user?.id || !pendingLockdownAction) return;
    setLockdownProcessing(true);
    setLockdownSuccessMsg('');
    try {
      const res = await executeEmergencyLockdown(user.id, pendingLockdownAction, sessionToken || undefined);
      if (res.success) {
        setLockdownSuccessMsg(res.message as string || 'Action executed successfully.');
        const updatedSettings = await getUserSettings(user.id);
        if (updatedSettings.success && updatedSettings.settings) {
          setUserSettingsState(updatedSettings.settings);
        }
      }
    } catch {
      // ignore
    } finally {
      setLockdownProcessing(false);
    }
  };

  const getGreeting = () => {
    if (!mounted) return 'Welcome';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    if (!mounted) return '';
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    const result = sessionsList.filter((s) => {
      const matchesSearch =
        s.deviceName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.browser.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.os.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.loginMethod.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.location.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.ipAddress.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.maskedIp.toLowerCase().includes(sessionSearch.toLowerCase());

      const matchesStatus =
        sessionStatusFilter === 'all' ||
        (sessionStatusFilter === 'current' ? s.isCurrent : s.status === sessionStatusFilter);

      const matchesTrust =
        sessionTrustFilter === 'all' ||
        (sessionTrustFilter === 'trusted' ? s.isTrusted : !s.isTrusted);

      const matchesMethod =
        sessionMethodFilter === 'all' ||
        s.loginMethod.toLowerCase().includes(sessionMethodFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesTrust && matchesMethod;
    });

    if (sessionSortBy === 'oldest') {
      result.sort((a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime());
    } else if (sessionSortBy === 'active') {
      result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    } else {
      result.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
    }

    return result;
  }, [sessionsList, sessionSearch, sessionStatusFilter, sessionTrustFilter, sessionMethodFilter, sessionSortBy]);

  // Filtered Login History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.device.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.method.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.ipAddress.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.deviceId || '').toLowerCase().includes(historySearch.toLowerCase());

      const matchesMethod =
        methodFilter === 'all' || item.method.toLowerCase().includes(methodFilter.toLowerCase());

      const matchesRisk =
        riskFilter === 'all' || (item.riskLevel || 'Low').toLowerCase() === riskFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesMethod && matchesRisk && matchesStatus;
    });
  }, [history, historySearch, methodFilter, riskFilter, statusFilter]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 w-full max-w-[1600px] mx-auto animate-pulse">
        <div className="h-24 bg-muted/60 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-muted/60 rounded-2xl" />
          <div className="h-28 bg-muted/60 rounded-2xl" />
          <div className="h-28 bg-muted/60 rounded-2xl" />
          <div className="h-28 bg-muted/60 rounded-2xl" />
        </div>
        <div className="h-64 bg-muted/60 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* High Risk Warning Banner */}
      {riskData?.isHighRisk && (
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card border-danger/40 bg-danger/5 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-danger animate-pulse" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-danger">High Risk Level Detected</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Suspicious activity detected on your account (Score: {riskData.score}/100). Review your Risk Center immediately.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl text-xs shrink-0"
                onClick={() => router.push('#')}
              >
                Inspect Risk
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 1. HOME VIEW ── */}
      {activeSection === 'home' && (
        <>
          <PageHeader title="Dashboard" subtitle={`${getGreeting()}, ${user?.name || 'User'}! - ${formatDate()}`} />

          {deviceLimitMsg && (
            <motion.div variants={fadeInUp}>
              <InfoCallout variant="warning">
                {deviceLimitMsg}
              </InfoCallout>
            </motion.div>
          )}

          {/* Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Security Score"
                description="Overall account health rating"
                value={<div className="flex items-baseline gap-1"><AnimatedCounter value={96} /><span className="text-xs font-normal">/ 100</span></div>}
                icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                trend={{ value: "Grade A+ Rating", isPositive: true }}
                className="h-full flex-1"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Current Threat Level"
                description="Real-time device risk score"
                value={riskData?.level || 'Low'}
                subtitle={`Score: ${riskData?.score || 12}/100`}
                icon={<ShieldCheck className="w-5 h-5 text-success" />}
                trend={{ value: "Protected", isPositive: true }}
                className="h-full flex-1"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Active Logins"
                description="Parallel active sessions count"
                value={<div className="flex items-baseline gap-1"><AnimatedCounter value={sessionSummary?.activeSessionsCount || 1} /><span className="text-xs font-normal">Active</span></div>}
                subtitle={sessionSummary?.currentDeviceName || 'Windows 11 PC'}
                icon={<Radio className="w-5 h-5 text-primary animate-pulse" />}
                className="h-full flex-1"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Trusted Devices"
                description="Hardware bound trust tokens"
                value={<div className="flex items-baseline gap-1"><AnimatedCounter value={trustedDevices.length || 1} /><span className="text-xs font-normal">Bound</span></div>}
                subtitle={`Limit: ${userSettingsState?.deviceLimit || 5} Max`}
                icon={<Laptop className="w-5 h-5 text-primary" />}
                className="h-full flex-1"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Primary Auth Method"
                description="Most frequent verification method"
                value={(() => {
                  const isMobileClient = typeof window !== 'undefined' && /mobile|iphone|ipad|android/i.test(navigator.userAgent);
                  if (isMobileClient) {
                    const mobileLog = history.find((h) => h.device.toLowerCase().includes('mobile') || h.device.toLowerCase().includes('phone'));
                    return mobileLog?.method || 'Email OTP';
                  }
                  const desktopLog = history.find((h) => h.device.toLowerCase().includes('laptop') || h.device.toLowerCase().includes('windows'));
                  return desktopLog?.method || 'QR Login (Desktop)';
                })()}
                icon={<KeyRound className="w-5 h-5 text-primary" />}
                trend={{ value: "Hardware Verified", isPositive: true }}
                className="h-full flex-1"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="h-full flex flex-col">
              <StatCard
                title="Security Audit Feed"
                description="Latest authentication event log"
                value={history[0]?.method || 'Email OTP'}
                subtitle={`Last Login: ${history[0] ? formatTimeAgo(history[0].createdAt) : 'Just now'}`}
                icon={<Activity className="w-5 h-5 text-primary" />}
                trend={{ value: "0 Failed Attempts", isPositive: true }}
                className="h-full flex-1"
              />
            </motion.div>
          </div>

          <motion.div variants={fadeInUp}>
            <SectionHeader title="Quick Insights" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Last Login</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{history[0] ? formatTimeAgo(history[0].createdAt) : 'Just now'}</p>
                <p className="text-[11px] text-muted-foreground">{history[0]?.ipAddress || '10.17.87.25'} ({history[0]?.device || 'Current Session'})</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Laptop className="w-3.5 h-3.5 text-primary" />
                  <span>Last Trusted Device</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{trustedDevices[0]?.deviceName || 'Windows 11 PC'}</p>
                <p className="text-[11px] text-muted-foreground">{trustedDevices[0]?.browser || 'Chrome 124'} • Active</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Security Recommendation</span>
                </div>
                <p className="text-xs font-medium text-foreground">
                  {hasPasskey ? 'Passkey active — hardware credentials bound.' : 'Create a Passkey for hardware-bound login.'}
                </p>
                <p className="text-[11px] text-muted-foreground">All systems operational</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <SectionHeader title="Recent Authentication Logins" />
            <div className="space-y-3">
              {history.slice(0, 4).map((log, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      {log.device.toLowerCase().includes('phone') || log.device.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-5 h-5 text-primary" />
                      ) : (
                        <Laptop className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{log.method}</p>
                      <p className="text-xs text-muted-foreground">{log.device} • {log.ipAddress} • {log.location || 'Local Network'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <Badge variant={log.status === 'failed' || log.status === 'rejected' ? 'destructive' : 'secondary'} className={log.status !== 'failed' && log.status !== 'rejected' ? 'bg-success/10 text-success text-[10px]' : 'text-[10px]'}>
                      {log.status === 'failed' || log.status === 'rejected' ? 'Failed' : 'Success'}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground font-medium">{formatTimeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                  No recent login history found.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}


      {/* ── 2. AUTHENTICATION VIEW ── */}
      {activeSection === 'auth_methods' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <PageHeader title="Authentication Methods" subtitle="Configure your authentication options" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">Email OTP</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Single-use 6-digit verification code sent via Resend API.</p>
                    </div>
                  </div>
                  <Switch
                    checked={!userSettingsState?.requireOTPOnly}
                    onCheckedChange={(val) => handleUpdateSetting('requireOTPOnly', !val)}
                  />
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge variant="success">Active & Enabled</StatusBadge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <KeyRound className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">Passkey / WebAuthn</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">FIDO2 passwordless WebAuthn touch ID / Face ID.</p>
                    </div>
                  </div>
                  <Switch
                    checked={!userSettingsState?.passkeysDisabled}
                    onCheckedChange={(val) => handleUpdateSetting('passkeysDisabled', !val)}
                  />
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Credentials</span>
                  <Button
                    onClick={handleRegisterPasskey}
                    disabled={passkeyRegistering}
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                  >
                    {passkeyRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (hasPasskey ? 'Add Passkey' : 'Register Passkey')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">QR Authentication</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Cross-device desktop login via mobile camera scan.</p>
                    </div>
                  </div>
                  <Switch
                    checked={!userSettingsState?.qrDisabled}
                    onCheckedChange={(val) => handleUpdateSetting('qrDisabled', !val)}
                  />
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Expiry Limit</span>
                  <span className="font-semibold text-foreground">60 Seconds TTL</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card opacity-80 border-dashed border-2">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-base font-semibold text-foreground">Biometric Native Sync</h3>
                        <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Hardware biometric vault integration for desktop.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge variant="neutral">Under Development</StatusBadge>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── 3. SECURITY ANALYTICS VIEW ── */}
      {activeSection === 'analytics' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Security Analytics" subtitle="Monitor authentication patterns and security events" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Logins"
              value={<AnimatedCounter value={analyticsData?.totalLogins || 8} />}
              icon={<BarChart3 className="w-4.5 h-4.5 text-primary" />}
            />
            <StatCard
              title="Successful"
              value={<div className="text-success"><AnimatedCounter value={analyticsData?.successfulLogins || 8} /></div>}
              icon={<CheckCircle className="w-4.5 h-4.5 text-success" />}
            />
            <StatCard
              title="Failed Attempts"
              value={<AnimatedCounter value={analyticsData?.failedAttempts || 0} />}
              icon={<XCircle className="w-4.5 h-4.5 text-muted-foreground" />}
            />
            <StatCard
              title="Success Rate"
              value={<div className="text-primary">{analyticsData?.successRate || '100%'}</div>}
              icon={<Award className="w-4.5 h-4.5 text-primary" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Authentication Method Usage">
                <div className="relative h-64 w-full flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-all duration-300">
                    {pieActiveIndex !== null && analyticsData?.authUsagePie?.[pieActiveIndex] ? (
                      <div className="text-center animate-fadeIn">
                        <p className="text-xs font-bold text-primary truncate max-w-[110px]">
                          {analyticsData.authUsagePie[pieActiveIndex].name}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {analyticsData.authUsagePie[pieActiveIndex].value}{' '}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({analyticsData.authUsagePie[pieActiveIndex].percentage})
                          </span>
                        </p>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          Last: {analyticsData.authUsagePie[pieActiveIndex].lastUsed}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-2xl font-bold text-foreground">
                          <AnimatedCounter value={analyticsData?.totalLogins || 8} />
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Total Logins
                        </span>
                      </div>
                    )}
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(analyticsData?.authUsagePie || [
                          { name: 'Email OTP', value: 4, percentage: '44.4%', lastUsed: 'Just now' },
                          { name: 'Passkey WebAuthn', value: 2, percentage: '22.2%', lastUsed: '1h ago' },
                          { name: 'QR Cross-Device', value: 3, percentage: '33.3%', lastUsed: '3h ago' },
                        ]).map((item) => {
                          let fill = '#428475';
                          if (item.name.includes('OTP')) fill = resolvedTheme === 'dark' ? '#5FA895' : '#428475';
                          else if (item.name.includes('Passkey')) fill = resolvedTheme === 'dark' ? '#9DE6C8' : '#89D7B7';
                          else if (item.name.includes('QR')) fill = resolvedTheme === 'dark' ? '#6EC6B3' : '#1A312C';
                          return { ...item, fill };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        onMouseEnter={(_, index) => setPieActiveIndex(index)}
                        onMouseLeave={() => setPieActiveIndex(null)}
                      >
                        {(analyticsData?.authUsagePie || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            className="transition-all duration-300 cursor-pointer"
                            stroke="hsl(var(--card))"
                            strokeWidth={3}
                            style={{
                              transform: pieActiveIndex === index ? 'scale(1.05)' : 'scale(1)',
                              transformOrigin: 'center center',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        position={{ x: 10, y: 10 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 bg-card/95 border border-border/80 rounded-xl shadow-card text-[11px] space-y-0.5 backdrop-blur-xs z-30">
                                <p className="font-bold text-foreground flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
                                  {data.name}
                                </p>
                                <p className="text-muted-foreground">Logins: <strong className="text-foreground">{data.value}</strong> ({data.percentage})</p>
                                <p className="text-muted-foreground">Last Used: <span className="text-primary font-medium">{data.lastUsed}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-border/60 text-xs">
                  {(analyticsData?.authUsagePie || [
                    { name: 'Email OTP', value: 4, percentage: '44.4%' },
                    { name: 'Passkey WebAuthn', value: 2, percentage: '22.2%' },
                    { name: 'QR Cross-Device', value: 3, percentage: '33.3%' },
                  ]).map((item) => {
                    let fill = '#428475';
                    if (item.name.includes('OTP')) fill = resolvedTheme === 'dark' ? '#5FA895' : '#428475';
                    else if (item.name.includes('Passkey')) fill = resolvedTheme === 'dark' ? '#9DE6C8' : '#89D7B7';
                    else if (item.name.includes('QR')) fill = resolvedTheme === 'dark' ? '#6EC6B3' : '#1A312C';
                    return { ...item, fill };
                  }).map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 cursor-pointer transition-smooth ${
                        pieActiveIndex === idx ? 'font-bold text-foreground' : 'text-muted-foreground'
                      }`}
                      onMouseEnter={() => setPieActiveIndex(idx)}
                      onMouseLeave={() => setPieActiveIndex(null)}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span>{item.name}</span>
                      <span className="text-[11px] font-semibold text-foreground">({item.percentage})</span>
                    </div>
                  ))}
                </div>
            </ChartCard>

            <ChartCard title="Risk Distribution">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(analyticsData?.riskDistributionBar || [
                      { level: 'Low Risk', count: 8, percentage: '80%', factor: 'Trusted Device Verified' },
                      { level: 'Medium Risk', count: 2, percentage: '20%', factor: 'New Browser UserAgent' },
                      { level: 'High Risk', count: 0, percentage: '0%', factor: 'Multiple Failed Attempts' },
                    ]).map((item) => {
                      let fill = '#428475';
                      if (item.level.includes('Low')) fill = resolvedTheme === 'dark' ? '#3DDC97' : '#428475';
                      else if (item.level.includes('Medium')) fill = resolvedTheme === 'dark' ? '#F4C95D' : '#F59E0B';
                      else if (item.level.includes('High')) fill = resolvedTheme === 'dark' ? '#EF6A6A' : '#EF4444';
                      return { ...item, fill };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#31443F' : '#E5D7C3'} vertical={false} />
                      <XAxis dataKey="level" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-card border border-border/80 rounded-xl shadow-card text-xs space-y-1">
                                <p className="font-bold text-foreground">{data.level}</p>
                                <p className="text-muted-foreground">Count: <strong className="text-foreground">{data.count}</strong> ({data.percentage})</p>
                                <p className="text-muted-foreground">Factor: <span className="text-foreground font-medium">{data.factor}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} className="cursor-pointer">
                        {(analyticsData?.riskDistributionBar || []).map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </ChartCard>
          </div>

          <ChartCard title="7-Day Login Trend">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.loginTrendBar || [
                    { day: 'Mon', date: 'Jul 27', logins: 3, successCount: 3, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#428475' },
                    { day: 'Tue', date: 'Jul 28', logins: 5, successCount: 5, failedCount: 0, mostUsed: 'Email OTP', fill: '#428475' },
                    { day: 'Wed', date: 'Jul 29', logins: 2, successCount: 2, failedCount: 0, mostUsed: 'QR Cross-Device', fill: '#428475' },
                    { day: 'Thu', date: 'Jul 30', logins: 6, successCount: 6, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#428475' },
                    { day: 'Fri', date: 'Jul 31', logins: 4, successCount: 4, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#428475' },
                    { day: 'Sat', date: 'Aug 1', logins: 7, successCount: 7, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#428475' },
                    { day: 'Sun', date: 'Aug 2', logins: 3, successCount: 3, failedCount: 0, mostUsed: 'Email OTP', fill: '#428475' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#31443F' : '#E5D7C3'} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-card border border-border/80 rounded-xl shadow-card text-xs space-y-1">
                              <p className="font-bold text-foreground">{data.date} ({data.day})</p>
                              <p className="text-muted-foreground">Successful Logins: <strong className="text-success">{data.successCount}</strong></p>
                              <p className="text-muted-foreground">Failed Attempts: <strong className="text-foreground">{data.failedCount}</strong></p>
                              <p className="text-muted-foreground">Primary Method: <span className="text-primary font-medium">{data.mostUsed}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="logins" fill="#428475" radius={[8, 8, 0, 0]} className="cursor-pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </ChartCard>
        </motion.div>
      )}

      {/* ── 4. SESSION MANAGEMENT VIEW ── */}
      {activeSection === 'sessions' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Session Management" subtitle="Monitor and manage active sessions" />

          {/* Top Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Sessions"
              value={<AnimatedCounter value={sessionSummary?.activeSessionsCount || filteredSessions.filter((s) => s.status === 'active' || s.status === 'idle').length} />}
              icon={<Radio className="w-5 h-5 text-success animate-pulse" />}
            />
            <StatCard
              title="Total Sessions"
              value={<AnimatedCounter value={sessionSummary?.totalSessionsCount || filteredSessions.length} />}
              icon={<Laptop className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Current Device"
              value={sessionSummary?.currentDeviceName || 'Windows 11 Laptop'}
              icon={<ShieldCheck className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Last Login"
              value={sessionSummary?.lastLoginTime ? formatTimeAgo(sessionSummary.lastLoginTime) : 'Just now'}
              icon={<Clock className="w-5 h-5 text-primary" />}
            />
          </div>

          {/* Search, Filter & Sorting Bar */}
          <Card className="shadow-card">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search device, OS, IP, location..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={sessionStatusFilter}
                  onChange={(e) => setSessionStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="current">This Device</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>

                <select
                  value={sessionTrustFilter}
                  onChange={(e) => setSessionTrustFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  <option value="all">All Trust Levels</option>
                  <option value="trusted">Trusted Devices</option>
                  <option value="untrusted">Untrusted</option>
                </select>

                <select
                  value={sessionMethodFilter}
                  onChange={(e) => setSessionMethodFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  <option value="all">All Methods</option>
                  <option value="passkey">Passkey</option>
                  <option value="qr">QR Login</option>
                  <option value="otp">Email OTP</option>
                </select>

                <select
                  value={sessionSortBy}
                  onChange={(e) => setSessionSortBy(e.target.value as typeof sessionSortBy)}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  <option value="latest">Sort: Latest Login</option>
                  <option value="oldest">Sort: Oldest Login</option>
                  <option value="active">Sort: Most Active</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Session Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((s) => (
                <Card key={s.id} className={`shadow-card transition-all duration-300 hover:shadow-card-hover ${s.isCurrent ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          {s.deviceType?.toLowerCase().includes('phone') || s.deviceType?.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-5 h-5 text-primary" />
                          ) : (
                            <Laptop className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading text-sm font-bold text-foreground">{s.deviceName}</h3>
                            {s.isCurrent && (
                              <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[10px] px-2 py-0.5 border border-primary/30 font-bold">
                                This Device
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.browser} • {s.os}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            s.status === 'active'
                              ? 'secondary'
                              : s.status === 'idle'
                              ? 'outline'
                              : s.status === 'revoked'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            s.status === 'active'
                              ? 'bg-success/10 text-success border-success/30 text-[10px]'
                              : s.status === 'idle'
                              ? 'bg-warning/10 text-warning border-warning/30 text-[10px]'
                              : 'text-[10px]'
                          }
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'active' ? 'bg-success animate-pulse' : s.status === 'idle' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                          {s.status.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">Duration: {s.duration}</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{s.loginMethod}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{s.maskedIp}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Activity: {formatTimeAgo(s.lastActivity)}</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <Button
                        onClick={() => setSelectedSessionModal(s)}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-xl gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                        View Details
                      </Button>

                      {s.isCurrent ? (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 py-1 px-3">
                          Current Active Session
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleRevokeSingleSession(s.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-danger hover:bg-danger/10 hover:text-danger rounded-xl gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout Session
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState title="No Sessions Found" description="No matching sessions found for current filter criteria." icon={<Search className="w-8 h-8" />} />
              </div>
            )}
          </div>

          {/* Bottom Action: Logout All Other Devices */}
          <Card className="shadow-card border-danger/30 bg-danger/5">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20 shrink-0">
                  <Flame className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Bulk Session Termination</h4>
                  <p className="text-xs text-muted-foreground">
                    Revoke all active sessions on other phones, laptops, and tablets. Your current device will stay logged in.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setLogoutOthersModalOpen(true)}
                variant="destructive"
                className="rounded-xl text-xs font-semibold h-10 shrink-0 gap-2 shadow-card"
              >
                <LogOut className="w-4 h-4" />
                Logout All Other Devices
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 5. RISK CENTER VIEW (With Per-Device Risk Breakdown) ── */}
      {activeSection === 'risk_center' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Risk Center" subtitle="Monitor security risk levels" />

          {/* Overall Account Risk Card */}
          <Card className="shadow-card">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall Account Risk</span>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <span className="text-4xl font-bold text-foreground">{riskData?.score || 12}</span>
                  <span className="text-sm text-muted-foreground font-medium">/ 100</span>
                  <Badge variant={riskData?.level === 'High' ? 'destructive' : riskData?.level === 'Medium' ? 'outline' : 'secondary'} className="text-xs px-3 py-1">
                    {riskData?.level || 'Low'} Risk Level
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last evaluated: {riskData?.updatedAt ? formatTimeAgo(riskData.updatedAt) : 'Just now'}
                </p>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Overall Safety Gauge</span>
                  <span>{riskData?.score || 12}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (riskData?.score || 12) >= 66 ? 'bg-danger' : (riskData?.score || 12) >= 31 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${riskData?.score || 12}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-Device Risk Breakdown Section */}
          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-foreground">Per-Device Risk Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deviceRisks.length > 0 ? (
                deviceRisks.map((dev, idx) => (
                  <Card key={idx} className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          {dev.deviceName.toLowerCase().includes('phone') || dev.deviceName.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-5 h-5 text-primary" />
                          ) : (
                            <Laptop className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-foreground">{dev.deviceName}</h4>
                          <p className="text-xs text-muted-foreground">{dev.browser}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={dev.riskLevel === 'High' ? 'destructive' : dev.riskLevel === 'Medium' ? 'outline' : 'secondary'} className={dev.riskLevel !== 'High' && dev.riskLevel !== 'Medium' ? 'bg-success/10 text-success text-[10px]' : 'text-[10px]'}>
                          {dev.riskLevel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">Score: {dev.riskScore}/100</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dev.riskScore >= 66 ? 'bg-danger' : dev.riskScore >= 31 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(dev.riskScore, 100)}%` }}
                      />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{dev.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{dev.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <StatusBadge variant={dev.isTrusted ? "success" : "warning"} className="text-[10px]">
                          {dev.isTrusted ? 'Trusted Device' : 'Untrusted'}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Activity: {formatTimeAgo(dev.lastSeen || new Date().toISOString())}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-xl gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                        View Risk Analysis
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="shadow-card md:col-span-2">
                  <CardContent className="p-6 text-center text-xs text-muted-foreground">
                    All connected devices operating within expected safety metrics (100% Trusted).
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 6. TRUSTED DEVICES VIEW ── */}
      {activeSection === 'trusted_devices' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <PageHeader title="Trusted Devices" subtitle="Manage devices trusted for authentication" />

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="p-4">Device</th>
                      <th className="p-4">Browser & OS</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Trust Status</th>
                      <th className="p-4">Last Active</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {trustedDevices.length > 0 ? (
                      trustedDevices.map((dev) => (
                        <tr key={dev.id} className="hover:bg-muted/40 transition-smooth">
                          <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-primary" />
                            {dev.deviceName}
                          </td>
                          <td className="p-4 text-muted-foreground">{dev.browser || 'Chrome 124'}</td>
                          <td className="p-4 text-muted-foreground">{dev.location || 'Local Network (Wi-Fi)'}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">100% Trusted</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{formatTimeAgo(dev.lastActive || dev.createdAt)}</td>
                          <td className="p-4 text-right">
                            <Button
                              onClick={() => handleRemoveDevice(dev.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-danger hover:bg-danger/10 hover:text-danger rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Remove Trust
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8">
                          <EmptyState title="No Trusted Devices" description="No trusted devices registered yet." icon={<Laptop className="w-8 h-8" />} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 7. LOGIN HISTORY VIEW (Real DB Records with Location & Device ID) ── */}
      {activeSection === 'history' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <PageHeader title="Login History" subtitle="Audit trail of authentication events" />

          <Card className="shadow-card">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search device, location, ID..."
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="all">All Methods</option>
                  <option value="passkey">Passkey</option>
                  <option value="qr">QR Code</option>
                  <option value="otp">Email OTP</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Device & ID</th>
                      <th className="p-4">Location / IP</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedHistory.length > 0 ? (
                      paginatedHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/40 transition-smooth">
                          <td className="p-4 font-medium text-foreground">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="p-4 font-semibold text-primary">{item.method}</td>
                          <td className="p-4">
                            <p className="font-medium text-foreground">{item.device}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.deviceId || `dev_${item.id.slice(0, 7)}`}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            <p className="font-medium text-foreground">{item.location || 'Local Network'}</p>
                            <span className="text-[10px]">{item.ipAddress} ({item.browser})</span>
                          </td>
                          <td className="p-4">
                            <Badge variant={item.status === 'failed' || item.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={item.riskLevel === 'High' ? 'destructive' : item.riskLevel === 'Medium' ? 'outline' : 'secondary'} className="text-[10px]">
                              {item.riskLevel || 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8">
                          <EmptyState title="No Login History" description="No matching login history entries found in database." icon={<Search className="w-8 h-8" />} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Showing {paginatedHistory.length} of {filteredHistory.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="font-semibold text-foreground">Page {currentPage} of {totalPages}</span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 8. EMERGENCY LOCKDOWN VIEW ── */}
      {activeSection === 'lockdown' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Emergency Lockdown" subtitle="Critical security controls" />
          <InfoCallout variant="danger">
            Warning: The actions below will immediately disrupt authentication and active sessions.
          </InfoCallout>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-card border-danger/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20">
                    <Flame className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Logout All Other Devices</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Terminates all active sessions except your current device.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTriggerLockdown('logout_all', 'Logout All Other Devices')}
                  variant="destructive"
                  className="w-full rounded-xl text-xs font-semibold h-10"
                >
                  Execute Session Purge
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                    <QrCode className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Disable QR Authentication</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Block cross-device QR code desktop approvals.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTriggerLockdown('disable_qr', 'Disable QR Code Login')}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-10"
                >
                  {userSettingsState?.qrDisabled ? 'Re-enable QR Login' : 'Disable QR Code Login'}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                    <KeyRound className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Disable Passkeys</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Suspend WebAuthn passkey authentication.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTriggerLockdown('disable_passkeys', 'Disable Passkeys')}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-10"
                >
                  {userSettingsState?.passkeysDisabled ? 'Re-enable Passkeys' : 'Disable Passkeys'}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                    <Mail className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Require Strict Email OTP</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Force all logins through single-use email OTP.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTriggerLockdown('require_otp', 'Enforce Strict OTP')}
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold h-10"
                >
                  {userSettingsState?.requireOTPOnly ? 'Disable Strict OTP' : 'Enforce Email OTP Only'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── 9. SETTINGS VIEW (VERTICAL NAVIGATION PANEL) ── */}
      {activeSection === 'settings' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Settings" subtitle="Configure your account preferences" />

          <div className="flex flex-col md:flex-row gap-6">
            <Card className="shadow-card md:w-64 shrink-0 h-fit">
              <CardContent className="p-3 space-y-1">
                {[
                  { id: 'appearance', label: 'Appearance Theme', icon: Sun },
                  { id: 'security', label: 'Security Policies', icon: Shield },
                  { id: 'account', label: 'Account Details', icon: User },
                  { id: 'notifications', label: 'Alert Notifications', icon: Bell },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSettingsSection(item.id as typeof settingsSection)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-smooth ${
                      settingsSection === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex-1">
              {settingsSection === 'appearance' && (
                <Card className="shadow-card border-border/80 rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-base font-bold text-foreground">Appearance Theme</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Customize your dashboard display color mode.</p>
                      </div>
                      <StatusBadge variant="primary" className="capitalize">
                        Active: {themePref} Mode
                      </StatusBadge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {[
                        { id: 'light' as const, label: 'Light Theme', icon: Sun, desc: 'Warm Cream & Forest Green' },
                        { id: 'dark' as const, label: 'Dark Theme', icon: Moon, desc: 'Deep Forest & Mint' },
                        { id: 'system' as const, label: 'System Theme', icon: Monitor, desc: 'Follow OS Preferences' },
                      ].map((t) => {
                        const isSelected = themePref === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setThemePref(t.id);
                              handleUpdateSetting('theme', t.id);
                            }}
                            className={`p-5 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary/30'
                                : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              <t.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-heading text-sm font-bold text-foreground">{t.label}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {settingsSection === 'security' && (
                <Card className="shadow-card">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="font-heading text-base font-bold text-foreground">Security Policies</h3>
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Maximum Device Limit</p>
                          <p className="text-muted-foreground">Limit number of trusted devices bound to your account.</p>
                        </div>
                        <select
                          value={userSettingsState?.deviceLimit || 5}
                          onChange={(e) => handleUpdateSetting('deviceLimit', Number(e.target.value))}
                          className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                        >
                          {[1, 2, 3, 5, 10].map((n) => (
                            <option key={n} value={n}>{n} Devices</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                          <p className="font-semibold text-foreground">Session Timeout</p>
                          <p className="text-muted-foreground">Automatic session expiry duration.</p>
                        </div>
                        <select
                          value={userSettingsState?.sessionTimeout || 24}
                          onChange={(e) => handleUpdateSetting('sessionTimeout', Number(e.target.value))}
                          className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                        >
                          {[1, 6, 12, 24, 72].map((n) => (
                            <option key={n} value={n}>{n} Hours</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                          <p className="font-semibold text-foreground">QR Expiry TTL</p>
                          <p className="text-muted-foreground">Lifespan of one-time desktop QR codes.</p>
                        </div>
                        <select
                          value={userSettingsState?.qrExpiry || 60}
                          onChange={(e) => handleUpdateSetting('qrExpiry', Number(e.target.value))}
                          className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                        >
                          {[30, 60, 120, 300].map((n) => (
                            <option key={n} value={n}>{n} Seconds</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {settingsSection === 'account' && (
                <Card className="shadow-card">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-heading text-base font-bold text-foreground">Account Details</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-muted-foreground font-medium block mb-1">Email Address</label>
                        <Input value={user?.email || ''} readOnly className="h-9 rounded-xl text-xs bg-muted/30" />
                      </div>
                      <div>
                        <label className="text-muted-foreground font-medium block mb-1">Full Name</label>
                        <Input defaultValue={user?.name || 'AuthX User'} className="h-9 rounded-xl text-xs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {settingsSection === 'notifications' && (
                <Card className="shadow-card">
                  <CardContent className="p-6 space-y-4 text-xs">
                    <h3 className="font-heading text-base font-bold text-foreground">Alert Notifications</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Security Alerts</p>
                        <p className="text-muted-foreground">Receive instant alerts for high-risk logins.</p>
                      </div>
                      <Switch
                        checked={userSettingsState?.securityAlerts ?? true}
                        onCheckedChange={(val) => handleUpdateSetting('securityAlerts', val)}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <p className="font-semibold text-foreground">Login Notifications</p>
                        <p className="text-muted-foreground">Email notification whenever a new device connects.</p>
                      </div>
                      <Switch
                        checked={userSettingsState?.loginAlerts ?? true}
                        onCheckedChange={(val) => handleUpdateSetting('loginAlerts', val)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 10. PROFILE VIEW ── */}
      {activeSection === 'profile' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <PageHeader title="Profile" subtitle="Your account overview" />

          <Card className="shadow-card">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                  {user?.name?.[0] || user?.email?.[0] || 'A'}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{user?.name || 'AuthX User'}</h3>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1 bg-success/10 text-success text-[10px]">
                    Verified Member
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Member Since</span>
                  <p className="font-semibold text-foreground mt-0.5">August 2026</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Security Rating</span>
                  <p className="font-semibold text-success mt-0.5">96 / 100 (Grade A+)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Authentication Summary</span>
                  <p className="font-semibold text-foreground mt-0.5">{hasPasskey ? 'Passkey & Email OTP' : 'Email OTP Active'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 11. LINK DEVICE VIEW (Mobile Only QR Launcher) ── */}
      {activeSection === 'link_device' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <PageHeader title="Link Device" subtitle="Connect a mobile device for QR authentication" />

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div className="max-w-md">
                  <h3 className="font-heading text-lg font-bold text-foreground">Approve Laptop Login</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open AuthX on your laptop, select QR Code login, and scan the displayed QR code with your mobile camera.
                  </p>
                </div>

                <Button
                  onClick={() => setScannerModalOpen(true)}
                  className="rounded-xl h-12 px-6 text-sm font-semibold gap-2 shadow-card hover:shadow-card-hover"
                >
                  <Camera className="w-4 h-4" />
                  Scan QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* SESSION DETAIL MODAL DIALOG */}
      <AnimatePresence>
        {selectedSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-5 shadow-card"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">{selectedSessionModal.deviceName}</h3>
                    <p className="text-xs text-muted-foreground">{selectedSessionModal.browser} • {selectedSessionModal.os}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedSessionModal(null)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>

              {/* Authentication Strength Rating Indicator */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Authentication Strength</span>
                  <Badge variant="outline" className={selectedSessionModal.authStrength.badgeColor}>
                    {selectedSessionModal.authStrength.label}
                  </Badge>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${selectedSessionModal.authStrength.score}%` }}
                  />
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Device Fingerprint</span>
                  <p className="font-mono text-[11px] text-foreground font-semibold truncate">{selectedSessionModal.deviceFingerprint}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">IP Address & Location</span>
                  <p className="font-semibold text-foreground truncate">{selectedSessionModal.ipAddress}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{selectedSessionModal.location}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Platform & Resolution</span>
                  <p className="font-semibold text-foreground">{selectedSessionModal.platform} ({selectedSessionModal.screenResolution})</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Timezone & Language</span>
                  <p className="font-semibold text-foreground">{selectedSessionModal.timezone} ({selectedSessionModal.language})</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Login Time</span>
                  <p className="font-semibold text-foreground">{new Date(selectedSessionModal.loginTime).toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Last Activity</span>
                  <p className="font-semibold text-foreground">{new Date(selectedSessionModal.lastActivity).toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Session Expiry</span>
                  <p className="font-semibold text-foreground">{new Date(selectedSessionModal.expiresAt).toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-muted-foreground">Network Type</span>
                  <p className="font-semibold text-foreground">{selectedSessionModal.networkType}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] space-y-1">
                <span className="text-muted-foreground font-semibold">User Agent</span>
                <p className="font-mono text-muted-foreground break-all">{selectedSessionModal.userAgent}</p>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={() => setSelectedSessionModal(null)}
                  className="rounded-xl text-xs h-9 px-6 font-semibold"
                >
                  Close Details
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT ALL OTHER SESSIONS CONFIRMATION MODAL */}
      <AnimatePresence>
        {logoutOthersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-card"
            >
              <div className="flex items-center gap-3 text-danger">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="font-heading text-base font-bold">Logout All Other Devices</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to terminate all active sessions on other devices? You will remain logged in on this device, but all other phones, laptops, and browser sessions will be invalidated immediately.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => setLogoutOthersModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRevokeAllOtherSessions}
                  disabled={revokingOthers}
                  variant="destructive"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  {revokingOthers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Termination'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lockdown Confirmation Modal Dialog */}
      <AnimatePresence>
        {lockdownModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-card"
            >
              <div className="flex items-center gap-3 text-danger">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="font-heading text-base font-bold">Confirm Lockdown Action</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to execute <span className="font-semibold text-foreground">{lockdownActionTitle}</span>? This security directive will take effect immediately.
              </p>

              {lockdownSuccessMsg && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{lockdownSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => setLockdownModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmLockdownAction}
                  disabled={lockdownProcessing}
                  variant="destructive"
                  size="sm"
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  {lockdownProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Action'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile-Only Camera Scanner Modal */}
      <MobileQRScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={(reqId) => {
          setScannerModalOpen(false);
          router.push(`/qr-approve?requestId=${reqId}`);
        }}
      />
    </motion.div>
  );
}
