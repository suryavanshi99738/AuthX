'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Lock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserOrGet,
  generateOTP,
  verifyOTP,
  createSession,
  signupInit,
  signupResend,
  signupVerify,
} from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';
import { toast } from '@/hooks/use-toast';

type Step = 'email' | 'otp-input';

const RESEND_COOLDOWN_SECONDS = 30;

export function OTPAuthForm() {
  const { setUser, setSession, setPageView, setAuthMethod, isDemo, authTab, signupDraft, loginEmailDraft, setLoginEmailDraft } = useAuth();

  // Sign-up mode is active when the user arrived from the Sign Up tab with a
  // completed draft (name/email/phone).
  //
  // When `loginEmailDraft` is set, the user came from the "account already
  // exists" panel — we run the LOGIN flow (createUserOrGet → generateOTP →
  // verifyOTP → session) with a pre-filled, read-only email.
  const hasPrefilledEmail = Boolean(loginEmailDraft);
  const isSignup = authTab === 'signup' && Boolean(signupDraft) && !hasPrefilledEmail;

  const [email, setEmail] = useState(
    isSignup ? signupDraft?.email ?? '' : (loginEmailDraft ?? '')
  );
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [sending, setSending] = useState(false);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const startCooldown = () => setResendIn(RESEND_COOLDOWN_SECONDS);

  const handleSendOtp = async () => {
    if (sending) return;
    const targetEmail = email.trim();
    if (!targetEmail) return;

    setSending(true);
    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage(isSignup ? 'Sending verification code…' : 'Sending Secure OTP…');
    setErrorMessage('');

    try {
      if (isSignup && signupDraft) {
        const result = await signupInit(signupDraft.fullName, signupDraft.email, signupDraft.phone);
        if (!result.success) {
          setOverlayStatus('error');
          setErrorMessage(result.error || 'Failed to send verification code');
          return;
        }
      } else {
        // Login flow: ensure user exists, then issue OTP.
        const userResult = await createUserOrGet(targetEmail);
        if (!userResult.success || !userResult.user) {
          setOverlayStatus('error');
          setErrorMessage(userResult.error || 'Failed to create user');
          return;
        }
        setUserId(userResult.user.id);

        const otpResult = await generateOTP(targetEmail, isDemo);
        if (!otpResult.success) {
          setOverlayStatus('error');
          setErrorMessage(otpResult.error || 'Failed to generate OTP');
          return;
        }

        if (isDemo && otpResult.otpCode) {
          toast({
            title: 'Demo Mode — Verification Code',
            description: `Demo Mode — Verification Code: ${otpResult.otpCode}`,
            duration: 10000,
          });
        }
      }

      setOverlayStatus('success');
      setOverlayMessage(isDemo ? 'Demo OTP generated (Check Toast)!' : 'Verification code sent!');
      startCooldown();

      setTimeout(() => {
        setOverlayVisible(false);
        setStep('otp-input');
      }, 800);
    } catch {
      setOverlayStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || sending) return;
    const targetEmail = (isSignup ? signupDraft?.email : email) ?? '';
    if (!targetEmail) return;

    setSending(true);
    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Resending code…');
    setErrorMessage('');

    try {
      const result = isSignup
        ? await signupResend(targetEmail)
        : await generateOTP(targetEmail, isDemo);
      if (!result.success) {
        setOverlayStatus('error');
        setErrorMessage(result.error || 'Failed to resend code');
        return;
      }
      if (isDemo && result.otpCode) {
        toast({
          title: 'Demo Mode — Verification Code',
          description: `Demo Mode — Verification Code: ${result.otpCode}`,
          duration: 10000,
        });
      }
      setOverlayStatus('success');
      setOverlayMessage('New code generated!');
      startCooldown();
      setOtpCode('');
      setTimeout(() => setOverlayVisible(false), 800);
    } catch {
      setOverlayStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Verifying Identity…');
    setErrorMessage('');

    const targetEmail = (isSignup ? signupDraft?.email : email) ?? '';

    try {
      if (isSignup) {
        // Sign-up verification: creates the account + session atomically.
        const result = await signupVerify(targetEmail, otpCode);
        if (!result.success || !result.user || !result.session) {
          setOverlayStatus('error');
          setErrorMessage(result.error || 'Invalid or expired code');
          return;
        }
        setUser({ id: result.user.id, email: result.user.email, name: result.user.name });
        setSession(result.session.token);
        setOverlayStatus('success');
        setOverlayMessage('Account created successfully!');
        setTimeout(() => {
          setOverlayVisible(false);
          setPageView(isDemo ? 'demoDashboard' : 'dashboard');
        }, 1000);
      } else {
        // Login verification.
        const verifyResult = await verifyOTP(targetEmail, otpCode);
        if (!verifyResult.success) {
          setOverlayStatus('error');
          setErrorMessage(verifyResult.error || 'Invalid or expired OTP');
          return;
        }

        const userResult = await createUserOrGet(targetEmail);
        if (!userResult.success || !userResult.user) {
          setOverlayStatus('error');
          setErrorMessage('User record could not be established');
          return;
        }

        const canonicalUserId = userResult.user.id;
        const sessionResult = await createSession(canonicalUserId, 'Email OTP', isDemo);
        if (!sessionResult.success || !sessionResult.session) {
          setOverlayStatus('error');
          setErrorMessage(sessionResult.error || 'Failed to create session');
          return;
        }

        setOverlayStatus('success');
        setOverlayMessage('Verified Successfully!');
        setUser({ id: userResult.user.id, email: userResult.user.email, name: userResult.user.name });
        setSession(sessionResult.session.token);

        setTimeout(() => {
          setOverlayVisible(false);
          setPageView(isDemo ? 'demoDashboard' : 'dashboard');
        }, 1000);
      }
    } catch {
      setOverlayStatus('error');
      setErrorMessage('An unexpected error occurred');
    }
  };

  const handleDismissError = () => {
    setOverlayVisible(false);
    setOverlayStatus('loading');
    if (step === 'otp-input') {
      setOtpCode('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-5">
        {/* Back button */}
        <button
          onClick={() => {
            if (step === 'otp-input') {
              setStep('email');
              setOtpCode('');
            } else {
              setLoginEmailDraft(null);
              setAuthMethod('default');
            }
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'otp-input' ? 'Back to email' : 'Back to all methods'}
        </button>

        {/* Method header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-warning" />
          </div>
          <span className="font-semibold text-foreground">
            {isSignup ? 'Email Verification' : 'OTP Login'}
          </span>
        </div>

        {step === 'email' && (
          <>
            {/* Email input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSignup || hasPrefilledEmail}
                readOnly={isSignup || hasPrefilledEmail}
                className="h-12 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              />
            </div>

            {/* OTP info */}
            <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">One-Time Password</p>
                  <p className="text-xs text-muted-foreground">6-digit code sent to email</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A 6-digit verification code will be sent to your email. Enter it below to verify your identity.
                The code expires in 5 minutes.
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
              disabled={!email.trim() || sending}
              onClick={handleSendOtp}
            >
              Send OTP Code
              <Mail className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {step === 'otp-input' && (
          <>
            {/* OTP input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enter 6-Digit Code</Label>
              <p className="text-xs text-muted-foreground">
                Code sent to <span className="font-medium text-foreground">{email || signupDraft?.email}</span>
              </p>
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
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

            {/* Resend OTP with cooldown */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                disabled={resendIn > 0 || sending}
                onClick={handleResendOtp}
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend OTP'}
              </Button>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
              disabled={otpCode.length !== 6 || sending}
              onClick={handleVerifyOtp}
            >
              Verify Code
              <Lock className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {/* Security notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
          <Lock className="w-3 h-3" />
          <span>OTP codes expire after 5 minutes for security.</span>
        </div>
      </div>

      <AuthLoadingOverlay
        isVisible={overlayVisible}
        message={overlayMessage}
        status={overlayStatus}
        errorMessage={errorMessage}
        onDismiss={handleDismissError}
      />
    </motion.div>
  );
}
