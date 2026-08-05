'use client';

import { useState } from 'react';
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
  Smartphone,
  Eye,
  User,
  Phone,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { PasskeyAuthForm } from './PasskeyAuthForm';
import { OTPAuthForm } from './OTPAuthForm';
import { QRAuthForm } from './QRAuthForm';
import { MobileQRScannerModal } from './MobileQRScannerModal';
import { UnderDevelopmentModal } from './UnderDevelopmentModal';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations';
import { signupCheck } from '@/services/auth-client';
import { useRouter } from 'next/navigation';
import { InfoCallout } from '@/components/ui/info-callout';
import { StatusBadge } from '@/components/ui/status-badge';

/* ── Auth Method Icons (for login selector) ── */
const AUTH_METHODS = [
  { id: 'passkey' as const, icon: KeyRound, label: 'Passkey', color: 'text-primary' },
  { id: 'biometric' as const, icon: Fingerprint, label: 'Biometric', color: 'text-success' },
  { id: 'qr' as const, icon: QrCode, label: 'QR Code', color: 'text-info' },
  { id: 'otp' as const, icon: Mail, label: 'OTP', color: 'text-warning' },
];

const SIGNUP_BENEFITS = [
  { icon: Shield, label: 'Passwordless authentication', desc: 'No passwords to remember, lose, or steal.' },
  { icon: Smartphone, label: 'Secure device recognition', desc: 'Your trusted devices are your key.' },
  { icon: Eye, label: 'Privacy focused', desc: 'Your biometric data never leaves your device.' },
];

/* ── Auth Page Interactive Shield ── */
function AuthInteractiveShield() {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickCount((c) => c + 1)}
      className="relative cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.08 : (clickCount > 0 ? [1, 1.1, 1] : 1),
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: isHovered ? { duration: 0.3 } : { duration: 0.4 },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <svg viewBox="0 0 160 192" width="160" height="192" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="authShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isHovered ? 0.35 : 0.25} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={isHovered ? 0.15 : 0.08} />
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

/* ── Auth Page Component ── */
export function AuthPage() {
  const { setPageView, authTab, setAuthTab, authMethod, setAuthMethod, setSignupDraft, setLoginEmailDraft, isDemo } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [underDevOpen, setUnderDevOpen] = useState(false);
  const [underDevFeature, setUnderDevFeature] = useState('');
  const [signupStep, setSignupStep] = useState<'form' | 'methods' | 'exists'>('form');
  const [signupError, setSignupError] = useState('');
  const [signupChecking, setSignupChecking] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const [existingUserMethods, setExistingUserMethods] = useState<{
    otp: boolean;
    passkey: boolean;
    biometric: boolean;
    qr: boolean;
  }>({
    otp: true,
    passkey: false,
    biometric: false,
    qr: false,
  });

  const router = useRouter();
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  const visibleAuthMethods = AUTH_METHODS.filter((m) => !isDemo || m.id !== 'passkey');

  const handleMethodClick = (methodId: string) => {
    if (methodId === 'passkey' || methodId === 'otp' || methodId === 'qr') {
      setAuthMethod(methodId as 'passkey' | 'otp' | 'qr');
    } else {
      setUnderDevFeature('Biometric Authentication');
      setUnderDevOpen(true);
    }
  };

  const handleSignupMethodClick = (methodId: string, fromExists = false) => {
    if (methodId === 'otp' || methodId === 'passkey' || methodId === 'qr') {
      if (fromExists) {
        setLoginEmailDraft(existingEmail);
      }
      setAuthMethod(methodId as 'otp' | 'passkey' | 'qr');
    } else {
      setUnderDevFeature('Biometric');
      setUnderDevOpen(true);
    }
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^\+?[0-9][0-9\s\-()]{6,19}$/.test(value.trim());

  const handleLoginContinue = async () => {
    setLoginError('');
    const email = loginEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    setSignupChecking(true);
    try {
      const result = await signupCheck(email);
      if (!result.success) {
        setLoginError(result.error || 'Could not verify email. Please try again.');
        return;
      }
      if (result.exists) {
        setExistingEmail(email);
        if (result.methods) {
          setExistingUserMethods(result.methods);
        }
        setAuthTab('signup');
        setSignupStep('exists');
        return;
      }
      // If account does not exist, route user to sign up form with email prefilled
      setSignupEmail(email);
      setAuthTab('signup');
      setSignupStep('form');
    } catch {
      setLoginError('Something went wrong. Please try again.');
    } finally {
      setSignupChecking(false);
    }
  };

  const handleSignupContinue = async () => {
    setSignupError('');
    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const phone = signupPhone.trim();

    if (name.length < 2) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (!isValidPhone(phone)) {
      setSignupError('Please enter a valid phone number.');
      return;
    }

    setSignupChecking(true);
    try {
      const result = await signupCheck(email);
      if (!result.success) {
        setSignupError(result.error || 'Could not verify email. Please try again.');
        return;
      }
      if (result.exists) {
        setExistingEmail(email);
        if (result.methods) {
          setExistingUserMethods(result.methods);
        }
        setSignupStep('exists');
        return;
      }
      setSignupDraft({ fullName: name, email, phone });
      setSignupStep('methods');
    } catch {
      setSignupError('Something went wrong. Please try again.');
    } finally {
      setSignupChecking(false);
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
            <ShieldCheck className="w-8 h-8 text-white" />
            <span className="font-heading text-2xl font-bold text-white">AuthX</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Secure your identity
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-12">
              Enterprise-grade passwordless authentication powered by FIDO2 WebAuthn standards.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-6 w-full mb-12">
            <div className="flex items-center gap-4">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Hardware-bound passkeys</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">One-time email verification</span>
            </div>
            <div className="flex items-center gap-4">
              <QrCode className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Cross-device QR login</span>
            </div>
            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Adaptive risk detection</span>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeInUp} className="mt-auto pt-8 border-t border-zinc-800/50 w-full">
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              FIDO2 Certified · WebAuthn Standard
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

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="font-heading text-xl font-bold text-foreground">AuthX</span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            {authTab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {authTab === 'login' ? 'Sign in to your account' : 'Get started with secure authentication'}
          </p>

          {/* ── Tab Selector ── */}
          <div className="relative flex p-1 bg-muted/50 rounded-lg mb-8">
            <motion.div
              className="absolute top-1 bottom-1 bg-background shadow-sm rounded-md"
              style={{ width: 'calc(50% - 4px)' }}
              animate={{ left: authTab === 'login' ? '4px' : 'calc(50% + 0px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setAuthTab('login')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${authTab === 'login' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setSignupStep('form'); setSignupError(''); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${authTab === 'signup' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          {/* ── Form Content ── */}
          <AnimatePresence mode="wait">
            {authTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {authMethod === 'default' ? (
                    <motion.div key="default-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                            className="h-11 rounded-lg border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleLoginContinue()}
                          />
                        </div>

                        {loginError && (
                          <p className="text-xs text-danger" role="alert">{loginError}</p>
                        )}

                        <Button
                          className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                          disabled={!loginEmail.trim() || signupChecking}
                          onClick={handleLoginContinue}
                        >
                          {signupChecking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking…
                            </>
                          ) : (
                            'Continue'
                          )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                          <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or continue with</span></div>
                        </div>

                        {/* Auth Method Icons */}
                        <div className="grid grid-cols-2 gap-3">
                          {visibleAuthMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => handleMethodClick(method.id)}
                              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-smooth cursor-pointer"
                            >
                              <method.icon className="w-5 h-5 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground">{method.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Security notice */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                          <Lock className="w-3 h-3" />
                          <span>Your data is encrypted and never stored on our servers.</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key={`${authMethod}-form`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {authMethod === 'passkey' && <PasskeyAuthForm />}
                      {authMethod === 'otp' && <OTPAuthForm />}
                      {authMethod === 'qr' && <QRAuthForm />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {authMethod === 'default' ? (
                    <motion.div key="signup-default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {signupStep === 'form' ? (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-name" type="text" placeholder="John Doe" value={signupName} onChange={(e) => { setSignupName(e.target.value); setSignupError(''); }} className="h-11 rounded-lg pl-10 border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setSignupError(''); }} className="h-11 rounded-lg pl-10 border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-phone" type="tel" placeholder="+1 (555) 000-0000" value={signupPhone} onChange={(e) => { setSignupPhone(e.target.value); setSignupError(''); }} className="h-11 rounded-lg pl-10 border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                          </div>

                          {signupError && (
                            <p className="text-xs text-danger" role="alert">{signupError}</p>
                          )}

                          <Button
                            className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                            disabled={!signupName.trim() || !signupEmail.trim() || !signupPhone.trim() || signupChecking}
                            onClick={handleSignupContinue}
                          >
                            {signupChecking ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking…
                              </>
                            ) : (
                              'Continue'
                            )}
                          </Button>
                        </div>
                      ) : signupStep === 'exists' ? (
                        <div className="space-y-5">
                          <button
                            onClick={() => { setSignupStep('form'); setAuthMethod('default'); setLoginEmailDraft(null); setExistingEmail(''); }}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to details
                          </button>

                          <InfoCallout variant="warning" title="Account already exists">
                            Authenticate using available methods for {existingEmail}.
                          </InfoCallout>

                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Available Authentication Methods</span>
                          </div>

                          <div className="space-y-2 pt-1">
                            {AUTH_METHODS.map((method) => {
                              let status: 'available' | 'not_registered' | 'under_dev' = 'under_dev';
                              let badgeLabel = 'Under Development';
                              let badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';

                              if (method.id === 'otp') {
                                status = 'available';
                                badgeLabel = 'Available';
                                badgeVariant = 'success';
                              } else if (method.id === 'passkey') {
                                if (existingUserMethods.passkey) {
                                  status = 'available';
                                  badgeLabel = 'Available';
                                  badgeVariant = 'success';
                                } else {
                                  status = 'not_registered';
                                  badgeLabel = 'Not registered';
                                  badgeVariant = 'neutral';
                                }
                              }

                              const isClickable = status === 'available';

                              return (
                                <button
                                  key={method.id}
                                  disabled={!isClickable}
                                  onClick={() => handleSignupMethodClick(method.id, true)}
                                  className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-smooth text-left ${
                                    isClickable
                                      ? 'bg-card border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                                      : 'border-border/50 bg-muted/30 opacity-65 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <method.icon className={`w-5 h-5 ${isClickable ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                                  </div>
                                  <StatusBadge variant={badgeVariant}>{badgeLabel}</StatusBadge>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => { setSignupStep('form'); setAuthMethod('default'); setLoginEmailDraft(null); setExistingEmail(''); setSignupEmail(''); setSignupName(''); setSignupPhone(''); }}
                            className="w-full text-center text-xs text-primary hover:underline pt-1"
                          >
                            Use a different email
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <button
                            onClick={() => { setSignupStep('form'); setAuthMethod('default'); }}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to details
                          </button>

                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-foreground">Verify your email</span>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Choose an authentication method to continue. We&apos;ll verify your email to create your account.
                          </p>

                          {/* Auth Method Icons */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            {AUTH_METHODS.map((method) => (
                              <button
                                key={method.id}
                                onClick={() => handleSignupMethodClick(method.id)}
                                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-smooth cursor-pointer"
                              >
                                <method.icon className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-sm font-medium text-foreground">{method.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key={`${authMethod}-form`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {authMethod === 'otp' && <OTPAuthForm />}
                      {authMethod === 'passkey' && <PasskeyAuthForm />}
                      {authMethod === 'qr' && <QRAuthForm />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Under Development Modal */}
      <UnderDevelopmentModal
        open={underDevOpen}
        onClose={() => setUnderDevOpen(false)}
        featureName={underDevFeature}
      />
    </div>
  );
}
