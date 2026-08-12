'use client';

import { useState } from 'react';
import {
  Shield,
  ArrowLeft,
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { signupCheck, verifyRecoveryCode } from '@/services/auth-client';
import { getClientHints } from '@/lib/device-id';

type Step = 'email' | 'code';

/**
 * RecoveryAuthForm
 *
 * Two-step recovery code authentication:
 *  1. User enters their email address (to identify which account's codes to check)
 *  2. User enters one of their unused recovery codes
 *
 * Calls /api/recovery/verify, creates session through the existing pipeline,
 * and navigates to dashboard on success.
 */
export function RecoveryAuthForm() {
  const { setAuthMethod, setUser, setSession, setPageView, loginEmailDraft } = useAuth();

  const [step, setStep] = useState<Step>(loginEmailDraft ? 'code' : 'email');
  const [email, setEmail] = useState(loginEmailDraft ?? '');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Resolve email → userId
  const handleEmailContinue = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await signupCheck(trimmedEmail);
      if (!res.success) {
        setError('Unable to verify email. Please try again.');
        return;
      }
      if (!res.exists || !res.userId) {
        setError('No account found with this email address.');
        return;
      }
      setUserId(res.userId as string);
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify recovery code
  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.replace('-', '').length < 8) {
      setError('Please enter a valid recovery code.');
      return;
    }
    if (!userId) {
      setError('Session expired. Please go back and enter your email again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const clientHints = getClientHints();
      const res = await verifyRecoveryCode(userId, trimmed, clientHints);

      if (res.success && res.verified && res.session && res.user) {
        setUser({ id: res.user.id, email: res.user.email, name: res.user.name ?? null });
        setSession(res.session.token);
        setPageView('dashboard');
      } else {
        const code = res.error;
        setError(
          code === 'RATE_LIMIT_EXCEEDED'
            ? 'Too many attempts. Please wait before trying again.'
            : code === 'NO_CODES_REMAINING'
            ? 'All recovery codes used. Please regenerate your Recovery Kit if you have another access method.'
            : 'Invalid recovery code. Check your code and try again.'
        );
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    setCode(clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean);
    setError('');
  };

  const handleBack = () => {
    if (step === 'code' && !loginEmailDraft) {
      setStep('email');
      setCode('');
      setError('');
    } else {
      setAuthMethod('default');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Recovery Code</p>
            <p className="text-[11px] text-muted-foreground">
              {step === 'email' ? 'Step 1 of 2 — Identify your account' : 'Step 2 of 2 — Enter backup code'}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Email */}
      {step === 'email' && (
        <>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the email address associated with your account to locate your Recovery Kit.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recovery-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="recovery-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleEmailContinue()}
                className="h-11 rounded-lg pl-10"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger leading-relaxed">{error}</p>
            </div>
          )}

          <Button
            className="w-full h-11 rounded-lg"
            disabled={!email.trim() || loading}
            onClick={handleEmailContinue}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking…</>
            ) : (
              'Continue'
            )}
          </Button>
        </>
      )}

      {/* Step 2: Recovery Code */}
      {step === 'code' && (
        <>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter one of your unused Recovery Kit codes. Each code can only be used <strong>once</strong>.
            </p>
            {email && (
              <p className="text-[11px] text-muted-foreground">
                Account: <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recovery-code" className="text-sm font-medium">
              Recovery Code
            </Label>
            <Input
              id="recovery-code"
              type="text"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleVerify()}
              className="h-11 rounded-lg text-center font-mono tracking-widest text-base uppercase"
              disabled={loading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={9}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger leading-relaxed">{error}</p>
            </div>
          )}

          <Button
            className="w-full h-11 rounded-lg"
            disabled={code.replace('-', '').length < 8 || loading}
            onClick={handleVerify}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
            ) : (
              <><Shield className="w-4 h-4 mr-2" />Verify Recovery Code</>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Recovery codes are single-use. Regenerate your Recovery Kit in Settings after use.
          </p>
        </>
      )}
    </div>
  );
}
