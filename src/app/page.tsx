'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Fingerprint,
  QrCode,
  Mail,
  Smartphone,
  ScanFace,
  ArrowRight,
  Lock,
  CheckCircle2,
  X,
  Play,
  Eye,
  Sparkles,
  User,
  Phone,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

/* ── Types ── */
type PageView = 'landing' | 'auth';
type AuthTab = 'login' | 'signup';

/* ── Animation Variants ── */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

/* ── Auth Method Icons (for login form) ── */
const AUTH_ICONS = [
  { id: 'passkey', icon: KeyRound, label: 'Passkey', color: 'text-primary' },
  { id: 'biometric', icon: Fingerprint, label: 'Biometric', color: 'text-success' },
  { id: 'qr', icon: QrCode, label: 'QR Code', color: 'text-info' },
  { id: 'otp', icon: Mail, label: 'OTP', color: 'text-warning' },
];

const SECURITY_FEATURES = [
  { icon: Lock, label: 'Zero Passwords', desc: 'No passwords means no phishing, no brute-force, no credential leaks.' },
  { icon: Shield, label: 'Bank-Grade Security', desc: 'FIDO2-compliant, end-to-end encrypted, and regulatory-ready.' },
  { icon: CheckCircle2, label: 'Phishing Proof', desc: 'Passkeys and biometrics can\'t be stolen or reused on fake sites.' },
];

const SIGNUP_BENEFITS = [
  { icon: Shield, label: 'Passwordless authentication', desc: 'No passwords to remember, lose, or steal.' },
  { icon: Smartphone, label: 'Secure device recognition', desc: 'Your trusted devices are your key.' },
  { icon: Eye, label: 'Privacy focused', desc: 'Your biometric data never leaves your device.' },
];

/* ── Interactive 3D Shield (Landing Page) ── */
function InteractiveShield() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  const handleMouseLeave = useCallback(() => setMousePos({ x: 0.5, y: 0.5 }), []);

  const offsetX = (mousePos.x - 0.5) * 12;
  const offsetY = (mousePos.y - 0.5) * 8;

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex items-center justify-center cursor-default select-none"
      style={{ perspective: '800px' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
      }} />
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{ opacity: { duration: 0.8 }, scale: { duration: 0.8 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        style={{ transformStyle: 'preserve-3d', transform: `rotateY(${offsetX * 0.8}deg) rotateX(${offsetY * -0.6}deg)`, transition: 'transform 0.15s ease-out' }}>
        {/* Outer ring */}
        <div className="absolute" style={{ transform: 'translateZ(20px)', top: '-24px', left: '-24px', right: '-24px', bottom: '-24px' }}>
          <svg viewBox="0 0 240 280" className="w-full h-full opacity-20">
            <path d="M120 16 L220 60 L220 180 C220 220 180 260 120 270 C60 260 20 220 20 180 L20 60 Z" fill="none" stroke="#2563EB" strokeWidth="1.5" />
            <circle cx="120" cy="140" r="110" fill="none" stroke="#2563EB" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 8" />
          </svg>
        </div>
        {/* Mid ring */}
        <div className="absolute" style={{ transform: 'translateZ(10px)', top: '-12px', left: '-12px', right: '-12px', bottom: '-12px' }}>
          <svg viewBox="0 0 216 256" className="w-full h-full opacity-30">
            <path d="M108 20 L196 56 L196 168 C196 200 160 236 108 244 C56 236 20 200 20 168 L20 56 Z" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>
        {/* Main shield */}
        <div style={{ transform: 'translateZ(0px)' }}>
          <svg viewBox="0 0 192 232" width="192" height="232" className="drop-shadow-lg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#2563EB" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
            </defs>
            <path d="M96 12 L180 48 L180 148 C180 178 148 210 96 220 C44 210 12 178 12 148 L12 48 Z" fill="url(#shieldGrad)" stroke="url(#shieldStroke)" strokeWidth="2.5" />
            <path d="M96 32 L164 60 L164 140 C164 165 136 192 96 200 C56 192 28 165 28 140 L28 60 Z" fill="none" stroke="#2563EB" strokeWidth="1" opacity="0.4" />
            <rect x="78" y="105" width="36" height="30" rx="4" fill="#2563EB" opacity="0.9" />
            <path d="M86 105 L86 92 C86 82 96 74 106 82 L106 92 L106 105" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <circle cx="96" cy="118" r="4" fill="#FFFFFF" />
            <path d="M80 56 L92 68 L116 44" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Floating particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-primary/30"
            animate={{ opacity: [0, 0.6, 0], y: [0, -(20 + i * 12)], x: [(i % 2 === 0 ? -1 : 1) * (8 + i * 4)] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
            style={{ left: `${45 + (i % 3) * 10}%`, top: `${30 + i * 10}%` }} />
        ))}
      </motion.div>
    </div>
  );
}

/* ── Right Panel Illustration (Auth Page) ── */
function AuthIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-white/10" style={{ top: '-10%', right: '-15%' }} />
      <div className="absolute w-[350px] h-[350px] rounded-full border border-white/5" style={{ bottom: '-5%', left: '-10%' }} />
      <div className="absolute w-[200px] h-[200px] rounded-full border border-white/10" style={{ top: '40%', left: '20%' }} />

      {/* Floating dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
          animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -(10 + i * 6)], x: [(i % 2 === 0 ? -1 : 1) * (4 + i * 3)] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          style={{ left: `${20 + (i % 3) * 25}%`, top: `${25 + i * 10}%` }} />
      ))}

      {/* Central shield */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { duration: 0.8 }, scale: { duration: 0.8 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="relative z-10"
      >
        <svg viewBox="0 0 160 192" width="160" height="192" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="authShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path d="M80 10 L150 42 L150 125 C150 150 125 178 80 186 C35 178 10 150 10 125 L10 42 Z" fill="url(#authShieldGrad)" stroke="white" strokeWidth="1.5" opacity="0.9" />
          <path d="M80 28 L134 52 L134 118 C134 136 112 160 80 168 C48 160 26 136 26 118 L26 52 Z" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
          <rect x="62" y="88" width="36" height="28" rx="4" fill="white" opacity="0.85" />
          <path d="M70 88 L70 78 C70 68 80 60 90 68 L90 78 L90 88" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <circle cx="80" cy="100" r="3.5" fill="#2563EB" />
          <path d="M66 48 L76 58 L98 38" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </motion.div>

      {/* Glassmorphism card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-12 left-8 right-8 p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">FIDO2 Certified</span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          Built on the WebAuthn standard trusted by the world&apos;s largest financial institutions.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Landing Page ── */
function LandingPage({ onGetStarted, onGetDemo }: { onGetStarted: () => void; onGetDemo: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Navbar ── */}
      <nav className="px-6 md:px-12 lg:px-16 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="font-heading text-base font-semibold">BankShield</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={onGetDemo}>
              Demo
            </Button>
            <Button size="sm" className="text-sm rounded-lg" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero: 2-Column ── */}
      <section className="flex-1 flex items-center px-6 md:px-12 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-8 lg:gap-12 items-center">
          {/* LEFT: 3D Shield */}
          <motion.div className="hidden lg:flex items-center justify-center min-h-[480px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <InteractiveShield />
          </motion.div>

          {/* RIGHT: Content */}
          <motion.div className="flex flex-col justify-center" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-card">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary/80 tracking-wide">BANKSHIELD</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-foreground mb-4 leading-[1.1]">
              The future of banking<br />authentication
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-[1.125rem] text-muted-foreground max-w-md mb-10 leading-relaxed">
              No passwords, no phishing, no credential leaks.
              Just secure, seamless access to your accounts.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex items-center gap-4">
              <Button size="lg" className="text-base px-8 py-3 rounded-xl shadow-card hover:shadow-card-hover transition-smooth" onClick={onGetStarted}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-3 rounded-xl transition-smooth" onClick={onGetDemo}>
                <Play className="w-4 h-4 mr-2" />
                Get Demo
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-6 mt-10 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span>FIDO2 Compliant</span></div>
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /><span>E2E Encrypted</span></div>
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><span>Regulatory Ready</span></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Auth Methods Showcase ── */}
      <section className="px-6 md:px-12 lg:px-16 pb-20">
        <motion.div className="max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-3">Multiple Ways to Authenticate</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Choose the method that works best for you. All are secure, all are passwordless.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AUTH_ICONS.map((m) => {
              const descs: Record<string, string> = {
                passkey: 'Login with device-stored passkeys using WebAuthn / FIDO2.',
                biometric: 'Use your fingerprint or Face ID for instant, secure access.',
                qr: 'Scan a QR code from your trusted device to authenticate.',
                otp: 'Receive a one-time password on your registered email.',
              };
              return (
                <motion.div key={m.id} variants={scaleIn}>
                  <Card className="shadow-card hover:shadow-card-hover transition-smooth cursor-pointer group" onClick={onGetStarted}>
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-smooth">
                          <m.icon className={`w-6 h-6 ${m.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-foreground">{m.label}</span>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-1">{descs[m.id]}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── Security Benefits ── */}
      <section className="px-6 md:px-12 lg:px-16 pb-20">
        <motion.div className="max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-3">Why Passwordless?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Traditional passwords are vulnerable. BankShield Auth eliminates the risk entirely.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SECURITY_FEATURES.map((f) => (
              <motion.div key={f.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth text-center py-8">
                  <CardContent className="pt-0 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><f.icon className="w-6 h-6 text-primary" /></div>
                    <span className="font-semibold text-foreground">{f.label}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-card border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold font-heading">BankShield Auth</span>
          </div>
          <p className="text-xs text-muted-foreground">Passwordless Authentication Platform for Banking Systems</p>
          <p className="text-xs text-muted-foreground mt-1">FIDO2 Compliant · End-to-End Encrypted · Regulatory Ready</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Authentication Page ── */
function AuthPage({ onBack }: { onBack: () => void }) {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT: Auth Panel (White) ── */}
      <div className="flex-1 lg:flex-[1_1_50%] bg-white flex items-center justify-center p-6 md:p-12 lg:p-16 order-2 lg:order-1">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Back button */}
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading text-lg font-semibold">BankShield</span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Welcome to BankShield Auth
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Choose your preferred method to continue — no passwords required.
          </p>

          {/* ── Tab Selector ── */}
          <div className="relative flex p-1 bg-muted rounded-xl mb-8">
            {/* Active indicator */}
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-lg shadow-card"
              style={{ width: 'calc(50% - 4px)' }}
              animate={{ left: authTab === 'login' ? '4px' : 'calc(50% + 0px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setAuthTab('login')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${authTab === 'login' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <Lock className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => setAuthTab('signup')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${authTab === 'signup' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <User className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* ── Form Content ── */}
          <AnimatePresence mode="wait">
            {authTab === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}>
                {/* Login Form */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-12 rounded-xl" />
                  </div>

                  <Button className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth" disabled={!loginEmail.trim()}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-muted-foreground">or authenticate with</span></div>
                  </div>

                  {/* Auth Method Icons */}
                  <div className="grid grid-cols-4 gap-3">
                    {AUTH_ICONS.map((method) => (
                      <button key={method.id} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-smooth group">
                        <method.icon className={`w-5 h-5 ${method.color} group-hover:scale-110 transition-smooth`} />
                        <span className="text-[10px] text-muted-foreground font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Security notice */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
                    <Lock className="w-3 h-3" />
                    <span>Your data is encrypted and never stored on our servers.</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
                {/* Sign Up Form */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-name" type="text" placeholder="John Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="h-12 rounded-xl pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="h-12 rounded-xl pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-phone" type="tel" placeholder="+1 (555) 000-0000" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="h-12 rounded-xl pl-10" />
                    </div>
                  </div>

                  <Button className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth" disabled={!signupName.trim() || !signupEmail.trim()}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Security benefits */}
                  <div className="space-y-3 pt-4">
                    {SIGNUP_BENEFITS.map((b) => (
                      <div key={b.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <b.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.label}</p>
                          <p className="text-xs text-muted-foreground">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── RIGHT: Info Panel (Blue Gradient) ── */}
      <div className="flex-1 lg:flex-[1_1_50%] relative overflow-hidden order-1 lg:order-2 min-h-[280px] lg:min-h-0"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 50%, #1E3A5F 100%)' }}>
        <AuthIllustration />

        {/* Text content */}
        <div className="absolute top-8 left-8 right-8 z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white mb-3">
              Secure banking starts here
            </h2>
            <p className="text-sm text-white/70 max-w-xs leading-relaxed">
              The next generation of authentication — built for banks, designed for people.
            </p>
          </motion.div>
        </div>

        {/* Feature pills */}
        <motion.div
          className="absolute top-28 left-8 right-8 z-10 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {['Passkeys', 'Biometrics', 'QR Auth', 'FIDO2'].map((label) => (
            <span key={label} className="px-3 py-1.5 rounded-full text-xs font-medium text-white/90" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Demo Modal ── */
function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Visual */}
          <div className="relative min-h-[280px] md:min-h-[400px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
            }} />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}>
              <svg viewBox="0 0 120 144" width="120" height="144">
                <path d="M60 8 L112 32 L112 96 C112 116 88 138 60 144 C32 138 8 116 8 96 L8 32 Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" />
                <rect x="46" y="68" width="28" height="22" rx="3" fill="white" opacity="0.85" />
                <path d="M52 68 L52 60 C52 52 60 46 68 52 L68 60 L68 68" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <circle cx="60" cy="78" r="3" fill="#2563EB" />
                <path d="M50 38 L58 46 L74 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </motion.div>
          </div>

          {/* Right: Content */}
          <div className="p-8 flex flex-col justify-center">
            <h3 className="font-heading text-xl font-semibold mb-3">See BankShield in Action</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Experience how passwordless authentication works for banking. No passwords to remember, no credentials to leak — just seamless, secure access.
            </p>

            <div className="space-y-4 mb-6">
              {[
                { icon: KeyRound, label: 'Passkey-first login', desc: 'WebAuthn/FIDO2 standard' },
                { icon: Fingerprint, label: 'Biometric verification', desc: 'Fingerprint & Face ID' },
                { icon: QrCode, label: 'QR authentication', desc: 'Scan & go — no typing' },
                { icon: Mail, label: 'OTP fallback', desc: 'Email one-time codes' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button className="rounded-xl flex-1" onClick={onClose}>
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page Controller ── */
export default function Home() {
  const [pageView, setPageView] = useState<PageView>('landing');
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {pageView === 'landing' ? (
          <motion.div key="landing" {...pageTransition}>
            <LandingPage
              onGetStarted={() => setPageView('auth')}
              onGetDemo={() => setDemoOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div key="auth" {...pageTransition}>
            <AuthPage onBack={() => setPageView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
