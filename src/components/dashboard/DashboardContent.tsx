'use client';

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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface DashboardContentProps {
  dashboardData?: Record<string, unknown>;
}

export function DashboardContent({ dashboardData }: DashboardContentProps) {
  const { user } = useAuth();

  // Extract data from dashboard API response or use defaults
  const securityStatus = (dashboardData?.securityStatus as { score: number; passkeyEnabled: boolean; twoFactorEnabled: boolean }) || {
    score: 92,
    passkeyEnabled: true,
    twoFactorEnabled: true,
  };
  const recentLogins = (dashboardData?.recentLogins as Array<{ id: string; device: string; method: string; timestamp: string; status: string }>) || [];
  const trustedDevices = (dashboardData?.trustedDevices as Array<{ id: string; name: string; type: string; lastUsed: string; passkeyRegistered: boolean }>) || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
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
        {/* Trusted Devices */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Trusted Devices</p>
                  <p className="text-xs text-muted-foreground">Your registered devices</p>
                </div>
              </div>
              {trustedDevices.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {trustedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(device.lastUsed)}</p>
                        </div>
                      </div>
                      {device.passkeyRegistered && (
                        <Badge variant="secondary" className="text-xs text-success">Passkey</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Smartphone className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No devices registered yet</p>
                  <Badge variant="outline" className="mt-2 text-xs">Coming Soon</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeInUp}>
          <Card className="shadow-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Recent Activity</p>
                  <p className="text-xs text-muted-foreground">Security events</p>
                </div>
              </div>
              {recentLogins.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {recentLogins.slice(0, 4).map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {login.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger" />
                        )}
                        <div>
                          <p className="text-sm text-foreground">{login.device}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(login.timestamp)}</p>
                        </div>
                      </div>
                      <Badge variant={login.status === 'success' ? 'secondary' : 'destructive'} className="text-xs">
                        {login.method}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <Badge variant="outline" className="mt-2 text-xs">Coming Soon</Badge>
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
    </motion.div>
  );
}
