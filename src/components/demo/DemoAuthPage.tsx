'use client';

/**
 * DemoAuthPage — Completely isolated Demo authentication UI.
 *
 * ISOLATION GUARANTEE:
 *  - Zero real API calls
 *  - Zero real database writes
 *  - Zero Resend / email delivery
 *  - OTP generated client-side with crypto.getRandomValues, stored in React state only
 *  - OTP verified client-side against state value
 *  - After OTP verification: sets isDemo=true + demo user in useAuth → pageView='demoDashboard'
 *  - No /api/auth/* routes called. No /api/demo/* routes called for auth.
 *
 * All 5 auth methods shown. Only Email OTP is functional.
 * Non-OTP methods show inline "Demo mode only" message.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Mail,
  KeyRound,
  Smartphone,
  QrCode,
  ArrowLeft,
  Lock,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Monitor,
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
import { useLandingTheme } from '@/hooks/useLandingTheme';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { StatusBadge } from '@/components/ui/status-badge';

/* ── Types ── */
type DemoStep = 'select' | 'otp-email' | 'otp-verify';
type UnavailableMethod = 'passkey' | 'authenticator' | 'qr' | 'recovery' | null;

/* ── Generate a random 6-digit demo OTP using Web Crypto API ── */
function generateDemoOTP(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

/* ── Validate email (basic) ── */
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

/* ── Method card component ── */
function MethodCard({
  icon,
  label,
  badge,
  available,
  onClick,
  unavailableMessage,
  isSelected,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  available: boolean;
  onClick: () => void;
  unavailableMessage?: string;
  isSelected: boolean;
}) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 ${
          available
            ? 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer bg-card'
            : 'border-border/50 bg-muted/20 cursor-pointer opacity-80'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${available ? 'bg-primary/10' : 'bg-muted/40'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${available ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {badge}
          </div>
          {!available && (
            <p className="text-[11px] text-muted-foreground mt-0.5">Not available in Demo Mode</p>
          )}
        </div>
        {available && (
          <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        )}
      </button>

      {/* Inline message for unavailable methods */}
      <AnimatePresence>
        {isSelected && !available && unavailableMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 mx-1 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{unavailableMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Demo Auth Page ── */
export function DemoAuthPage() {
  const { setUser, setSession, setPageView, setIsDemo } = useAuth();
  const { themePref, setThemePref, resolvedTheme } = useLandingTheme();

  const [step, setStep] = useState<DemoStep>('select');
  const [selectedUnavailable, setSelectedUnavailable] = useState<UnavailableMethod>(null);

  // OTP state (pure client-side, zero real API)
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);

  const handleUnavailableMethod = useCallback((method: UnavailableMethod) => {
    setSelectedUnavailable((prev) => prev === method ? null : method);
  }, []);

  const handleOtpMethodClick = useCallback(() => {
    setSelectedUnavailable(null);
    setStep('otp-email');
  }, []);

  const handleGenerateOtp = useCallback(() => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    const otp = generateDemoOTP();
    setGeneratedOtp(otp);
    setOtpGenerated(true);
    setEnteredOtp('');
    setOtpError('');
    setStep('otp-verify');
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (enteredOtp.length !== 6) return;
    if (enteredOtp !== generatedOtp) {
      setOtpError('Incorrect code. Please check the demo OTP displayed above and try again.');
      return;
    }

    setVerifying(true);
    setOtpError('');

    // Simulate a brief verification delay for UX realism (no real API call)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Set demo user in auth state — purely frontend, no DB writes
    setIsDemo(true);
    setUser({ id: 'demo-user-001', email: email.trim() || 'demo@authx.dev', name: 'Demo User' });
    setSession('demo-session-token');
    setPageView('demoDashboard');
  }, [enteredOtp, generatedOtp, email, setIsDemo, setUser, setSession, setPageView]);

  const handleBack = useCallback(() => {
    if (step === 'otp-verify') {
      setStep('otp-email');
      setEnteredOtp('');
      setOtpError('');
    } else if (step === 'otp-email') {
      setStep('select');
      setEmail('');
      setEmailError('');
      setOtpGenerated(false);
    }
  }, [step]);

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${resolvedTheme === 'dark' ? 'dark bg-[#0D1110] text-[#D7DDD9]' : 'bg-[#FFF4E1] text-[#1A312C]'}`}>

      {/* ── LEFT: Dark Panel ── */}
      <div className={`hidden lg:flex lg:flex-[1_1_42%] flex-col items-center justify-center p-12 xl:p-16 relative overflow-hidden ${resolvedTheme === 'dark' ? 'bg-[#08110F]' : 'bg-[#1A312C]'}`}>
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <motion.div className="flex flex-col items-start w-full max-w-md z-10" initial="hidden" animate="visible" variants={staggerContainer}>
          {/* Logo */}
          <motion.div variants={fadeInUp} className="flex items-center gap-2.5 mb-12">
            <Shield className="w-8 h-8 text-white" />
            <span className="font-heading text-2xl font-bold text-white">AuthX</span>
            <StatusBadge variant="warning">Demo</StatusBadge>
          </motion.div>

          <motion.div variants={fadeInUp} className="mb-10">
            <h2 className="font-heading text-3xl font-bold text-white mb-3">Demo Environment</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Experience AuthX&apos;s security platform in a completely isolated demo. No real data is stored or modified.
            </p>
          </motion.div>

          {/* Method showcase */}
          <motion.div variants={fadeInUp} className="w-full space-y-4 mb-10">
            {[
              { icon: <Mail className="w-4 h-4 text-[#89D7B7]" />, label: 'Email OTP', note: 'Functional in demo', active: true },
              { icon: <KeyRound className="w-4 h-4 text-zinc-500" />, label: 'Passkey / WebAuthn', note: 'Full version only', active: false },
              { icon: <Smartphone className="w-4 h-4 text-zinc-500" />, label: 'Authenticator App', note: 'Full version only', active: false },
              { icon: <QrCode className="w-4 h-4 text-zinc-500" />, label: 'QR Login', note: 'Full version only', active: false },
            ].map(({ icon, label, note, active }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[#89D7B7]/10' : 'bg-zinc-800'}`}>
                  {icon}
                </div>
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</p>
                  <p className="text-[11px] text-zinc-600">{note}</p>
                </div>
                {active && <span className="ml-auto text-[10px] bg-[#89D7B7]/10 text-[#89D7B7] border border-[#89D7B7]/20 px-2 py-0.5 rounded-full font-medium">Active</span>}
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="pt-8 border-t border-zinc-800/50 w-full">
            <p className="text-xs text-zinc-600 font-medium tracking-wide uppercase">
              Safe Demo Mode · No Real Data · Auto Isolated
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── RIGHT: Auth Panel ── */}
      <div className={`flex-1 lg:flex-[1_1_58%] flex items-center justify-center p-5 sm:p-8 lg:p-12 xl:p-16 min-h-screen lg:min-h-0`}>
        <motion.div className="w-full max-w-md mx-auto" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>

          {/* Top controls */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setPageView('landing')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button key={t} onClick={() => setThemePref(t)} className={`p-1.5 rounded-full transition-colors ${themePref === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title={`${t} mode`}>
                  {t === 'light' ? <Sun className="w-3.5 h-3.5" /> : t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-7 h-7 text-primary" />
            <span className="font-heading text-xl font-bold text-foreground">AuthX</span>
            <StatusBadge variant="warning">Demo Mode</StatusBadge>
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP: Method Selection ── */}
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <h1 className="font-heading text-2xl font-bold text-foreground mb-1.5">Choose Authentication</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a method to explore AuthX authentication. Only Email OTP is active in Demo Mode.
                </p>

                <div className="space-y-2.5">
                  {/* Email OTP — FUNCTIONAL */}
                  <MethodCard
                    icon={<Mail className="w-5 h-5 text-primary" />}
                    label="Email OTP"
                    badge={<Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0">ACTIVE</Badge>}
                    available={true}
                    onClick={handleOtpMethodClick}
                    isSelected={false}
                    unavailableMessage=""
                  />

                  {/* Passkey — unavailable */}
                  <MethodCard
                    icon={<KeyRound className="w-5 h-5 text-muted-foreground" />}
                    label="Passkey / WebAuthn"
                    available={false}
                    onClick={() => handleUnavailableMethod('passkey')}
                    isSelected={selectedUnavailable === 'passkey'}
                    unavailableMessage="Passkey authentication is available in the full AuthX experience. Demo Mode currently supports Email OTP only. In the full version, you can register and authenticate with hardware security keys and device biometrics."
                  />

                  {/* Authenticator App — unavailable */}
                  <MethodCard
                    icon={<Smartphone className="w-5 h-5 text-muted-foreground" />}
                    label="Authenticator App (TOTP)"
                    available={false}
                    onClick={() => handleUnavailableMethod('authenticator')}
                    isSelected={selectedUnavailable === 'authenticator'}
                    unavailableMessage="Authenticator App (TOTP) is available in the full AuthX experience. Demo Mode currently supports Email OTP only. In the full version, you can configure apps like Google Authenticator or Authy for 6-digit time-based codes."
                  />

                  {/* QR Login — unavailable */}
                  <MethodCard
                    icon={<QrCode className="w-5 h-5 text-muted-foreground" />}
                    label="QR Code Login"
                    available={false}
                    onClick={() => handleUnavailableMethod('qr')}
                    isSelected={selectedUnavailable === 'qr'}
                    unavailableMessage="QR Login is available in the full AuthX experience. Demo Mode currently supports Email OTP only. In the full version, you can approve cross-device logins by scanning a QR code from your mobile device."
                  />

                  {/* Recovery Code — unavailable */}
                  <MethodCard
                    icon={<Shield className="w-5 h-5 text-muted-foreground" />}
                    label="Recovery Code"
                    available={false}
                    onClick={() => handleUnavailableMethod('recovery')}
                    isSelected={selectedUnavailable === 'recovery'}
                    unavailableMessage="Recovery Codes are available in the full AuthX experience. Demo Mode currently supports Email OTP only. In the full version, you can generate a Recovery Kit with 12 single-use backup codes."
                  />
                </div>

                {/* Demo info notice */}
                <div className="mt-6 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Demo Mode</strong> — This is a safe, isolated showcase environment. No real accounts, sessions, or emails are created. All data is cleared when you exit.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: OTP Email Entry ── */}
            {step === 'otp-email' && (
              <motion.div key="otp-email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to methods
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-foreground">Demo Email OTP</h1>
                    <p className="text-xs text-muted-foreground">No real email will be sent</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 mb-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Demo Mode:</strong> Enter any email address. A 6-digit demo OTP will be generated instantly — no real email is sent.
                  </p>
                </div>

                <div className="space-y-2 mb-5">
                  <Label htmlFor="demo-email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="demo-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateOtp()}
                      className="h-11 pl-10 rounded-xl"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-danger flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />{emailError}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-11 rounded-xl"
                  onClick={handleGenerateOtp}
                  disabled={!email.trim()}
                >
                  Generate Demo OTP
                  <Mail className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* ── STEP: OTP Verification ── */}
            {step === 'otp-verify' && (
              <motion.div key="otp-verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change email
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-xl font-bold text-foreground">Enter Demo OTP</h1>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>

                {/* Demo OTP display — callout showing the actual generated code */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-4 rounded-xl bg-success/5 border border-success/25"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <p className="text-xs font-semibold text-success">Demo Verification Code</p>
                    <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px] px-1.5 ml-auto">DEMO ONLY</Badge>
                  </div>
                  <p className="text-3xl font-bold tracking-[0.35em] font-mono text-success text-center py-2">
                    {generatedOtp}
                  </p>
                  <p className="text-[11px] text-success/70 text-center">
                    Your demo OTP is: <strong>{generatedOtp}</strong> — Enter it below to verify
                  </p>
                </motion.div>

                {/* OTP input */}
                <div className="space-y-3 mb-5">
                  <Label className="text-sm font-medium">Enter 6-Digit Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(v) => { setEnteredOtp(v); setOtpError(''); }}
                      onComplete={handleVerifyOtp}
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

                  {otpError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                      <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                      <p className="text-xs text-danger">{otpError}</p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-11 rounded-xl"
                  disabled={enteredOtp.length !== 6 || verifying}
                  onClick={handleVerifyOtp}
                >
                  {verifying ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
                  ) : (
                    <><Lock className="w-4 h-4 mr-2" />Verify Code</>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center mt-4">
                  The code shown above is your demo OTP. No email has been sent.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
