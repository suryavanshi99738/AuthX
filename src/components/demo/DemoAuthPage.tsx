'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Mail,
  ArrowRight,
  Lock,
  ArrowLeft,
  Sparkles,
  Hash,
  Eye,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { startDemo, demoPasskey, demoOTP, verifyOTP, createSession } from '@/services/auth-client';
import { AuthLoadingOverlay } from '@/components/auth/AuthLoadingOverlay';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { StatusBadge } from '@/components/ui/status-badge';
import { InfoCallout } from '@/components/ui/info-callout';

type DemoStep = 'select' | 'passkey' | 'otp' | 'otp-verify';

/* ── Demo Auth Page Interactive Shield ── */
function DemoShield() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: isHovered ? 1.08 : 1, y: [0, -8, 0] }}
        transition={{ opacity: { duration: 0.8 }, scale: { duration: 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <svg viewBox="0 0 160 192" width="160" height="192" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="demoShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isHovered ? 0.35 : 0.25} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={isHovered ? 0.15 : 0.08} />
            </linearGradient>
          </defs>
          <path d="M80 10 L150 42 L150 125 C150 150 125 178 80 186 C35 178 10 150 10 125 L10 42 Z" fill="url(#demoShieldGrad)" stroke="white" strokeWidth="1.5" opacity="0.9" />
          <path d="M80 28 L134 52 L134 118 C134 136 112 160 80 168 C48 160 26 136 26 118 L26 52 Z" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
          <rect x="62" y="88" width="36" height="28" rx="4" fill="white" opacity="0.85" />
          <path d="M70 88 L70 78 C70 68 80 60 90 68 L90 78 L90 88" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <circle cx="80" cy="100" r="3.5" fill="#2563EB" />
          <path d="M66 48 L76 58 L98 38" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </motion.div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1.4 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Demo Auth Page ── */
export function DemoAuthPage() {
  const { setUser, setSession, setPageView, setIsDemo } = useAuth();
  const [step, setStep] = useState<DemoStep>('select');
  const [demoUserId, setDemoUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartDemo = async (): Promise<string | null> => {
    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Starting Demo...');
    setErrorMessage('');

    try {
      const result = await startDemo();
      if (!result.success || !result.demoUser || !result.demoSession) {
        setOverlayStatus('error');
        setErrorMessage(result.error || 'Failed to start demo');
        return null;
      }

      const userId = result.demoUser.id;
      setDemoUserId(userId);
      setIsDemo(true);
      setUser({ id: userId, email: result.demoUser.email, name: 'Demo User' });
      setSession(result.demoSession.token);

      setOverlayVisible(false);
      return userId;
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      return null;
    }
  };

  const handleDemoPasskey = async () => {
    const userId = await handleStartDemo();
    if (!userId) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Simulating Passkey Verification...');

    try {
      const result = await demoPasskey(userId);
      if (!result.success) {
        setOverlayStatus('error');
        setErrorMessage(result.error || 'Demo passkey failed');
        return;
      }

      setOverlayStatus('success');
      setOverlayMessage('Passkey Verified!');

      setTimeout(() => {
        setOverlayVisible(false);
        setPageView('demoDashboard');
      }, 1000);
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleDemoOTP = async () => {
    const userId = await handleStartDemo();
    if (!userId) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Generating Demo OTP...');

    try {
      const result = await demoOTP(userId);
      if (!result.success) {
        setOverlayStatus('error');
        setErrorMessage(result.error || 'Failed to generate demo OTP');
        return;
      }

      setDemoOtpCode(result.otpCode || '123456');
      setOverlayVisible(false);
      setStep('otp-verify');
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleVerifyDemoOTP = async () => {
    if (otpCode.length !== 6) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Verifying OTP...');
    setErrorMessage('');

    try {
      const verifyResult = await verifyOTP('demo@bankshield.app', otpCode);
      if (!verifyResult.success) {
        setOverlayStatus('error');
        setErrorMessage(verifyResult.error || 'Invalid OTP');
        return;
      }

      setOverlayStatus('success');
      setOverlayMessage('Verified Successfully!');

      setTimeout(() => {
        setOverlayVisible(false);
        setPageView('demoDashboard');
      }, 1000);
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleDismissError = () => {
    setOverlayVisible(false);
    setOverlayStatus('loading');
    if (step === 'otp-verify') {
      setOtpCode('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT: Dark Panel ── */}
      <div
        className="hidden lg:flex lg:flex-[1_1_45%] flex-col items-center justify-center p-12 xl:p-16 order-1 relative bg-zinc-950 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <motion.div
          className="flex flex-col items-start w-full max-w-md z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Logo */}
          <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-12">
            <Shield className="w-8 h-8 text-white" />
            <span className="font-heading text-2xl font-bold text-white">AuthX</span>
            <StatusBadge variant="warning">Demo</StatusBadge>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Demo Environment
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-12">
              Experience passwordless authentication in a safe demo environment. No real data is stored.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-6 w-full mb-12">
            <div className="flex items-center gap-4">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Simulated Passkeys</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Mock Email OTP</span>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeInUp} className="mt-auto pt-8 border-t border-zinc-800/50 w-full">
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              Safe Demo Mode · Auto Cleanup
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── RIGHT: Auth Panel ── */}
      <div className="flex-1 lg:flex-[1_1_55%] bg-background flex items-center justify-center p-6 md:p-12 lg:p-16 order-2">
        <motion.div
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Back button */}
          <button
            onClick={() => setPageView('landing')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          {/* Logo + Demo badge */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-heading text-xl font-bold text-foreground">AuthX</span>
            <StatusBadge variant="warning">Demo</StatusBadge>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Demo Authentication
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Choose a method to try passwordless authentication in demo mode.
          </p>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 gap-3">
                  {/* Passkey option */}
                  <button
                    onClick={handleDemoPasskey}
                    className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-smooth cursor-pointer text-center"
                  >
                    <KeyRound className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Passkey Demo</span>
                  </button>

                  {/* OTP option */}
                  <button
                    onClick={handleDemoOTP}
                    className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-smooth cursor-pointer text-center"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">OTP Demo</span>
                  </button>
                </div>

                {/* Demo notice */}
                <div className="mt-8">
                  <InfoCallout variant="info" title="Demo Mode">
                    This is a simulated environment. No real authentication is performed. Demo data is cleaned up when you exit.
                  </InfoCallout>
                </div>
              </motion.div>
            )}

            {step === 'otp-verify' && (
              <motion.div key="otp-verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-5">
                  {/* Back button */}
                  <button
                    onClick={() => { setStep('select'); setOtpCode(''); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to methods
                  </button>

                  {/* Method header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-warning" />
                    </div>
                    <span className="font-heading text-xl font-semibold text-foreground">Demo OTP Verification</span>
                  </div>

                  {/* Show the OTP code */}
                  <InfoCallout variant="success" title="Your Demo OTP Code">
                    <span className="text-3xl font-bold tracking-widest font-mono text-success">{demoOtpCode}</span>
                    <p className="text-xs mt-1 text-success/80">Enter this code below to verify</p>
                  </InfoCallout>

                  {/* OTP input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enter 6-Digit Code</Label>
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={setOtpCode}
                      onComplete={handleVerifyDemoOTP}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-smooth"
                    disabled={otpCode.length !== 6}
                    onClick={handleVerifyDemoOTP}
                  >
                    Verify Code
                    <Lock className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AuthLoadingOverlay
        isVisible={overlayVisible}
        message={overlayMessage}
        status={overlayStatus}
        errorMessage={errorMessage}
        onDismiss={handleDismissError}
      />
    </div>
  );
}
