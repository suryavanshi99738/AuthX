'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  QrCode,
  Mail,
  ArrowRight,
  Lock,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { SpotlightHeading } from './SpotlightHeading';
import { DemoModal } from './DemoModal';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations';

/* ── Auth Method Definitions ── */
const AUTH_ICONS = [
  { id: 'passkey', icon: KeyRound, label: 'Passkey', color: 'text-primary' },
  { id: 'biometric', icon: Fingerprint, label: 'Biometric', color: 'text-success' },
  { id: 'qr', icon: QrCode, label: 'QR Code', color: 'text-info' },
  { id: 'otp', icon: Mail, label: 'OTP', color: 'text-warning' },
];

const SECURITY_FEATURES = [
  { icon: Lock, label: 'Zero Passwords', desc: 'No passwords means no phishing, no brute-force, no credential leaks.' },
  { icon: ShieldCheck, label: 'Enterprise Security', desc: 'FIDO2-compliant, end-to-end encrypted, and regulatory-ready.' },
  { icon: CheckCircle2, label: 'Phishing Proof', desc: 'Passkeys and biometrics can\'t be stolen or reused on fake sites.' },
];

/* ── Interactive 3D Shield (Landing Page) ── */
function InteractiveShield() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0.5, y: 0.5 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleClick = useCallback(() => setClickCount((c) => c + 1), []);

  const offsetX = (mousePos.x - 0.5) * 16;
  const offsetY = (mousePos.y - 0.5) * 10;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      suppressHydrationWarning
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none"
      style={{ perspective: '800px' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        suppressHydrationWarning
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(37, 99, 235, ${isHovered ? 0.15 : 0.08}) 0%, transparent 70%)`,
          transition: 'background 0.4s ease',
        }}
      />
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.06 : (clickCount > 0 ? [1, 1.08, 1] : 1),
          y: [0, -6, 0],
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: isHovered ? { duration: 0.3, ease: 'easeOut' } : { duration: 0.4, ease: 'easeInOut' },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${offsetX * 1}deg) rotateX(${offsetY * -0.8}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute"
          style={{ transform: 'translateZ(20px)', top: '-24px', left: '-24px', right: '-24px', bottom: '-24px' }}
          animate={{ opacity: isHovered ? 0.4 : 0.2 }}
          transition={{ duration: 0.3 }}
        >
          <svg viewBox="0 0 240 280" className="w-full h-full">
            <path d="M120 16 L220 60 L220 180 C220 220 180 260 120 270 C60 260 20 220 20 180 L20 60 Z" fill="none" stroke="#2563EB" strokeWidth="1.5" />
            <circle cx="120" cy="140" r="110" fill="none" stroke="#2563EB" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 8" />
          </svg>
        </motion.div>

        {/* Mid ring */}
        <motion.div
          className="absolute"
          style={{ transform: 'translateZ(10px)', top: '-12px', left: '-12px', right: '-12px', bottom: '-12px' }}
          animate={{ opacity: isHovered ? 0.5 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <svg viewBox="0 0 216 256" className="w-full h-full">
            <path d="M108 20 L196 56 L196 168 C196 200 160 236 108 244 C56 236 20 200 20 168 L20 56 Z" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </motion.div>

        {/* Main shield */}
        <motion.div
          style={{ transform: 'translateZ(0px)' }}
          animate={{ scale: clickCount > 0 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <svg viewBox="0 0 192 232" width="192" height="232" className="drop-shadow-lg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={isHovered ? 0.25 : 0.15} />
                <stop offset="50%" stopColor="#2563EB" stopOpacity={isHovered ? 0.15 : 0.08} />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity={isHovered ? 0.2 : 0.12} />
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
        </motion.div>

        {/* Floating particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${45 + (i % 3) * 10}%`,
              top: `${30 + i * 10}%`,
              backgroundColor: isHovered ? '#2563EB' : 'rgba(37,99,235,0.3)',
            }}
            animate={{
              opacity: isHovered ? [0.4, 0.9, 0.4] : [0, 0.6, 0],
              y: [0, -(20 + i * 12)],
              x: [(i % 2 === 0 ? -1 : 1) * (8 + i * 4)],
              scale: isHovered ? [1, 1.5, 1] : [1, 1, 1],
            }}
            transition={{ duration: isHovered ? 2 : 3 + i * 0.5, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
          />
        ))}

        {/* Hover glow ring */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Landing Page ── */
export function LandingPage() {
  const { setPageView, setIsDemo } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);

  const handleStartReal = () => {
    setIsDemo(false);
    setPageView('auth');
  };

  const handleStartDemo = () => {
    setIsDemo(true);
    setPageView('auth');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" suppressHydrationWarning>
      {/* ── Navbar ── */}
      <nav className="px-6 md:px-12 lg:px-16 py-5" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-foreground">AuthX</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={handleStartDemo}>
              Demo
            </Button>
            <Button size="sm" className="text-sm rounded-lg" onClick={handleStartReal}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero: 2-Column ── */}
      <section className="flex-1 flex items-center px-6 md:px-12 lg:px-16 py-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-8 lg:gap-12 items-center" suppressHydrationWarning>
          {/* LEFT: 3D Shield */}
          <motion.div
            className="hidden lg:flex items-center justify-center min-h-[480px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <InteractiveShield />
          </motion.div>

          {/* RIGHT: Content */}
          <motion.div className="flex flex-col justify-center" initial="hidden" animate="visible" variants={staggerContainer} suppressHydrationWarning>
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6" suppressHydrationWarning>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-card border border-primary/20" suppressHydrationWarning>
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-bold text-primary tracking-wide">AUTHX</span>
            </motion.div>

            <SpotlightHeading />

            <motion.p variants={fadeInUp} className="text-lg md:text-[1.125rem] text-muted-foreground max-w-md mb-10 leading-relaxed">
              No passwords, no phishing, no credential leaks.
              Just secure, seamless access to your accounts.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex items-center gap-4">
              <Button
                size="lg"
                className="text-base px-8 py-3 rounded-xl shadow-card hover:shadow-card-hover transition-smooth"
                onClick={handleStartReal}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-3 rounded-xl transition-smooth"
                onClick={handleStartDemo}
              >
                <Play className="w-4 h-4 mr-2" />
                Get Demo
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-6 mt-10 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /><span>FIDO2 Compliant</span></div>
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /><span>E2E Encrypted</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /><span>Regulatory Ready</span></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Auth Methods Showcase ── */}
      <section className="px-6 md:px-12 lg:px-16 pb-20" suppressHydrationWarning>
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          suppressHydrationWarning
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-3">Multiple Ways to Authenticate</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Choose the method that works best for you. All are secure, all are passwordless.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" suppressHydrationWarning>
            {AUTH_ICONS.map((m) => {
              const descs: Record<string, string> = {
                passkey: 'Login with device-stored passkeys using WebAuthn / FIDO2.',
                biometric: 'Use your fingerprint or Face ID for instant, secure access.',
                qr: 'Scan a QR code from your trusted device to authenticate.',
                otp: 'Receive a one-time password on your registered email.',
              };
              return (
                <motion.div key={m.id} variants={scaleIn}>
                  <Card
                    className="shadow-card hover:shadow-card-hover transition-smooth cursor-pointer group"
                    onClick={() => setPageView('auth')}
                  >
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
      <section className="px-6 md:px-12 lg:px-16 pb-20" suppressHydrationWarning>
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          suppressHydrationWarning
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-3">Why Passwordless?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Traditional passwords are vulnerable. AuthX eliminates the risk entirely.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" suppressHydrationWarning>
            {SECURITY_FEATURES.map((f) => (
              <motion.div key={f.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth text-center py-8">
                  <CardContent className="pt-0 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
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
      <footer className="mt-auto bg-card border-t border-border py-8 px-6" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto text-center" suppressHydrationWarning>
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold font-heading">AuthX</span>
          </div>
          <p className="text-xs text-muted-foreground">Passwordless Authentication Platform</p>
          <p className="text-xs text-muted-foreground mt-1">FIDO2 Compliant · End-to-End Encrypted · Regulatory Ready</p>
        </div>
      </footer>

      {/* Demo Modal (for navbar "Demo" button) */}
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
