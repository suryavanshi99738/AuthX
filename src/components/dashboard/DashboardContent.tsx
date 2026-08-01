import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import {
  performPasskeyRegistration,
  getTrustedDevices,
  removeTrustedDevice,
  getLoginHistory,
} from '@/services/auth-client';
import { MobileQRScannerModal } from '@/components/auth/MobileQRScannerModal';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface DashboardContentProps {
  dashboardData?: Record<string, unknown>;
}

export function DashboardContent({ dashboardData }: DashboardContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  const handleRegisterPasskey = async () => {
    if (!user?.id || !user?.email) return;
    setPasskeyRegistering(true);
    setPasskeyError('');
    setPasskeySuccess(false);

    try {
      const res = await performPasskeyRegistration(user.id, user.email);
      if (!res.success) {
        setPasskeyError(res.error || 'Failed to register passkey.');
      } else {
        setPasskeySuccess(true);
      }
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : 'Passkey creation failed.');
    } finally {
      setPasskeyRegistering(false);
    }
  };

  // Extract data from dashboard API response or use defaults
  const securityStatus = (dashboardData?.securityStatus as { score: number; passkeyEnabled: boolean; twoFactorEnabled: boolean }) || {
    score: 92,
    passkeyEnabled: true,
    twoFactorEnabled: true,
  };
  const recentLogins = (dashboardData?.recentLogins as Array<{ id: string; device: string; method: string; timestamp: string; status: string }>) || [];
  const trustedDevices = (dashboardData?.trustedDevices as Array<{ id: string; name: string; type: string; lastUsed: string; passkeyRegistered: boolean }>) || [];

  const [realTrustedDevices, setRealTrustedDevices] = useState<Array<{ id: string; deviceName: string; browser: string; lastActive: string; createdAt: string }>>([]);
  const [realHistory, setRealHistory] = useState<Array<{ id: string; method: string; device: string; browser: string; status: string; ipAddress: string; createdAt: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      getTrustedDevices(user.id).then((res) => {
        if (res.success && res.devices) setRealTrustedDevices(res.devices);
      });
      getLoginHistory(user.id).then((res) => {
        if (res.success && res.history) setRealHistory(res.history);
      });
    }
  }, [user?.id]);

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeTrustedDevice(deviceId);
      setRealTrustedDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {
      // ignore
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

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 max-w-5xl"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Welcome Card */}
      <motion.div variants={fadeInUp}>
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl font-semibold text-foreground mb-1">
                  {getGreeting()}, {user?.name || 'User'}!
                </h1>
                <p className="text-sm text-muted-foreground">{formatDate()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Passkey Management Card */}
      <motion.div variants={fadeInUp}>
        <Card className="shadow-card overflow-hidden border-primary/20 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">Passkey & WebAuthn Security</h3>
                    {passkeySuccess && (
                      <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                        Passkey Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    Secure your banking account with passwordless WebAuthn passkeys using Touch ID, Face ID, or Windows Hello.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleRegisterPasskey}
                disabled={passkeyRegistering}
                className="rounded-xl h-11 px-5 shadow-card hover:shadow-card-hover transition-smooth shrink-0"
              >
                {passkeyRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {passkeySuccess ? 'Add Another Passkey' : 'Create Passkey'}
                  </>
                )}
              </Button>
            </div>

            {passkeyError && (
              <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passkeyError}</span>
              </div>
            )}

            {passkeySuccess && (
              <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Passkey registered successfully! You can now sign in with your device passkey.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Security Score */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Security Score</p>
                  <p className="text-xs text-muted-foreground">Overall protection</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{securityStatus.score}%</span>
                  <Badge variant="secondary" className="text-success text-xs">Excellent</Badge>
                </div>
                <Progress value={securityStatus.score} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auth Status */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Authentication</p>
                  <p className="text-xs text-muted-foreground">Active methods</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-foreground">Passkey Enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-foreground">OTP Enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Login */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Recent Login</p>
                  <p className="text-xs text-muted-foreground">Last activity</p>
                </div>
              </div>
              {recentLogins.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{recentLogins[0].device}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(recentLogins[0].timestamp)}</p>
                  <Badge variant="secondary" className="text-xs">{recentLogins[0].method}</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trusted Devices + Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Link Device (Scan QR) */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Link Laptop / Desktop Device</p>
                  <p className="text-xs text-muted-foreground">Scan QR code to approve desktop login</p>
                </div>
              </div>

              {/* Scan QR Button */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Approve Desktop Logins</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Scan the QR code displayed on your laptop screen to verify & log in.
                  </p>
                </div>
                <Button
                  onClick={() => setScannerModalOpen(true)}
                  className="w-full rounded-xl h-10 text-xs font-semibold gap-2 shadow-card hover:shadow-card-hover"
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR Code
                </Button>
              </div>

              {/* Linked Devices List if any */}
              {realTrustedDevices.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">Linked Devices</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {realTrustedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-foreground font-medium">{device.deviceName}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="text-[11px] text-danger hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity / Login History */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Login History & Activity</p>
                  <p className="text-xs text-muted-foreground font-normal">Audit log of login events</p>
                </div>
              </div>
              {realHistory.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto">
                  {realHistory.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2.5">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{log.device}</p>
                          <p className="text-[11px] text-muted-foreground">{log.method} • {formatTimeAgo(log.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No login history recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Coming Soon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full border-dashed border-2 border-border">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Security Analytics</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Detailed security insights and trends</p>
              <Badge variant="outline" className="mt-3 text-xs">Coming Soon</Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full border-dashed border-2 border-border">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
              <TrendingUp className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Risk Assessment</p>
              <p className="text-xs text-muted-foreground/60 mt-1">AI-powered risk analysis dashboard</p>
              <Badge variant="outline" className="mt-3 text-xs">Coming Soon</Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
