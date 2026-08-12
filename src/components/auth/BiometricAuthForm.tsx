'use client';

/**
 * BiometricAuthForm — Biometric / Device Authentication flow.
 *
 * Security Model:
 *   AuthX UI → WebAuthn API → Browser → OS / Platform Authenticator
 *   → (Fingerprint / Face ID / Windows Hello / Touch ID / Device PIN)
 *   → Cryptographic WebAuthn Assertion → AuthX Server → Verify → Session
 *
 * AuthX NEVER:
 *   - Receives biometric images, fingerprint data, or face templates
 *   - Accesses the camera or fingerprint sensor directly
 *   - Stores any biometric information
 *   - Performs biometric matching
 *
 * The OS/Browser manages the entire biometric verification dialog.
 * AuthX only receives a cryptographic WebAuthn assertion that proves
 * the platform authenticator completed user verification successfully.
 *
 * Compatibility:
 *   If the device has no platform authenticator, the browser may fall back
 *   to a passkey/roaming authenticator or show an error. The form gracefully
 *   handles NotSupportedError, NotAllowedError, and other WebAuthn errors.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  ArrowLeft,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserOrGet,
  performBiometricAuthentication,
} from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';

/* ── Biometric state ── */
type BiometricState =
  | 'email'        // Initial: enter email
  | 'ready'        // Ready to trigger device verification
  | 'waiting'      // Browser/OS dialog shown, waiting for user
  | 'success'      // Verification complete
  | 'cancelled'    // User cancelled the OS dialog
  | 'failed'       // Verification failed (wrong biometric / PIN)
  | 'unavailable'  // Device has no platform authenticator
  | 'no_credential'// No registered passkey/biometric for this account
  | 'timeout';     // WebAuthn request timed out

/* ── Map WebAuthn error names to user-friendly messages ── */
function mapWebAuthnError(err: unknown): { state: BiometricState; message: string } {
  const name = (err as { name?: string })?.name || '';
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (name === 'NotAllowedError' || msg.includes('not allowed') || msg.includes('cancelled') || msg.includes('canceled')) {
    return { state: 'cancelled', message: 'Authentication was cancelled. You can try again or choose another method.' };
  }
  if (name === 'NotSupportedError' || msg.includes('not supported')) {
    return { state: 'unavailable', message: 'Biometric authentication isn\'t supported on this device or browser.' };
  }
  if (name === 'SecurityError') {
    return { state: 'failed', message: 'A security error occurred. Please ensure you\'re on a secure (HTTPS) connection.' };
  }
  if (name === 'InvalidStateError') {
    return { state: 'failed', message: 'Authentication is already in progress. Please wait a moment and try again.' };
  }
  if (msg.includes('timed out') || msg.includes('timeout') || name === 'AbortError') {
    return { state: 'timeout', message: 'Device verification timed out. Please try again.' };
  }
  if (msg.includes('no credential') || msg.includes('not found')) {
    return { state: 'no_credential', message: 'No biometric credential found for this account. Please register a passkey first.' };
  }

  return { state: 'failed', message: 'Biometric authentication failed. Please try again or use another method.' };
}

/* ── State icon & colour map ── */
function StateIndicator({ state }: { state: BiometricState }) {
  if (state === 'waiting') {
    return (
      <motion.div
        className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto"
        animate={{ scale: [1, 1.08, 1], borderColor: ['rgba(37,99,235,0.3)', 'rgba(37,99,235,0.7)', 'rgba(37,99,235,0.3)'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Fingerprint className="w-9 h-9 text-primary" />
      </motion.div>
    );
  }
  if (state === 'success') {
    return (
      <motion.div
        className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/40 flex items-center justify-center mx-auto"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <CheckCircle2 className="w-9 h-9 text-success" />
      </motion.div>
    );
  }
  if (state === 'cancelled' || state === 'failed' || state === 'timeout') {
    return (
      <div className="w-20 h-20 rounded-full bg-warning/10 border-2 border-warning/30 flex items-center justify-center mx-auto">
        <XCircle className="w-9 h-9 text-warning" />
      </div>
    );
  }
  if (state === 'unavailable' || state === 'no_credential') {
    return (
      <div className="w-20 h-20 rounded-full bg-muted/40 border-2 border-border flex items-center justify-center mx-auto">
        <AlertCircle className="w-9 h-9 text-muted-foreground" />
      </div>
    );
  }
  // 'ready' or 'email'
  return (
    <motion.div
      className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Fingerprint className="w-9 h-9 text-success" />
    </motion.div>
  );
}

/* ── Main BiometricAuthForm ── */
export function BiometricAuthForm() {
  const {
    setUser,
    setSession,
    setPageView,
    setAuthMethod,
    setLoginEmailDraft,
    isDemo,
    authTab,
    signupDraft,
    loginEmailDraft,
  } = useAuth();

  const hasPrefilledEmail = Boolean(loginEmailDraft);
  const isSignup = authTab === 'signup' && Boolean(signupDraft) && !hasPrefilledEmail;

  const [email, setEmail] = useState(isSignup ? signupDraft?.email ?? '' : (loginEmailDraft ?? ''));
  const [emailError, setEmailError] = useState('');
  const [biometricState, setBiometricState] = useState<BiometricState>(
    hasPrefilledEmail || isSignup ? 'ready' : 'email'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleEmailContinue = useCallback(() => {
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setBiometricState('ready');
    setStatusMessage('');
  }, [email]);

  const handleAuthenticate = useCallback(async () => {
    if (!email.trim() && !isSignup) return;

    setBiometricState('waiting');
    setStatusMessage('Waiting for device verification…');
    setOverlayVisible(true);
    setOverlayStatus('loading');
    setOverlayMessage('Preparing biometric verification…');
    setErrorMessage('');

    try {
      // Step 1: Resolve userId from email
      const userResult = await createUserOrGet(email.trim().toLowerCase());
      if (!userResult.success || !userResult.user) {
        setBiometricState('failed');
        setStatusMessage(userResult.error || 'Could not find your account. Please try again.');
        setOverlayStatus('error');
        setErrorMessage(userResult.error || 'Failed to locate your account.');
        return;
      }

      const user = userResult.user;
      setOverlayMessage('Complete the verification shown by your device…');

      // Step 2: Run WebAuthn biometric ceremony
      // The browser/OS shows its own native dialog (fingerprint, Face ID, Windows Hello, etc.)
      // AuthX only receives the resulting cryptographic assertion — no biometric data.
      const result = await performBiometricAuthentication(user.id);

      if (result.success && result.session) {
        setBiometricState('success');
        setStatusMessage('Authentication successful');
        setOverlayStatus('success');
        setOverlayMessage('Biometric verified — signing you in…');

        setUser({ id: user.id, email: user.email, name: user.name });
        setSession(result.session.token);

        setTimeout(() => {
          setOverlayVisible(false);
          setPageView(isDemo ? 'demoDashboard' : 'dashboard');
        }, 1000);
        return;
      }

      // Handle specific error states from performBiometricAuthentication
      if (result.isCancelled) {
        setBiometricState('cancelled');
        setStatusMessage('Authentication was cancelled. You can try again or choose another method.');
        setOverlayStatus('error');
        setErrorMessage('Authentication was cancelled.');
        return;
      }

      if (result.code === 'NO_CREDENTIAL') {
        setBiometricState('no_credential');
        setStatusMessage('No biometric credential found for this account. Please register a passkey first, then use biometric login.');
        setOverlayStatus('error');
        setErrorMessage('No passkey registered. Please register a passkey first.');
        return;
      }

      // Generic failure
      setBiometricState('failed');
      setStatusMessage(result.error || 'Biometric authentication failed. Please try again.');
      setOverlayStatus('error');
      setErrorMessage(result.error || 'Biometric authentication failed.');
    } catch (err) {
      const mapped = mapWebAuthnError(err);
      setBiometricState(mapped.state);
      setStatusMessage(mapped.message);
      setOverlayStatus('error');
      setErrorMessage(mapped.message);
    }
  }, [email, isSignup, isDemo, setUser, setSession, setPageView]);

  const handleBack = useCallback(() => {
    setLoginEmailDraft(null);
    setAuthMethod('default');
  }, [setLoginEmailDraft, setAuthMethod]);

  const handleRetry = useCallback(() => {
    setBiometricState('ready');
    setStatusMessage('');
    setOverlayVisible(false);
    setOverlayStatus('loading');
    setErrorMessage('');
  }, []);

  const handleDismissOverlay = useCallback(() => {
    setOverlayVisible(false);
    setOverlayStatus('loading');
    if (biometricState === 'waiting') {
      setBiometricState('ready');
    }
  }, [biometricState]);

  /* State-specific UI config */
  const stateConfig: Record<BiometricState, { title: string; desc: string; actionLabel?: string; onAction?: () => void }> = {
    email: {
      title: 'Biometric Authentication',
      desc: 'Enter your email to continue with biometric verification.',
    },
    ready: {
      title: 'Verify your identity',
      desc: 'Use your device\'s fingerprint, Face ID, Windows Hello, or another supported device authenticator.',
      actionLabel: 'Authenticate with Device',
      onAction: handleAuthenticate,
    },
    waiting: {
      title: 'Waiting for device verification…',
      desc: 'Complete the verification shown by your device. Your biometric data stays on your device.',
    },
    success: {
      title: 'Authentication successful',
      desc: 'You have been verified. Signing you in…',
    },
    cancelled: {
      title: 'Authentication was cancelled',
      desc: 'You cancelled the device verification. You can try again or choose another method.',
      actionLabel: 'Try again',
      onAction: handleRetry,
    },
    failed: {
      title: 'Biometric authentication failed',
      desc: 'The verification was not successful. Please try again or use a different sign-in method.',
      actionLabel: 'Try again',
      onAction: handleRetry,
    },
    unavailable: {
      title: 'Biometric authentication isn\'t available',
      desc: 'Your device or browser doesn\'t support platform biometric authentication. Please use another sign-in method.',
    },
    no_credential: {
      title: 'No biometric credential registered',
      desc: 'To use biometric authentication, first register a passkey on this device, then sign in with the Biometric option.',
    },
    timeout: {
      title: 'Device verification timed out',
      desc: 'The verification request expired. Please try again.',
      actionLabel: 'Try again',
      onAction: handleRetry,
    },
  };

  const config = stateConfig[biometricState];

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
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          aria-label="Back to all authentication methods"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all methods
        </button>

        {/* Method header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center" aria-hidden="true">
            <Fingerprint className="w-5 h-5 text-success" />
          </div>
          <div>
            <span className="font-heading text-xl font-semibold text-foreground">
              Biometric Authentication
            </span>
            <p className="text-xs text-muted-foreground">Fingerprint · Face ID · Windows Hello · Device PIN</p>
          </div>
        </div>

        {/* Email input — only shown in 'email' state */}
        {biometricState === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="biometric-email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="biometric-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              disabled={isSignup || hasPrefilledEmail}
              readOnly={isSignup || hasPrefilledEmail}
              className="h-11 rounded-lg border-[#E5D7C3] focus:border-[#428475] focus:ring-2 focus:ring-[#428475]/20 bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
              aria-required="true"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'biometric-email-error' : undefined}
            />
            {emailError && (
              <p id="biometric-email-error" className="text-xs text-danger flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5" />
                {emailError}
              </p>
            )}
            <Button
              className="w-full h-11 rounded-lg bg-[#428475] text-white hover:bg-[#356B5F] transition-colors"
              disabled={!email.trim()}
              onClick={handleEmailContinue}
              aria-label="Continue with biometric authentication"
            >
              Continue
              <Fingerprint className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* State display — shown after email step */}
        {biometricState !== 'email' && (
          <div className="space-y-5">
            {/* Visual state indicator */}
            <StateIndicator state={biometricState} />

            {/* Status text */}
            <div className="text-center space-y-1.5 px-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {config.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {config.desc}
              </p>
            </div>

            {/* Status message (from error/cancel handling) */}
            {statusMessage && biometricState !== 'ready' && biometricState !== 'waiting' && biometricState !== 'success' && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  biometricState === 'cancelled' || biometricState === 'timeout'
                    ? 'bg-warning/5 border-warning/20 text-warning'
                    : biometricState === 'unavailable' || biometricState === 'no_credential'
                    ? 'bg-muted/30 border-border text-muted-foreground'
                    : 'bg-danger/5 border-danger/20 text-danger'
                }`}
                role="alert"
                aria-live="polite"
              >
                {statusMessage}
              </div>
            )}

            {/* Primary action button */}
            {config.actionLabel && config.onAction && (
              <Button
                className={`w-full h-11 rounded-lg font-semibold transition-colors ${
                  biometricState === 'ready'
                    ? 'bg-[#428475] text-white hover:bg-[#356B5F]'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                }`}
                onClick={config.onAction}
                disabled={biometricState === 'waiting'}
                aria-label={config.actionLabel}
              >
                {biometricState === 'waiting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Waiting for device…
                  </>
                ) : biometricState === 'ready' ? (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" aria-hidden="true" />
                    {config.actionLabel}
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                    {config.actionLabel}
                  </>
                )}
              </Button>
            )}

            {/* Alternative: use another method */}
            {(biometricState === 'unavailable' || biometricState === 'no_credential') && (
              <Button
                variant="outline"
                className="w-full h-10 rounded-lg text-sm"
                onClick={handleBack}
                aria-label="Use a different authentication method"
              >
                Use another sign-in method
              </Button>
            )}
          </div>
        )}

        {/* Privacy notice */}
        {(biometricState === 'ready' || biometricState === 'email') && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2" role="note">
            <Lock className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Your fingerprint or face data stays on your device. AuthX only receives a cryptographic proof — no biometric information is ever transmitted.
            </span>
          </div>
        )}
      </div>

      <AuthLoadingOverlay
        isVisible={overlayVisible}
        message={overlayMessage}
        status={overlayStatus}
        errorMessage={errorMessage}
        onDismiss={handleDismissOverlay}
      />
    </motion.div>
  );
}
