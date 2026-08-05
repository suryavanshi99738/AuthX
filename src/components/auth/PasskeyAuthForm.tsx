'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserOrGet,
  performPasskeyRegistration,
  performPasskeyAuthentication,
  performPasskeySignup,
  createSession,
} from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';
import { InfoCallout } from '@/components/ui/info-callout';

export function PasskeyAuthForm() {
  const { setUser, setSession, setPageView, setAuthMethod, setLoading, isDemo, authTab, signupDraft, loginEmailDraft, setLoginEmailDraft } = useAuth();

  // Sign-up mode is active when the user arrived from the Sign Up tab with a
  // completed draft (name/email/phone).
  //
  // When `loginEmailDraft` is set, the user came from the "account already
  // exists" panel — we run the LOGIN flow with a pre-filled, read-only email
  // (they may sign in with an existing passkey, or register a new one if they
  // don't have one yet — handled by the login branch's auth-then-register
  // fallback).
  const hasPrefilledEmail = Boolean(loginEmailDraft);
  const isSignup = authTab === 'signup' && Boolean(signupDraft) && !hasPrefilledEmail;

  const [email, setEmail] = useState(
    isSignup ? signupDraft?.email ?? '' : (loginEmailDraft ?? '')
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleContinue = async () => {
    // Sign-up flow: create the passkey + account in one ceremony.
    if (isSignup && signupDraft) {
      setOverlayVisible(true);
      setOverlayStatus('loading');
      setOverlayMessage('Creating your passkey...');
      setErrorMessage('');

      try {
        const result = await performPasskeySignup(
          signupDraft.fullName,
          signupDraft.email,
          signupDraft.phone
        );
        if (!result.success || !result.user || !result.session) {
          setOverlayStatus('error');
          setErrorMessage(result.error || 'Passkey sign-up failed');
          return;
        }
        setUser({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        });
        setSession(result.session.token);
        setOverlayStatus('success');
        setOverlayMessage('Account created successfully!');
        setTimeout(() => {
          setOverlayVisible(false);
          setPageView(isDemo ? 'demoDashboard' : 'dashboard');
        }, 1000);
      } catch (error) {
        setOverlayStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
      return;
    }

    // Login flow (existing behaviour): try authentication, fall back to registration.
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

      if (authResult.success && authResult.session) {
        // Authentication succeeded — session created at verification time.
        setOverlayStatus('success');
        setOverlayMessage('Verified Successfully!');
        setUser({ id: user.id, email: user.email, name: user.name });
        setSession(authResult.session.token);
        setLoading(false);

        setTimeout(() => {
          setOverlayVisible(false);
          setPageView(isDemo ? 'demoDashboard' : 'dashboard');
        }, 1000);
        return;
      }

      // If auth failed, try registration
      setOverlayMessage('Registering New Passkey...');
      const regResult = await performPasskeyRegistration(user.id, email);

      if (regResult.success) {
        setOverlayStatus('success');
        setOverlayMessage('Passkey Registered Successfully!');

        // Create session
        const sessionResult = await createSession(user.id, 'Passkey WebAuthn', isDemo);
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
          onClick={() => { setLoginEmailDraft(null); setAuthMethod('default'); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all methods
        </button>

        {/* Method header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading text-xl font-semibold text-foreground">
            {isSignup ? 'Passkey Sign Up' : 'Passkey Login'}
          </span>
        </div>

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
            className="h-11 rounded-lg border-[#E5D7C3] focus:border-[#428475] focus:ring-2 focus:ring-[#428475]/20 bg-white"
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          />
        </div>

        {/* Passkey info */}
        <InfoCallout variant="info" title="Passkey Authentication" className="bg-[#FFF4E1] border-[#428475] border-l-[#428475] text-[#1A312C]">
          Passkeys are stored securely on your device. No server-side credential storage —
          eliminating phishing and credential theft entirely.
        </InfoCallout>

        <Button
          className="w-full h-11 rounded-lg bg-[#428475] text-white hover:bg-[#356B5F] transition-smooth"
          disabled={isSignup ? false : !email.trim()}
          onClick={handleContinue}
        >
          {isSignup ? 'Create Passkey' : 'Continue with Passkey'}
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
