'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  QrCode,
  Mail,
  Shield,
  BarChart3,
  Monitor,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Lock,
  Fingerprint,
  Radio,
  ScrollText,
  PieChart,
  Building2,
  CheckCircle2,
  XCircle,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { SpotlightHeading } from './SpotlightHeading';
import { DemoModal } from './DemoModal';
import { SectionHeader } from '@/components/ui/section-header';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export function LandingPage() {
  const { setPageView, setIsDemo } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartReal = () => {
    setIsDemo(false);
    setPageView('auth');
  };

  const handleStartDemo = () => {
    setDemoOpen(true);
  };

  // Right column cards for Hero
  const heroCards = [
    { icon: Mail, title: 'Email OTP', desc: 'Secure email links', delay: 0 },
    { icon: KeyRound, title: 'Passkeys', desc: 'Hardware bound', delay: 0.2 },
    { icon: QrCode, title: 'QR Login', desc: 'Cross-device auth', delay: 0.4 },
    { icon: Shield, title: 'Trusted Devices', desc: 'Device fingerprinting', delay: 0.1 },
    { icon: BarChart3, title: 'Security Analytics', desc: 'Real-time insights', delay: 0.5 },
    { icon: Monitor, title: 'Session Management', desc: 'Active sessions', delay: 0.3 },
    { icon: AlertTriangle, title: 'Risk Detection', desc: 'Anomaly scoring', delay: 0.7 },
    { icon: Clock, title: 'Login History', desc: 'Audit trails', delay: 0.6 }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" suppressHydrationWarning>
      
      {/* 1. Sticky Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center ${scrolled ? 'bg-background/80 backdrop-blur-sm border-b border-border' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-xl">AuthX</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Analytics</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={handleStartDemo}>
              Get Demo
            </Button>
            <Button onClick={handleStartReal}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
              Enterprise Security Platform
            </div>
            
            <SpotlightHeading />
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Eliminate passwords. Prevent phishing. Secure every login with hardware-bound passkeys, one-time codes, and cross-device QR verification.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Button size="lg" onClick={handleStartReal}>Get Started</Button>
              <Button size="lg" variant="outline" onClick={handleStartDemo}>Try Demo</Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> FIDO2 Certified</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> E2E Encrypted</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> SOC 2 Ready</div>
            </div>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {heroCards.map((card, idx) => (
              <motion.div
                key={idx}
                className="bg-card border border-border shadow-card rounded-xl p-4 flex flex-col gap-2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: card.delay, ease: 'easeInOut' }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <card.icon className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-sm">{card.title}</h4>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Feature Sections */}
      <section className="py-20 bg-muted/30 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Section A */}
          <div id="features" className="scroll-mt-24">
            <SectionHeader title="Authentication Methods" description="Provide a seamless and secure login experience for all users." align="center" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Mail, title: 'Email OTP', desc: 'Secure and reliable magic links sent directly to user inboxes.' },
                { icon: KeyRound, title: 'Passkey WebAuthn', desc: 'Hardware-backed biometric authentication for maximum security.' },
                { icon: QrCode, title: 'QR Code Login', desc: 'Frictionless cross-device login by scanning a simple code.' }
              ].map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section B */}
          <div id="security" className="scroll-mt-24">
            <SectionHeader title="Security & Protection" description="Advanced threat protection that operates silently in the background." align="center" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
              {[
                { icon: ShieldAlert, title: 'Risk Detection', desc: 'AI-driven anomaly detection blocking suspicious login attempts.' },
                { icon: Lock, title: 'Emergency Lockdown', desc: 'Instantly revoke access across all devices in case of a breach.' },
                { icon: Fingerprint, title: 'Trusted Devices', desc: 'Device fingerprinting ensures access only from recognized endpoints.' }
              ].map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section C */}
          <div id="analytics" className="scroll-mt-24">
            <SectionHeader title="Monitoring & Analytics" description="Gain full visibility into your organization's authentication events." align="center" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Radio, title: 'Session Management', desc: 'View and control active sessions across all platforms.' },
                { icon: ScrollText, title: 'Login History', desc: 'Detailed audit logs of every authentication attempt.' },
                { icon: PieChart, title: 'Security Analytics', desc: 'Comprehensive dashboards for security posture monitoring.' }
              ].map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Authentication Workflow Timeline */}
      <section className="py-24 px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <h3 className="font-heading text-3xl font-bold text-center mb-16">Authentication Workflow</h3>
        <div className="relative border-l-2 border-border ml-4 md:ml-0 md:pl-8 space-y-12">
          {[
            { title: 'User Initiation', desc: 'User enters identifier (email/username).', icon: Fingerprint },
            { title: 'Authentication Selection', desc: 'System prompts for Passkey, Biometrics, or fallback OTP.', icon: ShieldCheck },
            { title: 'Verification', desc: 'Cryptographic challenge is signed by the local device.', icon: Lock },
            { title: 'Session Created', desc: 'Secure, encrypted JWT is issued.', icon: KeyRound },
            { title: 'Dashboard Access', desc: 'User is granted seamless entry to the app.', icon: Monitor },
            { title: 'Continuous Security', desc: 'Risk engine monitors the session in the background.', icon: Radio }
          ].map((step, i) => (
            <div key={i} className="relative pl-8 md:pl-0">
              <div className="absolute left-[-41px] md:left-[-41px] top-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{step.title}</h4>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 'Why AuthX' Section */}
      <section className="py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-16">Why Choose AuthX?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: KeyRound, title: 'Zero Passwords', desc: 'Remove the #1 cause of data breaches by eliminating shared secrets entirely.' },
              { icon: ShieldCheck, title: 'Phishing-Proof', desc: 'Hardware-bound authentication guarantees credentials cannot be stolen.' },
              { icon: Building2, title: 'Enterprise Ready', desc: 'Built for scale with SSO integration, RBAC, and compliance standards out of the box.' }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground max-w-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Statistics Section */}
      <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 99.9, suffix: '%', label: 'Uptime' },
            { value: 200, prefix: '<', suffix: 'ms', label: 'Auth Latency' },
            { value: 0, label: 'Password Breaches' },
            { value: 2, prefix: 'FIDO', label: 'Compliant' } // Fake numbers for demo, 2 for FIDO2
          ].map((stat, i) => (
            <div key={i} className="border border-border rounded-xl p-8 text-center bg-card">
              <div className="text-4xl font-bold text-foreground mb-2 flex justify-center items-baseline gap-1">
                {stat.prefix}
                <AnimatedCounter value={stat.value} />
                {stat.suffix}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comparison Section */}
      <section className="py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">Traditional Auth vs AuthX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h3 className="font-semibold text-xl mb-6 text-center border-b border-border pb-4">Traditional Auth</h3>
              <ul className="space-y-4">
                {[
                  'Password Storage',
                  'Phishing Vulnerable',
                  'Session Hijacking Risk',
                  'Credential Stuffing',
                  'MFA Friction'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-center border-b border-primary/20 pb-4 text-primary">AuthX</h3>
              <ul className="space-y-4 relative z-10">
                {[
                  'No Stored Credentials',
                  'Zero Phishing Surface',
                  'Encrypted Sessions',
                  'Hardware-Bound Keys',
                  'Seamless MFA'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Enterprise Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-16 px-6 lg:px-8 border-t border-zinc-900 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div>
              <h4 className="text-zinc-100 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Home</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Features</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Pricing</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Demo</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Passkeys</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">OTP</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">QR Login</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Risk Engine</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Documentation</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">API Reference</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Changelog</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Status</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">About</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Blog</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Careers</span></li>
                <li><span className="hover:text-zinc-100 cursor-pointer transition-colors">Contact</span></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-800 gap-4">
            <div className="flex items-center gap-2 text-zinc-100">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <span className="font-heading font-bold">AuthX</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} AuthX Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-zinc-100 cursor-pointer"><Github className="w-5 h-5" /></span>
              <span className="hover:text-zinc-100 cursor-pointer"><Twitter className="w-5 h-5" /></span>
              <span className="hover:text-zinc-100 cursor-pointer"><Linkedin className="w-5 h-5" /></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
