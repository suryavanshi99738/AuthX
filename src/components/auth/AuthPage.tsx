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
      {/* ── LEFT: Blue Info Panel ── */}
      <div
        className="hidden lg:flex lg:flex-[1_1_50%] flex-col items-center justify-center p-12 xl:p-16 order-1"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}
      >
        <motion.div
          className="flex flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Logo */}
          <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/90">BankShield</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4">
              Welcome to BankShield Auth
            </h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              The next generation of authentication — built for banks, designed for people.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-6 lg:mb-8 justify-center w-full max-w-sm"
          >
            {['Passkeys', 'Biometrics', 'QR Auth', 'FIDO2'].map((label) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white/90"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                {label}
              </span>
            ))}
          </motion.div>

          {/* Central interactive shield */}
          <AuthInteractiveShield />

          {/* Glassmorphism card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 lg:mt-8 w-full max-w-sm p-5 rounded-2xl"
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
        </motion.div>
      </div>

      {/* ── RIGHT: Auth Panel (White) ── */}
      <div className="flex-1 lg:flex-[1_1_50%] bg-white flex items-center justify-center p-6 md:p-12 lg:p-16 order-2">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">AuthX</span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome to AuthX
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Choose your preferred method to continue — no passwords required.
          </p>

          {/* ── Tab Selector ── */}
          <div className="relative flex p-1 bg-muted rounded-xl mb-8">
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
              onClick={() => { setAuthTab('signup'); setSignupStep('form'); setSignupError(''); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${authTab === 'signup' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <User className="w-4 h-4" />
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
                            className="h-12 rounded-xl"
                            onKeyDown={(e) => e.key === 'Enter' && handleLoginContinue()}
                          />
                        </div>

                        {loginError && (
                          <p className="text-xs text-danger" role="alert">{loginError}</p>
                        )}

                        <Button
                          className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
                          disabled={!loginEmail.trim() || signupChecking}
                          onClick={handleLoginContinue}
                        >
                          {signupChecking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking…
                            </>
                          ) : (
                            <>
                              Continue
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                          <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-muted-foreground">or authenticate with</span></div>
                        </div>

                        {/* Auth Method Icons */}
                        <div className={`grid gap-3 ${visibleAuthMethods.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                          {visibleAuthMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => handleMethodClick(method.id)}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-smooth group cursor-pointer"
                            >
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
                              <Input id="signup-name" type="text" placeholder="John Doe" value={signupName} onChange={(e) => { setSignupName(e.target.value); setSignupError(''); }} className="h-12 rounded-xl pl-10" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setSignupError(''); }} className="h-12 rounded-xl pl-10" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-phone" type="tel" placeholder="+1 (555) 000-0000" value={signupPhone} onChange={(e) => { setSignupPhone(e.target.value); setSignupError(''); }} className="h-12 rounded-xl pl-10" />
                            </div>
                          </div>

                          {signupError && (
                            <p className="text-xs text-danger" role="alert">{signupError}</p>
                          )}

                          <Button
                            className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
                            disabled={!signupName.trim() || !signupEmail.trim() || !signupPhone.trim() || signupChecking}
                            onClick={handleSignupContinue}
                          >
                            {signupChecking ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking…
                              </>
                            ) : (
                              <>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
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
                      ) : signupStep === 'exists' ? (
                        <div className="space-y-5">
                          {/* Back button */}
                          <button
                            onClick={() => { setSignupStep('form'); setAuthMethod('default'); setLoginEmailDraft(null); setExistingEmail(''); }}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to details
                          </button>

                          {/* Warning card */}
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
                            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-5 h-5 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm">Account already exists</p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Account already exists. Authenticate using available methods for{' '}
                                <span className="font-medium text-foreground break-all">{existingEmail}</span>.
                              </p>
                            </div>
                          </div>

                          {/* Method header */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">Available Authentication Methods</span>
                          </div>

                          {/* Method list with status badges */}
                          <div className="space-y-2 pt-1">
                            {AUTH_METHODS.map((method) => {
                              let status: 'available' | 'not_registered' | 'under_dev' = 'under_dev';
                              let badgeLabel = 'Under Development';
                              let badgeClass = 'bg-muted text-muted-foreground border-transparent';

                              if (method.id === 'otp') {
                                status = 'available';
                                badgeLabel = 'Available';
                                badgeClass = 'bg-success/10 text-success border-success/20';
                              } else if (method.id === 'passkey') {
                                if (existingUserMethods.passkey) {
                                  status = 'available';
                                  badgeLabel = 'Available';
                                  badgeClass = 'bg-success/10 text-success border-success/20';
                                } else {
                                  status = 'not_registered';
                                  badgeLabel = 'Not registered';
                                  badgeClass = 'bg-muted/80 text-muted-foreground border-border';
                                }
                              }

                              const isClickable = status === 'available';

                              return (
                                <button
                                  key={method.id}
                                  disabled={!isClickable}
                                  onClick={() => handleSignupMethodClick(method.id, true)}
                                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-smooth text-left ${
                                    isClickable
                                      ? 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer shadow-sm'
                                      : 'border-border/50 bg-muted/30 opacity-65 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isClickable ? 'bg-primary/10' : 'bg-muted'}`}>
                                      <method.icon className={`w-4 h-4 ${isClickable ? method.color : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{method.label}</p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {status === 'available'
                                          ? 'Ready for authentication'
                                          : status === 'not_registered'
                                          ? 'Setup required after login'
                                          : 'Feature coming soon'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                                    {badgeLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Hint */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
                            <Lock className="w-3 h-3" />
                            <span>Select an available method to access your account securely.</span>
                          </div>

                          {/* Use a different email */}
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
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">Verify your email</span>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Choose an authentication method to continue. We&apos;ll verify your email to create your account.
                          </p>

                          {/* Auth Method Icons */}
                          <div className="grid grid-cols-4 gap-3 pt-2">
                            {AUTH_METHODS.map((method) => (
                              <button
                                key={method.id}
                                onClick={() => handleSignupMethodClick(method.id)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-smooth group"
                              >
                                <method.icon className={`w-5 h-5 ${method.color} group-hover:scale-110 transition-smooth`} />
                                <span className="text-[10px] text-muted-foreground font-medium">{method.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Hint */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
                            <Lock className="w-3 h-3" />
                            <span>Passkey and Email OTP are available. Other methods are coming soon.</span>
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
