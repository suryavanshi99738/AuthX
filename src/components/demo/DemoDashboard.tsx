'use client';

/**
 * DemoDashboard — Completely isolated Demo dashboard UI.
 *
 * ISOLATION GUARANTEE:
 *  - Zero calls to /api/auth/* or /api/demo/dashboard
 *  - All data is static mock data defined in this file
 *  - Demo actions show inline "not available in Demo Mode" messages
 *  - No real sessions revoked, no real devices modified, no real DB writes
 *  - Exit Demo calls cleanupDemo() which clears localStorage state only (no DB call on failure)
 *
 * Shows all major AuthX features as a visual showcase:
 *  - Home / Security overview
 *  - Security Analytics (chart simulation)
 *  - Session Management
 *  - Trusted Devices
 *  - Login History
 *  - Risk Center
 *  - Emergency Lockdown
 *  - Security Policies
 *  - Recovery Kit
 */

import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  Smartphone,
  QrCode,
  Clock,
  Lock,
  Settings,
  LogOut,
  PanelLeft,
  BarChart3,
  Laptop,
  Wifi,
  Globe,
  AlertCircle,
  CheckCircle2,
  Info,
  Activity,
  TrendingUp,
  AlertTriangle,
  User,
  Moon,
  Sun,
  Monitor,
  Flame,
  Radio,
  RefreshCw,
  Eye,
  XCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardTheme } from '@/hooks/useDashboardTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

/* ── Static mock data (presentation only, never from DB) ── */

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@authx.dev',
  joinedDate: 'Aug 2026',
  plan: 'Demo Preview',
};

const MOCK_SESSIONS = [
  { id: 's1', device: 'MacBook Pro 14"', os: 'macOS 14.5', browser: 'Chrome 127', ip: '10.17.87.***', location: 'Pune, MH, India', method: 'Email OTP', status: 'active', isCurrent: true, time: 'Active now', trusted: true },
  { id: 's2', device: 'iPhone 15 Pro', os: 'iOS 17.5', browser: 'Safari 17', ip: '10.17.87.***', location: 'Pune, MH, India', method: 'Passkey', status: 'idle', isCurrent: false, time: '2 hours ago', trusted: true },
  { id: 's3', device: 'Windows 11 PC', os: 'Windows 11', browser: 'Firefox 128', ip: '203.111.45.***', location: 'Mumbai, MH, India', method: 'Email OTP', status: 'idle', isCurrent: false, time: '1 day ago', trusted: false },
];

const MOCK_DEVICES = [
  { id: 'd1', name: 'MacBook Pro 14"', type: 'Laptop', browser: 'Chrome 127', os: 'macOS', lastActive: 'Active now', trusted: true, passkey: true },
  { id: 'd2', name: 'iPhone 15 Pro', type: 'Mobile', browser: 'Safari 17', os: 'iOS', lastActive: '2 hours ago', trusted: true, passkey: true },
  { id: 'd3', name: 'iPad Air', type: 'Tablet', browser: 'Safari 17', os: 'iPadOS', lastActive: '3 days ago', trusted: false, passkey: false },
];

const MOCK_HISTORY = [
  { id: 'h1', method: 'Email OTP', device: 'MacBook Pro', browser: 'Chrome', status: 'success', risk: 'Low', ip: '10.17.87.***', location: 'Pune, India', time: 'Today 14:32' },
  { id: 'h2', method: 'Passkey', device: 'iPhone 15 Pro', browser: 'Safari', status: 'success', risk: 'Low', ip: '10.17.87.***', location: 'Pune, India', time: 'Today 09:15' },
  { id: 'h3', method: 'Email OTP', device: 'Windows PC', browser: 'Firefox', status: 'success', risk: 'Medium', ip: '203.111.45.***', location: 'Mumbai, India', time: 'Yesterday 20:44' },
  { id: 'h4', method: 'Email OTP', device: 'Unknown Device', browser: 'Chrome', status: 'failed', risk: 'High', ip: '185.234.xxx.***', location: 'Unknown', time: '2 days ago 03:12' },
  { id: 'h5', method: 'Authenticator', device: 'MacBook Pro', browser: 'Chrome', status: 'success', risk: 'Low', ip: '10.17.87.***', location: 'Pune, India', time: '3 days ago 11:05' },
  { id: 'h6', method: 'QR Login', device: 'iPhone 15 Pro', browser: 'Safari', status: 'success', risk: 'Low', ip: '10.17.87.***', location: 'Pune, India', time: '4 days ago 18:22' },
];

const DEMO_RISK = {
  score: 72,
  level: 'Medium',
  reasons: ['Login from a new location', 'Session active for >8 hours', 'Unrecognized device attempt blocked'],
  trend: '-8 from last week',
};

const MOCK_ANALYTICS = {
  totalLogins: 47,
  successRate: '94.7%',
  failedAttempts: 3,
  activeSessions: 3,
  methodBreakdown: [
    { method: 'Email OTP', count: 24, pct: 51 },
    { method: 'Passkey', count: 14, pct: 30 },
    { method: 'Authenticator', count: 6, pct: 13 },
    { method: 'QR Login', count: 3, pct: 6 },
  ],
};

/* ── Sidebar nav ── */
const SECTIONS = [
  { id: 'home', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Radio className="w-4 h-4" /> },
  { id: 'devices', label: 'Trusted Devices', icon: <Laptop className="w-4 h-4" /> },
  { id: 'history', label: 'Login History', icon: <Clock className="w-4 h-4" /> },
  { id: 'risk', label: 'Risk Center', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'lockdown', label: 'Emergency Lockdown', icon: <Lock className="w-4 h-4" /> },
  { id: 'recovery', label: 'Recovery Kit', icon: <KeyRound className="w-4 h-4" /> },
  { id: 'settings', label: 'Security Policies', icon: <Settings className="w-4 h-4" /> },
];

/* ── Demo-only notice callout ── */
function DemoNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
    </div>
  );
}

/* ── Action blocked notice (inline, replaces action result) ── */
function ActionBlocked({ feature }: { feature: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-start gap-2.5 mt-2">
        <Info className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{feature}</strong> is available in the full AuthX environment.
          In Demo Mode, all security actions are read-only — no real changes are made.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-foreground font-heading">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/* ── Section Renderers ── */

function HomeSection({ onAction }: { onAction: (s: string) => void }) {
  const [blockedAction, setBlockedAction] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <DemoNotice message="You're exploring AuthX Demo Mode. This dashboard is a visual preview of the security features available in the full AuthX system. No real account, session, or security action is being modified." />

      {/* Security Score */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold text-foreground">Security Score</h3>
          <Badge className="bg-warning/10 text-warning border-warning/20">Medium Risk</Badge>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-5xl font-bold text-foreground font-heading">{DEMO_RISK.score}</p>
            <p className="text-xs text-muted-foreground">/100 · {DEMO_RISK.trend}</p>
          </div>
          <div className="flex-1">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-warning to-warning/60 rounded-full" style={{ width: `${DEMO_RISK.score}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Low</span><span>High</span>
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5">
          {DEMO_RISK.reasons.map((r) => (
            <li key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-warning shrink-0" />{r}
            </li>
          ))}
        </ul>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Logins" value={MOCK_ANALYTICS.totalLogins} icon={<Activity className="w-4 h-4 text-primary" />} color="bg-primary/10" />
        <StatCard label="Success Rate" value={MOCK_ANALYTICS.successRate} icon={<TrendingUp className="w-4 h-4 text-success" />} color="bg-success/10" />
        <StatCard label="Active Sessions" value={MOCK_ANALYTICS.activeSessions} icon={<Wifi className="w-4 h-4 text-warning" />} color="bg-warning/10" />
        <StatCard label="Failed Attempts" value={MOCK_ANALYTICS.failedAttempts} icon={<AlertCircle className="w-4 h-4 text-danger" />} color="bg-danger/10" />
      </div>

      {/* Recent logins */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Recent Logins</h3>
        <div className="space-y-2">
          {MOCK_HISTORY.slice(0, 3).map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.status === 'success' ? 'bg-success/10' : 'bg-danger/10'}`}>
                {h.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{h.method} · {h.device}</p>
                <p className="text-[11px] text-muted-foreground">{h.location} · {h.time}</p>
              </div>
              <Badge className={`text-[9px] shrink-0 ${h.risk === 'Low' ? 'bg-success/10 text-success border-success/20' : h.risk === 'Medium' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>{h.risk}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Auth methods configured */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Authentication Methods</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Email OTP', icon: <Mail className="w-4 h-4 text-success" />, enabled: true },
            { label: 'Passkey', icon: <KeyRound className="w-4 h-4 text-success" />, enabled: true },
            { label: 'Authenticator', icon: <Smartphone className="w-4 h-4 text-warning" />, enabled: false },
            { label: 'QR Login', icon: <QrCode className="w-4 h-4 text-success" />, enabled: true },
          ].map(({ label, icon, enabled }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card">
              {icon}
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className={`text-[10px] ${enabled ? 'text-success' : 'text-warning'}`}>{enabled ? 'Enabled' : 'Setup pending'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs rounded-xl h-8" onClick={() => setBlockedAction('Revoke all sessions')}>
            <RefreshCw className="w-3 h-3 mr-1.5" />Revoke All Sessions
          </Button>
          <Button size="sm" variant="outline" className="text-xs rounded-xl h-8" onClick={() => setBlockedAction('Trust current device')}>
            <ShieldCheck className="w-3 h-3 mr-1.5" />Trust Current Device
          </Button>
        </div>
        <AnimatePresence>
          {blockedAction && <ActionBlocked key={blockedAction} feature={blockedAction} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <DemoNotice message="Security Analytics shows a visual preview of how AuthX tracks authentication patterns, method distribution, and risk trends. All data shown here is simulated for demonstration purposes." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Logins" value={MOCK_ANALYTICS.totalLogins} icon={<Activity className="w-4 h-4 text-primary" />} color="bg-primary/10" />
        <StatCard label="Success Rate" value={MOCK_ANALYTICS.successRate} icon={<TrendingUp className="w-4 h-4 text-success" />} color="bg-success/10" />
        <StatCard label="Failed Attempts" value={MOCK_ANALYTICS.failedAttempts} icon={<AlertCircle className="w-4 h-4 text-danger" />} color="bg-danger/10" />
        <StatCard label="Active Sessions" value={MOCK_ANALYTICS.activeSessions} icon={<Wifi className="w-4 h-4 text-warning" />} color="bg-warning/10" />
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Authentication Method Distribution</h3>
        <div className="space-y-3.5">
          {MOCK_ANALYTICS.methodBreakdown.map(({ method, count, pct }) => (
            <div key={method} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{method}</span>
                <span className="text-muted-foreground">{count} logins ({pct}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Risk Distribution (Last 30 Days)</h3>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Low Risk', count: 41, color: 'text-success', bg: 'bg-success/10' }, { label: 'Medium Risk', count: 5, color: 'text-warning', bg: 'bg-warning/10' }, { label: 'High Risk', count: 1, color: 'text-danger', bg: 'bg-danger/10' }].map(({ label, count, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold font-heading ${color}`}>{count}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionsSection() {
  const [blockedSession, setBlockedSession] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <DemoNotice message="Session Management shows all active and past sessions across your devices. In the full AuthX environment, you can revoke individual sessions or all other sessions instantly. No real sessions are modified here." />

      <div className="space-y-3">
        {MOCK_SESSIONS.map((s) => (
          <div key={s.id} className="p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.isCurrent ? 'bg-success/10' : 'bg-muted/40'}`}>
                  <Laptop className={`w-4 h-4 ${s.isCurrent ? 'text-success' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{s.device}</p>
                    {s.isCurrent && <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Current</Badge>}
                    {s.trusted && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Trusted</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.os} · {s.browser}</p>
                  <p className="text-[11px] text-muted-foreground">{s.location} · {s.ip} · {s.time}</p>
                </div>
              </div>
              {!s.isCurrent && (
                <Button size="sm" variant="ghost" className="text-xs text-danger hover:text-danger hover:bg-danger/5 rounded-xl h-8 shrink-0" onClick={() => setBlockedSession(s.id)}>
                  Revoke
                </Button>
              )}
            </div>
            <AnimatePresence>
              {blockedSession === s.id && <ActionBlocked feature="Session revocation" />}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevicesSection() {
  const [blockedDevice, setBlockedDevice] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <DemoNotice message="Trusted Devices shows all devices associated with your AuthX account. In the full environment, you can trust or remove individual devices. No changes are made here." />

      <div className="space-y-3">
        {MOCK_DEVICES.map((d) => (
          <div key={d.id} className="p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                  <Laptop className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    {d.trusted && <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Trusted</Badge>}
                    {d.passkey && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Passkey</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{d.type} · {d.os} · {d.browser}</p>
                  <p className="text-[11px] text-muted-foreground">Last active: {d.lastActive}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-danger hover:text-danger hover:bg-danger/5 rounded-xl h-8 shrink-0" onClick={() => setBlockedDevice(d.id)}>
                Remove
              </Button>
            </div>
            <AnimatePresence>
              {blockedDevice === d.id && <ActionBlocked feature="Device removal" />}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorySection() {
  return (
    <div className="space-y-6">
      <DemoNotice message="Login History shows a complete audit trail of all authentication events. This is a preview with simulated demo data." />

      <div className="space-y-2">
        {MOCK_HISTORY.map((h) => (
          <div key={h.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${h.status === 'success' ? 'bg-success/10' : 'bg-danger/10'}`}>
              {h.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{h.method} via {h.browser}</p>
              <p className="text-[11px] text-muted-foreground">{h.device} · {h.location} · {h.ip}</p>
              <p className="text-[11px] text-muted-foreground">{h.time}</p>
            </div>
            <Badge className={`text-[9px] shrink-0 ${h.risk === 'Low' ? 'bg-success/10 text-success border-success/20' : h.risk === 'Medium' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'}`}>{h.risk}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskSection() {
  return (
    <div className="space-y-6">
      <DemoNotice message="The Risk Center continuously analyses authentication patterns, device fingerprints, geolocation anomalies, and session behaviors to compute a real-time security risk score. This is a demo preview — no real analysis is performed." />

      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold text-foreground">Current Risk Score</h3>
          <Badge className="bg-warning/10 text-warning border-warning/20">Medium</Badge>
        </div>
        <div className="text-center py-4">
          <p className="text-6xl font-bold font-heading text-foreground">{DEMO_RISK.score}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 100 · {DEMO_RISK.trend}</p>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mt-2 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${DEMO_RISK.score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-warning to-warning/60 rounded-full"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Risk Factors</h3>
        <div className="space-y-3">
          {DEMO_RISK.reasons.map((r) => (
            <div key={r} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/15">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LockdownSection() {
  const [blockedAction, setBlockedAction] = useState(false);
  return (
    <div className="space-y-6">
      <DemoNotice message="Emergency Lockdown instantly revokes all active sessions on your account except your current one. In the full AuthX environment, this requires step-up authentication (TOTP, Passkey, or Recovery Code) before execution. No real action is performed here." />

      <div className="p-5 rounded-2xl border border-danger/30 bg-danger/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">Emergency Lockdown</h3>
            <p className="text-xs text-muted-foreground">Terminate all other active sessions instantly</p>
          </div>
        </div>

        <ul className="space-y-1.5 mb-4 pl-1">
          {['Revokes all sessions except current', 'Requires step-up identity verification', 'Logged to security history', 'Security alert email sent'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-danger/60 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          className="w-full border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50 rounded-xl h-10 text-sm font-semibold"
          onClick={() => setBlockedAction(true)}
        >
          <Lock className="w-4 h-4 mr-2" />
          Activate Emergency Lockdown
        </Button>

        <AnimatePresence>
          {blockedAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden mt-3"
            >
              <div className="p-3.5 rounded-xl bg-card border border-border flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Emergency Lockdown</strong> is available in the full AuthX environment. It requires step-up verification (Authenticator App, Passkey, or Recovery Code) before execution. Demo Mode does not modify any real sessions.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Other Lockdown Actions</h3>
        <div className="space-y-2.5">
          {['Disable QR Login temporarily', 'Force Email OTP only', 'Disable Passkey authentication'].map((action) => (
            <div key={action} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <p className="text-xs font-medium text-foreground">{action}</p>
              <Badge className="bg-muted/40 text-muted-foreground border-0 text-[9px]">Demo Only</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecoverySection() {
  const [blockedAction, setBlockedAction] = useState(false);
  return (
    <div className="space-y-6">
      <DemoNotice message="The Recovery Kit generates 12 cryptographically secure, single-use backup codes that can be used to regain account access if you lose your primary authentication methods. No real codes are generated here." />

      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Recovery Kit Status</h3>
            <p className="text-xs text-muted-foreground">Backup access codes</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {['8F4K-92LM', 'X7QP-31ZA', 'P2MK-71QR', 'T8WN-45BC', 'H3JL-66MN', 'R9KD-28XY'].map((code) => (
            <div key={code} className="p-2 rounded-lg bg-muted/40 border border-border text-center">
              <p className="font-mono text-xs text-muted-foreground line-through select-none">{code}</p>
            </div>
          ))}
          {['N5QS-83PL', 'V1MT-47ZW', 'F6BH-92KT', 'L4GR-18NJ', 'U7XC-59MP', 'W2YD-34FK'].map((code) => (
            <div key={code} className="p-2 rounded-lg bg-muted/40 border border-border text-center">
              <p className="font-mono text-xs text-muted-foreground select-none blur-[3px]">{code}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mb-4">Demo preview: 6 of 12 codes shown (blurred for security illustration)</p>

        <Button variant="outline" className="w-full rounded-xl h-9 text-xs" onClick={() => setBlockedAction(true)}>
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Regenerate Recovery Kit
        </Button>
        <AnimatePresence>
          {blockedAction && <ActionBlocked feature="Recovery Kit regeneration" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <DemoNotice message="Security Policies let you configure authentication requirements, session timeouts, trusted device limits, and notification preferences. All settings shown here are read-only in Demo Mode." />

      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground">Authentication Settings</h3>
        {[
          { label: 'Require OTP for all logins', value: 'Off', note: 'Passkeys can skip OTP when configured' },
          { label: 'Device Limit', value: '5 devices', note: 'Max trusted devices per account' },
          { label: 'Session Timeout', value: '24 hours', note: 'Inactive sessions expire after this period' },
          { label: 'QR Code Expiry', value: '60 seconds', note: 'QR codes expire for security' },
        ].map(({ label, value, note }) => (
          <div key={label} className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{note}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{value}</span>
              <Badge className="bg-muted/40 text-muted-foreground border-0 text-[9px]">Demo</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground">Notification Settings</h3>
        {[
          { label: 'New Login Alerts', enabled: true },
          { label: 'New Device Alerts', enabled: true },
          { label: 'Suspicious Activity Alerts', enabled: true },
        ].map(({ label, enabled }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-4.5 rounded-full ${enabled ? 'bg-success/30' : 'bg-muted'} relative`}>
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full ${enabled ? 'bg-success right-0.5' : 'bg-muted-foreground left-0.5'} transition-all`} />
              </div>
              <Badge className="bg-muted/40 text-muted-foreground border-0 text-[9px]">Demo</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main DemoDashboard ── */
export function DemoDashboard() {
  const { user, cleanupDemo } = useAuth();
  const { themePref, setThemePref, resolvedTheme } = useDashboardTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const displayEmail = user?.email || DEMO_USER.email;

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case 'home': return <HomeSection onAction={() => {}} />;
      case 'analytics': return <AnalyticsSection />;
      case 'sessions': return <SessionsSection />;
      case 'devices': return <DevicesSection />;
      case 'history': return <HistorySection />;
      case 'risk': return <RiskSection />;
      case 'lockdown': return <LockdownSection />;
      case 'recovery': return <RecoverySection />;
      case 'settings': return <SettingsSection />;
      default: return <HomeSection onAction={() => {}} />;
    }
  }, [activeSection]);

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${resolvedTheme === 'dark' ? 'dark bg-[#0D1110] text-[#D7DDD9]' : 'bg-[#FFF4E1] text-[#1A312C]'}`}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${resolvedTheme === 'dark' ? 'bg-[#08110F] border-[#1D2724]' : 'bg-[#1A312C]'} border-r`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" />
            <span className="font-heading text-lg font-bold text-white">AuthX</span>
            <StatusBadge variant="warning">Demo</StatusBadge>
          </div>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setMobileSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeSection === s.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <span className={activeSection === s.id ? 'text-[#89D7B7]' : ''}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white/70" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{DEMO_USER.name}</p>
              <p className="text-[10px] text-white/50 truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={() => cleanupDemo()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit Demo
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-5 border-b transition-colors ${resolvedTheme === 'dark' ? 'bg-[#0D1110] border-[#1D2724]' : 'bg-[#FFF4E1] border-[#E5D7C3]'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted/60 text-muted-foreground border border-border/50"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              <span className="text-primary">{currentSection?.icon}</span>
              <span>{currentSection?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <StatusBadge variant="warning">Demo Mode</StatusBadge>

            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium">
              <Mail className="w-3 h-3 text-primary" />
              <span className="max-w-[140px] truncate">{displayEmail}</span>
            </div>

            <button
              onClick={() => cleanupDemo()}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 rounded-xl px-3 py-1.5 transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Demo</span>
            </button>

            {/* Theme toggle */}
            <div className="hidden sm:flex items-center gap-0.5 bg-muted/50 p-1 rounded-full border border-border">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button key={t} onClick={() => setThemePref(t)} className={`p-1.5 rounded-full transition-colors ${themePref === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t === 'light' ? <Sun className="w-3 h-3" /> : t === 'dark' ? <Moon className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Demo banner */}
        <div className={`px-4 py-2 flex items-center justify-center gap-2 border-b ${resolvedTheme === 'dark' ? 'bg-[#0E1C18] border-[#1D2724]' : 'bg-[#F4E7D3] border-[#E5D7C3]'}`}>
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            Demo Mode — Visual showcase only. No real data. All actions are simulated.
          </span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              {/* Section heading */}
              <div className="mb-5">
                <h1 className="font-heading text-xl font-bold text-foreground">{currentSection?.label}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Demo preview · Read-only</p>
              </div>

              {sectionContent}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
