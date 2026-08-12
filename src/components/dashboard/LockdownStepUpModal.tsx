'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startAuthentication } from '@simplewebauthn/browser';

/* ── Types ── */
type FlowStep = 'warning' | 'method-select' | 'verify-totp' | 'verify-passkey' | 'verify-recovery' | 'final-confirm' | 'success';
type StepUpMethod = 'totp' | 'passkey' | 'recovery';

export interface AvailableMethods {
  totp: boolean;
  passkey: boolean;
  recovery: boolean;
}

interface LockdownStepUpModalProps {
  /** The currently active session token — used server-side to derive the user */
  sessionToken: string;
  availableMethods: AvailableMethods;
  onClose: () => void;
  /** Called after successful execution — receives number of revoked sessions */
  onSuccess: (revokedCount: number) => void;
}

/**
 * LockdownStepUpModal
 *
 * Full Emergency Lockdown flow with step-up authentication:
 *   Warning → Method Selection → Verification → Final Confirm → Execution
 *
 * Security:
 *  - sessionToken is sent to backend which derives the user identity (never trust client userId)
 *  - stepUpToken is a short-lived (5-min), scoped, single-use server-issued token
 *  - Backend enforces ALL security checks independently
 *  - Frontend never trusts its own "verified" state for authorization
 *  - Only TOTP, Passkey, and Recovery Code are permitted
 */
export function LockdownStepUpModal({
  sessionToken,
  availableMethods,
  onClose,
  onSuccess,
}: LockdownStepUpModalProps) {
  const [step, setStep] = useState<FlowStep>('warning');
  const [selectedMethod, setSelectedMethod] = useState<StepUpMethod | null>(null);

  // TOTP state
  const [totpCode, setTotpCode] = useState('');

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Recovery code state
  const [recoveryCode, setRecoveryCode] = useState('');

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [stepUpMethod, setStepUpMethod] = useState('');
  const [revokedCount, setRevokedCount] = useState(0);

  const hasAnyMethod = availableMethods.totp || availableMethods.passkey || availableMethods.recovery;

  /* ── Helpers ── */
  const clearError = () => setError('');

  const handleRecoveryCodeChange = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    setRecoveryCode(clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean);
    clearError();
  };

  /* ── Step-up verifiers ── */

  const verifyTotp = useCallback(async () => {
    if (!totpCode || !/^\d{6}$/.test(totpCode)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/lockdown/stepup/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, token: totpCode }),
        cache: 'no-store',
      });
      const data = (await res.json()) as { success?: boolean; error?: string; stepUpToken?: string; method?: string; code?: string };

      if (data.success && data.stepUpToken) {
        setStepUpToken(data.stepUpToken);
        setStepUpMethod(data.method || 'Authenticator App (TOTP)');
        setStep('final-confirm');
      } else {
        setError(
          data.code === 'RATE_LIMIT_EXCEEDED'
            ? 'Too many attempts. Please wait 5 minutes before trying again.'
            : data.code === 'NOT_CONFIGURED' || data.code === 'NOT_ENABLED'
            ? 'Authenticator App is not configured. Please use another method.'
            : data.error || 'Invalid code. Please check your authenticator app.'
        );
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken, totpCode]);

  const verifyPasskey = useCallback(async () => {
    setPasskeyLoading(true);
    clearError();
    try {
      // Step 1: get challenge
      const challengeRes = await fetch('/api/lockdown/stepup/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, action: 'challenge' }),
        cache: 'no-store',
      });
      const challengeData = (await challengeRes.json()) as { success?: boolean; options?: unknown; error?: string; code?: string };

      if (!challengeData.success || !challengeData.options) {
        setError(
          challengeData.code === 'NO_PASSKEY'
            ? 'No passkey registered for this account.'
            : challengeData.error || 'Failed to start passkey authentication.'
        );
        return;
      }

      // Step 2: browser WebAuthn ceremony
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: challengeData.options as Parameters<typeof startAuthentication>[0]['optionsJSON'] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('cancel') || msg.includes('abort') || msg.includes('NotAllowed')) {
          setError('Passkey authentication was cancelled.');
        } else {
          setError('Passkey authentication failed. Please try again.');
        }
        return;
      }

      // Step 3: verify assertion
      const verifyRes = await fetch('/api/lockdown/stepup/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, action: 'verify', credential: assertion }),
        cache: 'no-store',
      });
      const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string; stepUpToken?: string; method?: string };

      if (verifyData.success && verifyData.stepUpToken) {
        setStepUpToken(verifyData.stepUpToken);
        setStepUpMethod(verifyData.method || 'Passkey');
        setStep('final-confirm');
      } else {
        setError(verifyData.error || 'Passkey verification failed. Please try again.');
      }
    } catch {
      setError('Passkey authentication failed. Please try again.');
    } finally {
      setPasskeyLoading(false);
    }
  }, [sessionToken]);

  const verifyRecovery = useCallback(async () => {
    const trimmed = recoveryCode.trim();
    if (!trimmed || trimmed.replace('-', '').length < 8) {
      setError('Please enter a valid 8-character recovery code.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/lockdown/stepup/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, recoveryCode: trimmed }),
        cache: 'no-store',
      });
      const data = (await res.json()) as { success?: boolean; error?: string; stepUpToken?: string; method?: string; code?: string };

      if (data.success && data.stepUpToken) {
        setStepUpToken(data.stepUpToken);
        setStepUpMethod(data.method || 'Recovery Code');
        setStep('final-confirm');
      } else {
        setError(
          data.code === 'NO_CODES_REMAINING'
            ? 'All recovery codes used. Please regenerate your Recovery Kit.'
            : data.code === 'RATE_LIMIT_EXCEEDED'
            ? 'Too many attempts. Please wait before trying again.'
            : 'Invalid recovery code. Please check and try again.'
        );
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken, recoveryCode]);

  /* ── Execute Lockdown ── */
  const executeLockdown = useCallback(async () => {
    if (!stepUpToken) {
      setError('Authorization expired. Please verify your identity again.');
      setStep('method-select');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/lockdown/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, stepUpToken }),
        cache: 'no-store',
      });
      const data = (await res.json()) as { success?: boolean; error?: string; revokedCount?: number; code?: string };

      if (data.success) {
        setRevokedCount(data.revokedCount ?? 0);
        setStep('success');
        onSuccess(data.revokedCount ?? 0);
      } else {
        if (data.code === 'INVALID_STEPUP') {
          setError('Step-up authorization expired. Please verify your identity again.');
          setStepUpToken('');
          setStep('method-select');
        } else {
          setError(data.error || 'Emergency Lockdown failed. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken, stepUpToken, onSuccess]);

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ── STEP: Warning ── */}
        {step === 'warning' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-danger" />
                </div>
                <h2 className="font-heading text-base font-bold text-foreground">Emergency Lockdown</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-danger/5 border border-danger/20 space-y-2">
              <p className="text-sm font-semibold text-danger">⚠ High-Impact Security Action</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will immediately terminate <strong>all other active sessions</strong> on your account.
                Your current session will remain active.
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Sessions that will be revoked:</p>
              <ul className="space-y-1 pl-4">
                {['Other laptops and desktops', 'Other phones and tablets', 'Other browsers', 'All remote active sessions'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                For your security, you must verify your identity before this action can be executed.
                This event will be recorded in your security history.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs bg-danger hover:bg-danger/90 text-white"
                onClick={() => setStep('method-select')}
              >
                Continue to Verification
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Method Selection ── */}
        {step === 'method-select' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setStep('warning')} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="font-heading text-base font-bold text-foreground">Verify Your Identity</h2>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              For your security, verify your identity before activating Emergency Lockdown.
            </p>

            {!hasAnyMethod && (
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 space-y-2">
                <p className="text-xs font-semibold text-warning">No Verification Methods Available</p>
                <p className="text-xs text-muted-foreground">
                  Emergency Lockdown requires one of: Authenticator App, Passkey, or Recovery Code.
                  Please configure at least one of these methods in Security Policies.
                </p>
              </div>
            )}

            {hasAnyMethod && (
              <div className="space-y-3">
                {/* TOTP — RECOMMENDED */}
                <button
                  onClick={() => { setSelectedMethod('totp'); setStep('verify-totp'); setTotpCode(''); clearError(); }}
                  disabled={!availableMethods.totp}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    availableMethods.totp
                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 cursor-pointer'
                      : 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">Authenticator App</p>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5">RECOMMENDED</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {availableMethods.totp ? 'Use the 6-digit code from your authenticator app.' : 'Not configured — set up in Security Policies first.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Passkey */}
                <button
                  onClick={() => { setSelectedMethod('passkey'); setStep('verify-passkey'); clearError(); }}
                  disabled={!availableMethods.passkey}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    availableMethods.passkey
                      ? 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                      : 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Passkey</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {availableMethods.passkey ? 'Use your registered hardware security key.' : 'No passkey registered for this account.'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Recovery Code */}
                <button
                  onClick={() => { setSelectedMethod('recovery'); setStep('verify-recovery'); setRecoveryCode(''); clearError(); }}
                  disabled={!availableMethods.recovery}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    availableMethods.recovery
                      ? 'border-border hover:border-warning/40 hover:bg-warning/5 cursor-pointer'
                      : 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Recovery Code</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {availableMethods.recovery ? 'Use an unused code from your Recovery Kit.' : 'Recovery Kit not configured.'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full rounded-xl h-9 text-xs" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}

        {/* ── STEP: Verify TOTP ── */}
        {step === 'verify-totp' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setStep('method-select'); clearError(); }} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">Authenticator App</h2>
                <p className="text-[11px] text-muted-foreground">Step-up verification</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && verifyTotp()}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                autoFocus
                autoComplete="one-time-code"
                disabled={loading}
                maxLength={6}
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Enter the current 6-digit code from your authenticator app.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" onClick={() => { setStep('method-select'); clearError(); }} disabled={loading}>
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs"
                onClick={verifyTotp}
                disabled={totpCode.length !== 6 || loading}
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Verifying…</> : 'Verify'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Verify Passkey ── */}
        {step === 'verify-passkey' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setStep('method-select'); clearError(); }} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">Passkey Verification</h2>
                <p className="text-[11px] text-muted-foreground">Step-up verification</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Hardware Passkey Required</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  A fresh WebAuthn authentication ceremony is required. Touch your security key or use biometrics when prompted.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" onClick={() => { setStep('method-select'); clearError(); }} disabled={passkeyLoading}>
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs"
                onClick={verifyPasskey}
                disabled={passkeyLoading}
              >
                {passkeyLoading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Authenticating…</> : 'Authenticate with Passkey'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Verify Recovery Code ── */}
        {step === 'verify-recovery' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => { setStep('method-select'); clearError(); }} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">Recovery Code</h2>
                <p className="text-[11px] text-muted-foreground">Step-up verification</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-[11px] text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
              <span>This will permanently consume one recovery code from your Recovery Kit.</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Recovery Code</label>
              <input
                type="text"
                placeholder="XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => handleRecoveryCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && verifyRecovery()}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-center font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={9}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" onClick={() => { setStep('method-select'); clearError(); }} disabled={loading}>
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs"
                onClick={verifyRecovery}
                disabled={recoveryCode.replace('-', '').length < 8 || loading}
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Verifying…</> : 'Verify Code'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Final Confirmation ── */}
        {step === 'final-confirm' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-danger" />
              </div>
              <h2 className="font-heading text-base font-bold text-foreground">Activate Emergency Lockdown</h2>
            </div>

            <div className="p-3 rounded-xl bg-success/5 border border-success/20 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span className="text-success font-medium">Identity verified via {stepUpMethod}</span>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <p className="text-foreground font-medium">You are about to terminate all other active sessions:</p>
              <ul className="space-y-1.5 pl-2">
                {['Other laptops and desktops', 'Other phones and tablets', 'Other browsers', 'All remote active sessions'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger/70 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] leading-relaxed border-t border-border pt-3">
                Your current verified session will remain active. This action is <strong>irreversible</strong> and will be permanently recorded in your security history.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs bg-danger hover:bg-danger/90 text-white"
                onClick={executeLockdown}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Executing…</>
                  : 'Activate Lockdown'
                }
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-success" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Emergency Lockdown Activated</h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {revokedCount > 0
                  ? `${revokedCount} other active session${revokedCount !== 1 ? 's were' : ' was'} successfully revoked.`
                  : 'No other active sessions were found.'
                }
                {' '}Your current session remains active.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground text-left space-y-1">
              <p className="font-semibold text-foreground">What happened:</p>
              <ul className="space-y-0.5 pl-3">
                <li>✓ Identity verified via {stepUpMethod}</li>
                <li>✓ {revokedCount} session{revokedCount !== 1 ? 's' : ''} revoked</li>
                <li>✓ Event recorded in security history</li>
                <li>✓ Security alert email sent</li>
              </ul>
            </div>

            <Button className="w-full rounded-xl h-10 text-sm" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
