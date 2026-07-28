'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ── Animation Variants ── */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.3 } },
};

/* ── Auth Method Data ── */
const AUTH_METHODS = [
  {
    id: 'passkey',
    icon: KeyRound,
    label: 'Passkeys',
    desc: 'Login with device-stored passkeys using WebAuthn / FIDO2 — no passwords needed.',
    color: 'bg-primary',
    hoverColor: 'hover:bg-primary/5',
    iconColor: 'text-primary',
    badge: 'Most Secure',
  },
  {
    id: 'biometric',
    icon: Fingerprint,
    label: 'Biometrics',
    desc: 'Use your fingerprint or Face ID for instant, secure access.',
    color: 'bg-success',
    hoverColor: 'hover:bg-success/5',
    iconColor: 'text-success',
    badge: 'Fastest',
  },
  {
    id: 'qr',
    icon: QrCode,
    label: 'QR Authentication',
    desc: 'Scan a QR code from your trusted device to authenticate instantly.',
    color: 'bg-info',
    hoverColor: 'hover:bg-info/5',
    iconColor: 'text-info',
    badge: 'Convenient',
  },
  {
    id: 'otp',
    icon: Mail,
    label: 'Email OTP',
    desc: 'Receive a one-time password on your registered email to verify your identity.',
    color: 'bg-warning',
    hoverColor: 'hover:bg-warning/5',
    iconColor: 'text-warning',
    badge: 'Backup Method',
  },
  {
    id: 'trusted-device',
    icon: Smartphone,
    label: 'Trusted Devices',
    desc: 'Skip verification on devices you\'ve previously authenticated and marked as trusted.',
    color: 'bg-primary',
    hoverColor: 'hover:bg-primary/5',
    iconColor: 'text-primary',
    badge: 'Seamless',
  },
  {
    id: 'face',
    icon: ScanFace,
    label: 'Face Recognition',
    desc: 'Advanced facial recognition technology for secure and effortless login.',
    color: 'bg-success',
    hoverColor: 'hover:bg-success/5',
    iconColor: 'text-success',
    badge: 'Contactless',
  },
];

const SECURITY_FEATURES = [
  { icon: Lock, label: 'Zero Passwords', desc: 'No passwords means no phishing, no brute-force, no credential leaks.' },
  { icon: Shield, label: 'Bank-Grade Security', desc: 'FIDO2-compliant, end-to-end encrypted, and regulatory-ready.' },
  { icon: CheckCircle2, label: 'Phishing Proof', desc: 'Passkeys and biometrics can\'t be stolen or reused on fake sites.' },
];

type AuthMode = 'login' | 'signup';

export default function Home() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setSelectedMethod(null);
    setEmail('');
    setAuthDialogOpen(true);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Hero Section ── */}
      <header className="pt-16 pb-20 px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shadow-card">
              <Shield className="w-9 h-9 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4"
          >
            BankShield Auth
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10"
          >
            The future of banking authentication. No passwords, no phishing, no credential leaks.
            Just secure, seamless access.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-base px-8 py-3 rounded-xl shadow-card hover:shadow-card-hover transition-smooth"
              onClick={() => openAuth('login')}
            >
              Log In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-3 rounded-xl transition-smooth"
              onClick={() => openAuth('signup')}
            >
              Sign Up
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* ── Auth Methods Showcase ── */}
      <section className="px-4 pb-20">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Multiple Ways to Authenticate
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Choose the method that works best for you. All are secure, all are passwordless.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AUTH_METHODS.map((method) => (
              <motion.div key={method.id} variants={scaleIn}>
                <Card
                  className={`shadow-card hover:shadow-card-hover transition-smooth cursor-pointer group ${method.hoverColor}`}
                  onClick={() => openAuth('login')}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${method.color}/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-smooth`}>
                        <method.icon className={`w-6 h-6 ${method.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{method.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${method.color}/10 ${method.iconColor} font-medium`}>
                            {method.badge}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{method.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Security Benefits ── */}
      <section className="px-4 pb-20">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Why Passwordless?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Traditional passwords are vulnerable. BankShield Auth eliminates the risk entirely.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SECURITY_FEATURES.map((feature) => (
              <motion.div key={feature.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth text-center py-8">
                  <CardContent className="pt-0 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{feature.label}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Auth Dialog ── */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            {!selectedMethod ? (
              /* ── Method Selection View ── */
              <motion.div key="methods" variants={slideUp} initial="hidden" animate="visible" exit="exit">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-semibold">
                    {authMode === 'login' ? 'Log In to BankShield' : 'Create Your Account'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {authMode === 'login'
                      ? 'Choose your preferred authentication method'
                      : 'Sign up securely — no passwords required'}
                  </p>
                </DialogHeader>

                <Separator />

                <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {AUTH_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-smooth group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${method.color}/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-smooth`}>
                        <method.icon className={`w-5 h-5 ${method.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{method.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${method.color}/10 ${method.iconColor} font-medium`}>
                            {method.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{method.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-smooth shrink-0" />
                    </button>
                  ))}
                </div>

                <Separator />

                <div className="px-6 py-4 flex items-center justify-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {authMode === 'login' ? 'Don\'t have an account?' : 'Already have an account?'}
                  </span>
                  <Button
                    variant="link"
                    className="text-primary"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Log In'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ── Method Detail View ── */
              <motion.div key="detail" variants={slideUp} initial="hidden" animate="visible" exit="exit">
                {(() => {
                  const method = AUTH_METHODS.find((m) => m.id === selectedMethod);
                  if (!method) return null;

                  return (
                    <>
                      <DialogHeader className="px-6 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedMethod(null)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-smooth"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <DialogTitle className="text-xl font-semibold">
                            {authMode === 'login' ? 'Log In with' : 'Sign Up with'} {method.label}
                          </DialogTitle>
                        </div>
                      </DialogHeader>

                      <Separator />

                      <div className="px-6 py-6 space-y-6">
                        {/* ── Method Icon & Description ── */}
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl ${method.color}/10 flex items-center justify-center`}>
                            <method.icon className={`w-7 h-7 ${method.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{method.label}</p>
                            <p className="text-sm text-muted-foreground">{method.desc}</p>
                          </div>
                        </div>

                        {/* ── Email Input (common for most methods) ── */}
                        <div className="space-y-2">
                          <Label htmlFor="auth-email" className="text-sm font-medium">
                            Email Address
                          </Label>
                          <Input
                            id="auth-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground">
                            {authMode === 'signup'
                              ? 'We\'ll use this email to verify your identity and send security alerts.'
                              : 'Enter the email associated with your BankShield account.'}
                          </p>
                        </div>

                        {/* ── Method-Specific Content ── */}
                        {selectedMethod === 'passkey' && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <KeyRound className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">Passkey Authentication</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              After entering your email, you\'ll be prompted to use a passkey stored on your device.
                              This uses WebAuthn/FIDO2 — the gold standard for secure authentication.
                            </p>
                          </div>
                        )}

                        {selectedMethod === 'biometric' && (
                          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Fingerprint className="w-4 h-4 text-success" />
                              <span className="text-sm font-medium text-success">Biometric Verification</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Place your finger on the sensor or look at the camera to verify your identity.
                              Your biometric data never leaves your device.
                            </p>
                          </div>
                        )}

                        {selectedMethod === 'qr' && (
                          <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                            <div className="flex items-center gap-2 mb-2">
                              <QrCode className="w-4 h-4 text-info" />
                              <span className="text-sm font-medium text-info">QR Code Login</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              A QR code will appear on screen. Scan it with your BankShield mobile app
                              to authenticate instantly — no typing required.
                            </p>
                          </div>
                        )}

                        {selectedMethod === 'otp' && (
                          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4 text-warning" />
                              <span className="text-sm font-medium text-warning">Email OTP Verification</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              A 6-digit one-time password will be sent to your email.
                              Enter it within 5 minutes to complete authentication.
                            </p>
                          </div>
                        )}

                        {selectedMethod === 'trusted-device' && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Smartphone className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">Trusted Device Access</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              If you\'ve previously marked this device as trusted, you can skip additional
                              verification steps for a faster login experience.
                            </p>
                          </div>
                        )}

                        {selectedMethod === 'face' && (
                          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                            <div className="flex items-center gap-2 mb-2">
                              <ScanFace className="w-4 h-4 text-success" />
                              <span className="text-sm font-medium text-success">Face Recognition</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Advanced facial recognition will verify your identity using your device camera.
                              Contactless, fast, and highly secure.
                            </p>
                          </div>
                        )}

                        {/* ── Action Button ── */}
                        <Button
                          className="w-full rounded-xl py-3 text-base shadow-card hover:shadow-card-hover transition-smooth"
                          disabled={!email.trim()}
                        >
                          {authMode === 'login' ? 'Continue to Login' : 'Continue to Sign Up'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        {/* ── Security Notice ── */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                          <Lock className="w-3 h-3" />
                          <span>
                            Your authentication data is encrypted and never stored on our servers.
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-card border-t border-border py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">BankShield Auth</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Passwordless Authentication Platform for Banking Systems
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            FIDO2 Compliant · End-to-End Encrypted · Regulatory Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
