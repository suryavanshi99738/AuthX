'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserOrGet,
  performPasskeyRegistration,
  performPasskeyAuthentication,
  createSession,
} from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';

type Step = 'email' | 'register' | 'done';

export function PasskeyAuthForm() {
  const { setUser, setSession, setPageView, setAuthMethod, setLoading, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleContinue = async () => {
    if (!email.trim()) return;

    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Preparing Secure Verification...');
    setErrorMessage('');

    try {
      // Step 1: Get or create user
      const userResult = await createUserOrGet(email);
      if (!userResult.success || !userResult.user) {
        setOverlayStatus('error');
        setErrorMessage(userResult.error || 'Failed to create user');
        return;
      }

      const user = userResult.user;

      // Check if user has passkeys - try auth first, then register
      setOverlayMessage('Initiating Passkey Verification...');

      // Try authentication first (user may already have passkeys)
      const authResult = await performPasskeyAuthentication(user.id);

      if (authResult.success) {
        // Authentication succeeded
        setOverlayStatus('success');
        setOverlayMessage('Verified Successfully!');

        // Create session
        const sessionResult = await createSession(user.id);
        if (sessionResult.success && sessionResult.session) {
          setUser({ id: user.id, email: user.email, name: user.name });
          setSession(sessionResult.session.token);
          setLoading(false);

          setTimeout(() => {
            setOverlayVisible(false);
            setPageView(isDemo ? 'demoDashboard' : 'dashboard');
          }, 1000);
          return;
        }
      }

      // If auth failed, try registration
      setOverlayMessage('Registering New Passkey...');
      const regResult = await performPasskeyRegistration(user.id, email);

      if (regResult.success) {
        setOverlayStatus('success');
        setOverlayMessage('Passkey Registered Successfully!');

        // Create session
        const sessionResult = await createSession(user.id);
        if (sessionResult.success && sessionResult.session) {
          setUser({ id: user.id, email: user.email, name: user.name });
          setSession(sessionResult.session.token);
          setLoading(false);

          setTimeout(() => {
            setOverlayVisible(false);
            setPageView(isDemo ? 'demoDashboard' : 'dashboard');
          }, 1000);
          return;
        }
      }

      // Both failed
      setOverlayStatus('error');
      setErrorMessage(regResult.error || authResult.error || 'Passkey verification failed');
    } catch (error) {
      setOverlayStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleDismissError = () => {
    setOverlayVisible(false);
    setOverlayStatus('loading');
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
          onClick={() => setAuthMethod('default')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all methods
        </button>

        {/* Method header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Passkey Login</span>
        </div>

        {/* Email input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Email Address</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          />
        </div>

        {/* Passkey info */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Passkey Authentication</p>
              <p className="text-xs text-muted-foreground">WebAuthn / FIDO2 Standard</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Passkeys are stored securely on your device. No server-side credential storage —
            eliminating phishing and credential theft entirely.
          </p>
        </div>

        <Button
          className="w-full h-12 rounded-xl text-base shadow-card hover:shadow-card-hover transition-smooth"
          disabled={!email.trim()}
          onClick={handleContinue}
        >
          Continue with Passkey
          <KeyRound className="w-4 h-4 ml-2" />
        </Button>

        {/* Security notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
          <Lock className="w-3 h-3" />
          <span>Your passkey is stored only on your device — never on our servers.</span>
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
