'use client';

import { useState, useRef } from 'react';
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
} from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';

type Step = 'email' | 'otp-input' | 'done';

export function OTPAuthForm() {
  const { setUser, setSession, setPageView, setAuthMethod, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);

  const handleGenerateOTP = async () => {
    if (!email.trim()) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Sending Secure OTP...');
    setErrorMessage('');

    try {
      // Get or create user
      const userResult = await createUserOrGet(email);
      if (!userResult.success || !userResult.user) {
        setOverlayStatus('error');
        setErrorMessage(userResult.error || 'Failed to create user');
        return;
      }

      setUserId(userResult.user.id);

      // Generate OTP
      const otpResult = await generateOTP(email);
      if (!otpResult.success) {
        setOverlayStatus('error');
        setErrorMessage(otpResult.error || 'Failed to generate OTP');
        return;
      }

      // Success - show OTP input
      setOverlayVisible(false);
      setStep('otp-input');
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Verifying Identity...');
    setErrorMessage('');

    try {
      const verifyResult = await verifyOTP(email, otpCode);
      if (!verifyResult.success) {
        setOverlayStatus('error');
        setErrorMessage(verifyResult.error || 'Invalid or expired OTP');
        return;
      }

      // Create session
      const sessionResult = await createSession(userId);
      if (!sessionResult.success || !sessionResult.session) {
        setOverlayStatus('error');
        setErrorMessage(sessionResult.error || 'Failed to create session');
        return;
      }

      setOverlayStatus('success');
      setOverlayMessage('Verified Successfully!');

      // Get user info from userResult
      const userResult = await createUserOrGet(email);
      if (userResult.success && userResult.user) {
        setUser({ id: userResult.user.id, email: userResult.user.email, name: userResult.user.name });
        setSession(sessionResult.session.token);
      }

      setTimeout(() => {
        setOverlayVisible(false);
        setPageView(isDemo ? 'demoDashboard' : 'dashboard');
      }, 1000);
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
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
          <span className="font-semibold text-foreground">OTP Login</span>
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
                className="h-12 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateOTP()}
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
              disabled={!email.trim()}
              onClick={handleGenerateOTP}
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
                Code sent to <span className="font-medium text-foreground">{email}</span>
              </p>
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={handleVerifyOTP}
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

            {/* Resend OTP */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleGenerateOTP}
              >
                Resend OTP
              </Button>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
              disabled={otpCode.length !== 6}
              onClick={handleVerifyOTP}
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
