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
  Linkedin,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { SpotlightHeading } from './SpotlightHeading';
import { DemoModal } from './DemoModal';
import { SectionHeader } from '@/components/ui/section-header';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useLandingTheme } from '@/hooks/useLandingTheme';

export function LandingPage() {
  const { setPageView, setIsDemo } = useAuth();
  const { themePref, setThemePref, resolvedTheme } = useLandingTheme();
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



  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${resolvedTheme === 'dark' ? 'dark bg-[#0D1110] text-[#D7DDD9]' : 'bg-[#FFF4E1] text-[#1A312C]'}`} suppressHydrationWarning>
      
      {/* 1. Sticky Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center ${scrolled ? 'bg-background/80 dark:bg-[#0D1110]/80 backdrop-blur-sm border-b border-border dark:border-[#31443F]' : 'bg-transparent'}`}>
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
            <button
              onClick={() => {
                if (themePref === 'light') setThemePref('dark');
                else if (themePref === 'dark') setThemePref('system');
                else setThemePref('light');
              }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative group flex items-center justify-center"
              title="Landing Theme: Light / Dark / System"
            >
              {themePref === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
              {themePref === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
              {themePref === 'system' && <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
              <span className="absolute -bottom-8 right-0 w-max bg-black/80 dark:bg-white/90 text-white dark:text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Landing Theme: {themePref.charAt(0).toUpperCase() + themePref.slice(1)}
              </span>
            </button>
            <Button variant="ghost" className="hidden sm:inline-flex dark:text-[#F8FAF8] dark:hover:bg-white/10" onClick={handleStartDemo}>
              Get Demo
            </Button>
            <Button className="dark:bg-[#5FA895] dark:text-white dark:hover:bg-[#4C8B7A]" onClick={handleStartReal}>
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
            
            <SpotlightHeading resolvedTheme={resolvedTheme} />
            
            <p className="text-lg text-muted-foreground dark:text-[#97A39E] mb-8 max-w-xl">
              Eliminate passwords. Prevent phishing. Secure every login with hardware-bound passkeys, one-time codes, and cross-device QR verification.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Button size="lg" className="dark:bg-[#5FA895] dark:text-white dark:hover:bg-[#4C8B7A]" onClick={handleStartReal}>Get Started</Button>
              <Button size="lg" variant="outline" className="dark:border-[#31443F] dark:text-[#F8FAF8] dark:hover:bg-[#1D2724]" onClick={handleStartDemo}>Try Demo</Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground dark:text-[#97A39E]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 dark:text-[#5FA895]" /> FIDO2 Certified</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 dark:text-[#5FA895]" /> E2E Encrypted</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 dark:text-[#5FA895]" /> SOC 2 Ready</div>
            </div>
          </div>
          
          <div className="hidden lg:flex relative w-full h-full min-h-[400px]">
            {[
              { icon: KeyRound, title: 'Passkeys Authentication', subtitle: 'FIDO2 WebAuthn' },
              { icon: Fingerprint, title: 'Biometric Vault Sync', subtitle: 'Touch / Face ID' },
              { icon: QrCode, title: 'Cross-Device QR Verification', subtitle: 'Instant Mobile Scan' },
              { icon: ShieldCheck, title: 'Encrypted Session Security', subtitle: 'Zero Password Storage' }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                className={`bg-card dark:bg-[#1D2724] border border-border dark:border-[#31443F] shadow-elevated rounded-xl p-5 flex items-center gap-4 w-80 absolute z-10 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${
                  idx === 0 ? 'top-2 left-0' : idx === 1 ? 'top-28 right-0' : idx === 2 ? 'top-60 left-4' : 'bottom-2 right-4'
                }`}
                animate={{ y: [0, -12, 0] }}
                whileHover={{ scale: 1.05, y: -6, boxShadow: '0 20px 30px -10px rgba(26, 49, 44, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 4, repeat: Infinity, delay: idx * 0.3, ease: 'easeInOut' }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-[#5FA895] shrink-0 gap-1">
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm leading-tight text-card-foreground dark:text-[#F8FAF8]">{card.title}</h4>
                  <p className="text-xs text-muted-foreground dark:text-[#97A39E] mt-0.5">{card.subtitle}</p>
                </div>
              </motion.div>
            ))}
            {/* Decorative background shadow elements */}
            <div className="absolute top-20 left-20 w-40 h-40 bg-accent/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10" />
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
                <div key={i} className="bg-card dark:bg-[#1D2724] border border-border dark:border-[#31443F] rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-[#5FA895] flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2 dark:text-[#F8FAF8]">{f.title}</h4>
                  <p className="text-sm text-muted-foreground dark:text-[#97A39E]">{f.desc}</p>
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
                <div key={i} className="bg-card dark:bg-[#1D2724] border border-border dark:border-[#31443F] rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-[#5FA895] flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2 dark:text-[#F8FAF8]">{f.title}</h4>
                  <p className="text-sm text-muted-foreground dark:text-[#97A39E]">{f.desc}</p>
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
                <div key={i} className="bg-card dark:bg-[#1D2724] border border-border dark:border-[#31443F] rounded-xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-[#5FA895] flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium mb-2 dark:text-[#F8FAF8]">{f.title}</h4>
                  <p className="text-sm text-muted-foreground dark:text-[#97A39E]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Authentication Workflow Timeline */}
      <section className="py-24 px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <h3 className="font-heading text-3xl font-bold text-center mb-16 dark:text-[#F8FAF8]">Authentication Workflow</h3>
        <div className="relative border-l-2 border-border dark:border-[#31443F] ml-4 md:ml-0 md:pl-8 space-y-12">
          {[
            { title: 'User Initiation', desc: 'User enters identifier (email/username).', icon: Fingerprint },
            { title: 'Authentication Selection', desc: 'System prompts for Passkey, Biometrics, or fallback OTP.', icon: ShieldCheck },
            { title: 'Verification', desc: 'Cryptographic challenge is signed by the local device.', icon: Lock },
            { title: 'Session Created', desc: 'Secure, encrypted JWT is issued.', icon: KeyRound },
            { title: 'Dashboard Access', desc: 'User is granted seamless entry to the app.', icon: Monitor },
            { title: 'Continuous Security', desc: 'Risk engine monitors the session in the background.', icon: Radio }
          ].map((step, i) => (
            <div key={i} className="relative pl-8 md:pl-0">
              <div className="absolute left-[-41px] md:left-[-41px] top-1 w-6 h-6 rounded-full bg-background dark:bg-[#0D1110] border-2 border-primary dark:border-[#5FA895] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary dark:bg-[#5FA895]" />
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-muted dark:bg-[#1D2724] flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-foreground dark:text-[#5FA895]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg dark:text-[#F8FAF8]">{step.title}</h4>
                  <p className="text-muted-foreground dark:text-[#97A39E]">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 'Why AuthX' Section */}
      <section className="py-24 px-6 lg:px-8 bg-muted/30 dark:bg-black/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-16 dark:text-[#F8FAF8]">Why Choose AuthX?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: KeyRound, title: 'Zero Passwords', desc: 'Remove the #1 cause of data breaches by eliminating shared secrets entirely.' },
              { icon: ShieldCheck, title: 'Phishing-Proof', desc: 'Hardware-bound authentication guarantees credentials cannot be stolen.' },
              { icon: Building2, title: 'Enterprise Ready', desc: 'Built for scale with SSO integration, RBAC, and compliance standards out of the box.' }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-[#5FA895] mb-6">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl mb-3 dark:text-[#F8FAF8]">{f.title}</h3>
                <p className="text-muted-foreground dark:text-[#97A39E] max-w-sm">{f.desc}</p>
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
            <div key={i} className="border border-border dark:border-[#31443F] rounded-xl p-8 text-center bg-card dark:bg-[#1D2724]">
              <div className="text-4xl font-bold text-foreground dark:text-[#F8FAF8] mb-2 flex justify-center items-baseline gap-1">
                {stat.prefix}
                <AnimatedCounter value={stat.value} />
                {stat.suffix}
              </div>
              <p className="text-sm text-muted-foreground dark:text-[#97A39E]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comparison Section */}
      <section className="py-24 px-6 lg:px-8 bg-muted/30 dark:bg-black/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 dark:text-[#F8FAF8]">Traditional Auth vs AuthX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card dark:bg-[#1D2724] border border-border dark:border-[#31443F] rounded-xl p-8 shadow-sm">
              <h3 className="font-semibold text-xl mb-6 text-center border-b border-border dark:border-[#31443F] pb-4 dark:text-[#F8FAF8]">Traditional Auth</h3>
              <ul className="space-y-4">
                {[
                  'Password Storage',
                  'Phishing Vulnerable',
                  'Session Hijacking Risk',
                  'Credential Stuffing',
                  'MFA Friction'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground dark:text-[#97A39E]">
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-primary/5 dark:bg-[#5FA895]/10 border border-primary/20 dark:border-[#5FA895]/30 rounded-xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-primary dark:text-[#5FA895]" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-center border-b border-primary/20 dark:border-[#5FA895]/30 pb-4 text-primary dark:text-[#5FA895]">AuthX</h3>
              <ul className="space-y-4 relative z-10">
                {[
                  'No Stored Credentials',
                  'Zero Phishing Surface',
                  'Encrypted Sessions',
                  'Hardware-Bound Keys',
                  'Seamless MFA'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground dark:text-[#F8FAF8] font-medium">
                    <CheckCircle2 className="w-5 h-5 text-success dark:text-[#5FA895] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Enterprise Footer */}
      <footer className="bg-[#1A312C] dark:bg-[#08110F] text-[#89D7B7]/70 py-16 px-6 lg:px-8 border-t border-[#428475]/30 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div>
              <h4 className="text-[#FFF4E1] font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Home</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Features</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Pricing</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Demo</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFF4E1] font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Passkeys</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">OTP</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">QR Login</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Risk Engine</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFF4E1] font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Documentation</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">API Reference</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Changelog</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Status</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFF4E1] font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">About</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Blog</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Careers</span></li>
                <li><span className="hover:text-[#FFF4E1] cursor-pointer transition-colors">Contact</span></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#428475]/30 gap-4">
            <div className="flex items-center gap-2 text-[#FFF4E1]">
              <ShieldCheck className="w-5 h-5 text-[#89D7B7]" />
              <span className="font-heading font-bold">AuthX</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} AuthX Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#FFF4E1] cursor-pointer"><Github className="w-5 h-5" /></span>
              <span className="hover:text-[#FFF4E1] cursor-pointer"><Twitter className="w-5 h-5" /></span>
              <span className="hover:text-[#FFF4E1] cursor-pointer"><Linkedin className="w-5 h-5" /></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} resolvedTheme={resolvedTheme} />
    </div>
  );
}
