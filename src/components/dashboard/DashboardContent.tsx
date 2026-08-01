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
} from '@/services/auth-client';
import { MobileQRScannerModal } from '@/components/auth/MobileQRScannerModal';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations';

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
} from 'recharts';

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
  useEffect(() => {
    setMounted(true);
    if (!user?.id) return;

    setLoading(true);
    Promise.all([
      getTrustedDevices(user.id),
      getLoginHistory(user.id),
      getRiskAssessment(user.id),
      getSecurityAnalytics(user.id),
      getUserSettings(user.id),
    ]).then(([devRes, histRes, riskRes, analyticsRes, settingsRes]) => {
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
      setLoading(false);
    });
  }, [user?.id]);

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
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

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
      <div className="p-8 space-y-6 max-w-5xl animate-pulse">
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
      className="p-6 md:p-8 space-y-6 max-w-5xl"
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
          {/* Welcome Header */}
          <motion.div variants={fadeInUp}>
            <Card className="shadow-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                      {getGreeting()}, {user?.name || 'User'}!
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">{formatDate()}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <ShieldCheck className="w-5.5 h-5.5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Device Limit Warning Banner */}
          {deviceLimitMsg && (
            <motion.div variants={fadeInUp}>
              <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deviceLimitMsg}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                  Action Required
                </Badge>
              </div>
            </motion.div>
          )}

          {/* Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Security Score Card */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security Score</span>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-foreground">
                        <AnimatedCounter value={96} />
                      </p>
                      <span className="text-xs text-muted-foreground font-medium">/ 100</span>
                    </div>
                    <p className="text-[11px] text-success font-semibold flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" /> Grade A+ Rating
                    </p>
                  </div>

                  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="119.3"
                        strokeDashoffset={119.3 * (1 - 0.96)}
                        strokeLinecap="round"
                        className="text-primary transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-foreground">96%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Current Risk Level Card */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Risk</span>
                    <p className="text-3xl font-bold text-foreground">{riskData?.level || 'Low'}</p>
                    <p className="text-[11px] text-muted-foreground">Score: {riskData?.score || 12}/100</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                      <ShieldCheck className="w-5 h-5 text-success" />
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-success font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Protected
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Sessions Card */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Sessions</span>
                    <p className="text-3xl font-bold text-foreground">
                      <AnimatedCounter value={2} /> <span className="text-xs text-muted-foreground font-normal">Active</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">Windows PC & Mobile</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Radio className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trusted Devices Count */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trusted Devices</span>
                    <p className="text-3xl font-bold text-foreground">
                      <AnimatedCounter value={trustedDevices.length || 1} /> <span className="text-xs text-muted-foreground font-normal">Bound</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">Limit: {userSettingsState?.deviceLimit || 5} Max</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Laptop className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Auth Method Used Today */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between h-full">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Auth Method Today</span>
                    <p className="text-lg font-bold text-foreground truncate">
                      {(() => {
                        const isMobileClient = typeof window !== 'undefined' && /mobile|iphone|ipad|android/i.test(navigator.userAgent);
                        if (isMobileClient) {
                          const mobileLog = history.find((h) => h.device.toLowerCase().includes('mobile') || h.device.toLowerCase().includes('phone'));
                          return mobileLog?.method || 'Email OTP';
                        }
                        const desktopLog = history.find((h) => h.device.toLowerCase().includes('laptop') || h.device.toLowerCase().includes('windows'));
                        return desktopLog?.method || 'QR Login (Desktop)';
                      })()}
                    </p>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Hardware Verified</Badge>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 ml-2">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity Card */}
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card h-full hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</span>
                    <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                      Session Active
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-foreground font-semibold flex items-center justify-between">
                      <span>Last Login:</span>
                      <span className="text-muted-foreground font-normal">{history[0] ? formatTimeAgo(history[0].createdAt) : 'Just now'}</span>
                    </p>
                    <p className="text-foreground font-semibold flex items-center justify-between">
                      <span>Method:</span>
                      <span className="text-primary font-semibold">{history[0]?.method || 'Email OTP'}</span>
                    </p>
                    <p className="text-foreground font-semibold flex items-center justify-between">
                      <span>Failed Attempts (24h):</span>
                      <span className="text-success font-bold">0</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Insights Section */}
          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heading text-base font-bold text-foreground">Quick Insights</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Last Login</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{history[0] ? formatTimeAgo(history[0].createdAt) : 'Just now'}</p>
                    <p className="text-[11px] text-muted-foreground">{history[0]?.ipAddress || '10.17.87.25'} ({history[0]?.device || 'Current Session'})</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Laptop className="w-3.5 h-3.5 text-primary" />
                      <span>Last Trusted Device</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{trustedDevices[0]?.deviceName || 'Windows 11 PC'}</p>
                    <p className="text-[11px] text-muted-foreground">{trustedDevices[0]?.browser || 'Chrome 124'} • Active</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
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
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* ── 2. AUTHENTICATION VIEW ── */}
      {activeSection === 'auth_methods' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Authentication Methods</h1>
            <p className="text-sm text-muted-foreground">Manage and configure active authentication mechanisms for your account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
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
                  <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">Active & Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
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
              <CardContent className="p-6 space-y-4">
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
              <CardContent className="p-6 space-y-4">
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
                  <span className="text-xs font-medium text-muted-foreground">Under Development</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── 3. SECURITY ANALYTICS VIEW ── */}
      {activeSection === 'analytics' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Security Analytics</h1>
            <p className="text-sm text-muted-foreground">Real-time database analytics tracking authentication methods, risk distribution, and login trends.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-card hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Logins</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    <AnimatedCounter value={analyticsData?.totalLogins || 8} />
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Successful</p>
                  <p className="text-2xl font-bold text-success mt-0.5">
                    <AnimatedCounter value={analyticsData?.successfulLogins || 8} />
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Failed Attempts</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    <AnimatedCounter value={analyticsData?.failedAttempts || 0} />
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <XCircle className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success Rate</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">{analyticsData?.successRate || '100%'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="w-4.5 h-4.5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Authentication Usage</h3>
                    <p className="text-xs text-muted-foreground">Distribution of authentication methods used across sessions.</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Real-Time</Badge>
                </div>

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
                        data={analyticsData?.authUsagePie || [
                          { name: 'Email OTP', value: 4, percentage: '44.4%', lastUsed: 'Just now', fill: '#3B82F6' },
                          { name: 'Passkey WebAuthn', value: 2, percentage: '22.2%', lastUsed: '1h ago', fill: '#10B981' },
                          { name: 'QR Cross-Device', value: 3, percentage: '33.3%', lastUsed: '3h ago', fill: '#6366F1' },
                        ]}
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
                    { name: 'Email OTP', value: 4, percentage: '44.4%', fill: '#3B82F6' },
                    { name: 'Passkey WebAuthn', value: 2, percentage: '22.2%', fill: '#10B981' },
                    { name: 'QR Cross-Device', value: 3, percentage: '33.3%', fill: '#6366F1' },
                  ]).map((item, idx) => (
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
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">Risk Distribution</h3>
                    <p className="text-xs text-muted-foreground">Breakdown of evaluated session risk levels.</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Adaptive Engine</Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.riskDistributionBar || [
                      { level: 'Low Risk', count: 8, percentage: '80%', factor: 'Trusted Device Verified', fill: '#10B981' },
                      { level: 'Medium Risk', count: 2, percentage: '20%', factor: 'New Browser UserAgent', fill: '#F59E0B' },
                      { level: 'High Risk', count: 0, percentage: '0%', factor: 'Multiple Failed Attempts', fill: '#EF4444' },
                    ]}>
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
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">7-Day Login Trend</h3>
                  <p className="text-xs text-muted-foreground">Daily login frequency and activity over the past week.</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">7 Days</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.loginTrendBar || [
                    { day: 'Mon', date: 'Jul 27', logins: 3, successCount: 3, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#2563EB' },
                    { day: 'Tue', date: 'Jul 28', logins: 5, successCount: 5, failedCount: 0, mostUsed: 'Email OTP', fill: '#2563EB' },
                    { day: 'Wed', date: 'Jul 29', logins: 2, successCount: 2, failedCount: 0, mostUsed: 'QR Cross-Device', fill: '#2563EB' },
                    { day: 'Thu', date: 'Jul 30', logins: 6, successCount: 6, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#2563EB' },
                    { day: 'Fri', date: 'Jul 31', logins: 4, successCount: 4, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#2563EB' },
                    { day: 'Sat', date: 'Aug 1', logins: 7, successCount: 7, failedCount: 0, mostUsed: 'Passkey WebAuthn', fill: '#2563EB' },
                    { day: 'Sun', date: 'Aug 2', logins: 3, successCount: 3, failedCount: 0, mostUsed: 'Email OTP', fill: '#2563EB' },
                  ]}>
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
                    <Bar dataKey="logins" fill="#2563EB" radius={[8, 8, 0, 0]} className="cursor-pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 4. RISK CENTER VIEW (With Per-Device Risk Breakdown) ── */}
      {activeSection === 'risk_center' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Risk Center & Adaptive Auth</h1>
            <p className="text-sm text-muted-foreground">Risk-based adaptive authentication engine inspecting device fingerprints and location similarity.</p>
          </div>

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
                  <Card key={idx} className="shadow-card">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            {dev.deviceName.toLowerCase().includes('phone') || dev.deviceName.toLowerCase().includes('mobile') ? (
                              <Smartphone className="w-4.5 h-4.5 text-primary" />
                            ) : (
                              <Laptop className="w-4.5 h-4.5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-heading text-sm font-bold text-foreground">{dev.deviceName}</h4>
                            <p className="text-xs text-muted-foreground">{dev.browser}</p>
                          </div>
                        </div>
                        <Badge variant={dev.riskLevel === 'High' ? 'destructive' : dev.riskLevel === 'Medium' ? 'outline' : 'secondary'} className="text-[10px]">
                          Score: {dev.riskScore}/100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{dev.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{dev.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Trust Status</span>
                        <Badge variant={dev.isTrusted ? 'secondary' : 'outline'} className={dev.isTrusted ? 'bg-success/10 text-success text-[10px]' : 'text-warning border-warning/30 text-[10px]'}>
                          {dev.isTrusted ? 'Trusted Device' : 'Untrusted New Device'}
                        </Badge>
                      </div>
                    </CardContent>
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

      {/* ── 5. TRUSTED DEVICES VIEW ── */}
      {activeSection === 'trusted_devices' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Trusted Devices</h1>
            <p className="text-sm text-muted-foreground">Devices authorized to access your AuthX account without additional verification prompts.</p>
          </div>

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
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No trusted devices registered yet.
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

      {/* ── 6. LOGIN HISTORY VIEW (Real DB Records with Location & Device ID) ── */}
      {activeSection === 'history' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Login History</h1>
            <p className="text-sm text-muted-foreground">Real database audit log of all authentication events, device IDs, and location data.</p>
          </div>

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
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No matching login history entries found in database.
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

      {/* ── 7. EMERGENCY LOCKDOWN VIEW ── */}
      {activeSection === 'lockdown' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Emergency Lockdown</h1>
            <p className="text-sm text-muted-foreground">Instantly invalidate active sessions or restrict authentication protocols during security breaches.</p>
          </div>

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

      {/* ── 8. SETTINGS VIEW (VERTICAL NAVIGATION PANEL) ── */}
      {activeSection === 'settings' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Settings Panel</h1>
            <p className="text-sm text-muted-foreground">Manage your portal preferences, device limits, and alert triggers.</p>
          </div>

          {/* Vertical Settings Layout Container */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Vertical Menu */}
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

            {/* Right Side Content Panel */}
            <div className="flex-1">
              {settingsSection === 'appearance' && (
                <Card className="shadow-card">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-heading text-base font-bold text-foreground">Appearance Theme</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleUpdateSetting('theme', t.id)}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-smooth ${
                            userSettingsState?.theme === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                          }`}
                        >
                          <t.icon className="w-5 h-5" />
                          <span>{t.label}</span>
                        </button>
                      ))}
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

      {/* ── 9. PROFILE VIEW ── */}
      {activeSection === 'profile' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Profile Overview</h1>
            <p className="text-sm text-muted-foreground">Account profile details and authentication credentials summary.</p>
          </div>

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

      {/* ── 10. LINK DEVICE VIEW (Mobile Only QR Launcher) ── */}
      {activeSection === 'link_device' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Link Desktop Device</h1>
            <p className="text-sm text-muted-foreground">Scan QR code on your laptop screen to approve & link desktop sessions.</p>
          </div>

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
