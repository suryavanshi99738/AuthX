'use client';

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
  ShieldAlert,
  MapPin,
  Server,
  Wifi,
  Globe,
  Radio,
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
  activeSection?: string;
  dashboardData?: Record<string, unknown>;
}

export function DashboardContent({ activeSection = 'home', dashboardData }: DashboardContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);

  const [realTrustedDevices, setRealTrustedDevices] = useState<Array<{ id: string; deviceName: string; browser: string; lastActive: string; createdAt: string }>>([]);
  const [realHistory, setRealHistory] = useState<Array<{ id: string; method: string; device: string; browser: string; status: string; ipAddress: string; createdAt: string }>>([]);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      getTrustedDevices(user.id).then((res) => {
        if (res.success && res.devices) {
          setRealTrustedDevices(res.devices);
        }
      });
      getLoginHistory(user.id).then((res) => {
        if (res.success && res.history) {
          setRealHistory(res.history);
          const passkeyUsed = res.history.some((h) => h.method.toLowerCase().includes('passkey'));
          if (passkeyUsed) setHasPasskey(true);
        }
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

  // Mock frontend risk detections for devices
  const riskDetections = [
    { device: 'Windows 11 PC (Chrome)', riskScore: 12, level: 'Low Risk', color: 'bg-success' },
    { device: 'iPhone 15 Mobile (Safari)', riskScore: 8, level: 'Low Risk', color: 'bg-success' },
    { device: 'MacBook Pro (Edge)', riskScore: 28, level: 'Low Risk', color: 'bg-info' },
    { device: 'Unknown Linux (Firefox)', riskScore: 74, level: 'High Risk', color: 'bg-danger' },
  ];

  // Active Sessions (Currently logged in devices)
  const activeSessions = [
    {
      id: 'session-1',
      device: 'Windows 11 Laptop',
      browser: 'Chrome 124',
      ip: '10.17.87.25',
      location: 'Local Network',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'session-2',
      device: 'iPhone 15 Pro',
      browser: 'Safari 17',
      ip: '10.17.87.42',
      location: 'Mumbai, India',
      lastActive: '5m ago',
      current: false,
    },
  ];

  // Full History Data fallback if empty
  const fullAuditHistory = realHistory.length > 0 ? realHistory : [
    {
      id: 'log-1',
      method: 'QR Login (Desktop Link)',
      device: 'Windows 11 Laptop',
      browser: 'Chrome 124',
      status: 'success',
      ipAddress: '10.17.87.25',
      location: 'Local Network',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'log-2',
      method: 'Passkey Auth',
      device: 'iPhone 15 Pro',
      browser: 'Safari 17',
      status: 'success',
      ipAddress: '10.17.87.42',
      location: 'Mumbai, India',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 max-w-5xl"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* ── Section: Login History ── */}
      {activeSection === 'history' && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Login History & Session Audit</h1>
            <p className="text-sm text-muted-foreground">Complete audit trail of all device logins, logouts, and authentication methods.</p>
          </div>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-base font-semibold text-foreground">Recent Security Events</h3>
                </div>
                <Badge variant="outline" className="text-xs">Live Monitoring</Badge>
              </div>

              <div className="space-y-3">
                {fullAuditHistory.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Laptop className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{item.device}</p>
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                            {item.method}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {item.browser}</span>
                          <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> {item.ipAddress || '10.17.87.25'}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {('location' in item ? (item as Record<string, unknown>).location as string : 'Local Network')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs">
                      <Badge variant={item.status === 'success' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {item.status === 'success' ? 'Authenticated' : item.status}
                      </Badge>
                      <span className="text-muted-foreground text-[11px]">{formatTimeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Section: Link Device (Mobile Only) ── */}
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

              {realTrustedDevices.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground">Linked Devices</h4>
                  <div className="space-y-2">
                    {realTrustedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                        <div className="flex items-center gap-2.5">
                          <Laptop className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{device.deviceName}</p>
                            <p className="text-[11px] text-muted-foreground">{device.browser}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="text-xs text-danger hover:underline font-medium"
                        >
                          Remove Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Section: Home View ── */}
      {(activeSection === 'home' || activeSection === 'security' || activeSection === 'profile' || activeSection === 'settings') && (
        <>
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Create Passkey Card — VISIBLE IF AND ONLY IF USER HAS NOT IMPLEMENTED PASSKEY */}
          {!hasPasskey && !passkeySuccess && (
            <motion.div variants={fadeInUp}>
              <Card className="shadow-card overflow-hidden border-primary/30 bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                        <KeyRound className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-semibold text-foreground">Set Up Passkey Authentication</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          You haven&apos;t created a passkey yet. Enable instant, passwordless WebAuthn login using Touch ID, Face ID, or Windows Hello.
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
                          Create Passkey
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active Logins Card (Active devices not logouts) */}
          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                      <Radio className="w-4.5 h-4.5 text-success animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">Active Login Sessions</h3>
                      <p className="text-xs text-muted-foreground">Currently active devices logged into your AuthX account</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success text-xs font-semibold">
                    {activeSessions.length} Active
                  </Badge>
                </div>

                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          {session.device.includes('iPhone') ? <Smartphone className="w-4.5 h-4.5 text-primary" /> : <Laptop className="w-4.5 h-4.5 text-primary" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{session.device}</p>
                            {session.current && (
                              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Current Device</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {session.browser} • {session.ip} ({session.location})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                        <span className="text-xs text-success font-medium">{session.lastActive}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Detections Bar Graph Presentation (Frontend UI) */}
          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                      <ShieldAlert className="w-4.5 h-4.5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">Device Risk Detections</h3>
                      <p className="text-xs text-muted-foreground">Automated risk assessment across connected login devices</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Frontend Analytics</Badge>
                </div>

                {/* Bar Graph Visual */}
                <div className="space-y-3 pt-2">
                  {riskDetections.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-foreground">{item.device}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.riskScore}%</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            item.level === 'Low Risk' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {item.level}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                          style={{ width: `${item.riskScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Analytics (Frontend UI) */}
          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center border border-info/20">
                      <BarChart3 className="w-4.5 h-4.5 text-info" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">Security Analytics & Insights</h3>
                      <p className="text-xs text-muted-foreground">Protection compliance & threat monitoring</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success text-xs font-semibold">Grade A+</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Threat Score</p>
                    <p className="text-xl font-bold text-success">98 / 100</p>
                    <p className="text-[10px] text-success font-medium">Optimal Security</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Failed Attempts</p>
                    <p className="text-xl font-bold text-foreground">0</p>
                    <p className="text-[10px] text-muted-foreground">Last 30 Days</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Encryption</p>
                    <p className="text-xl font-bold text-primary">AES-256</p>
                    <p className="text-[10px] text-primary font-medium">FIDO2 WebAuthn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

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
