'use client';

import { useState, useCallback } from 'react';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateRecoveryKit } from '@/services/auth-client';

interface RecoveryKitStatus {
  configured: boolean;
  total: number;
  remaining: number;
}

interface RecoveryKitSectionProps {
  userId: string;
  status: RecoveryKitStatus | null;
  onStatusChange: (status: RecoveryKitStatus) => void;
}

/**
 * RecoveryKitSection
 *
 * Renders the Recovery Kit card inside Settings → Security Policies.
 * Manages generation, display (once), copy, download, confirm, and regenerate.
 *
 * Security:
 *  - Plaintext codes are only held in local React state during the display modal.
 *  - When the modal closes, codes are cleared from state.
 *  - Codes are NEVER stored in localStorage, sessionStorage, or cookies.
 *  - Codes are never sent to analytics or console.
 */
export function RecoveryKitSection({ userId, status, onStatusChange }: RecoveryKitSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [plaintextCodes, setPlaintextCodes] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await generateRecoveryKit(userId);
      if (res.success && res.codes && res.codes.length === 12) {
        setPlaintextCodes(res.codes);
        setConfirmed(false);
        setCopied(false);
        setShowCodesModal(true);
        setShowConfirmRegenerate(false);
      } else {
        setError(res.error || 'Failed to generate recovery codes. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [userId]);

  const handleConfirm = () => {
    // Update status to configured — 12 of 12 remaining
    onStatusChange({ configured: true, total: 12, remaining: 12 });
    // Clear plaintext codes from state — they are gone
    setShowCodesModal(false);
    setTimeout(() => {
      setPlaintextCodes([]);
      setConfirmed(false);
      setCopied(false);
    }, 300);
  };

  const handleCopy = async () => {
    const text = plaintextCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = [
      'AuthX Recovery Kit',
      '==================',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Your 12 recovery codes (each is single-use):',
      '',
      ...plaintextCodes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`),
      '',
      'IMPORTANT:',
      '- Store these codes in a safe, offline location.',
      '- Each code can only be used ONCE.',
      '- If you regenerate your Recovery Kit, these codes become invalid.',
      '- Never share these codes with anyone.',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'authx-recovery-kit.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const content = `
      <html><head><title>AuthX Recovery Kit</title>
      <style>
        body { font-family: monospace; padding: 40px; max-width: 500px; margin: 0 auto; }
        h1 { font-size: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .code { font-size: 18px; letter-spacing: 2px; margin: 8px 0; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; }
        .warning { margin-top: 24px; font-size: 12px; color: #666; border: 1px solid #e5e5e5; padding: 12px; border-radius: 4px; }
      </style></head><body>
        <h1>AuthX Recovery Kit</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p><strong>Store these codes safely. Each can only be used ONCE.</strong></p>
        ${plaintextCodes.map((c) => `<div class="code">${c}</div>`).join('')}
        <div class="warning">
          <strong>IMPORTANT:</strong> Keep these codes offline and secure.<br>
          Never share them. If you regenerate your Recovery Kit, these become invalid.
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
      win.print();
    }
  };

  const isConfigured = status?.configured ?? false;
  const total = status?.total ?? 0;
  const remaining = status?.remaining ?? 0;

  return (
    <>
      {/* Recovery Kit Card */}
      <div className="border-t border-border pt-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isConfigured ? 'bg-success/10 border-success/20' : 'bg-muted/40 border-border/60'}`}>
              {isConfigured ? (
                <ShieldCheck className="w-5 h-5 text-success" />
              ) : (
                <KeyRound className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">Recovery Kit</p>
                {isConfigured && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-[10px]">
                    Configured
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {isConfigured
                  ? `${remaining} of ${total} backup codes remaining`
                  : 'Backup codes for account recovery if you lose all other access methods.'}
              </p>
            </div>
          </div>

          {!isConfigured && !showConfirmRegenerate && (
            <Badge variant="outline" className="text-muted-foreground text-xs shrink-0">
              Not Configured
            </Badge>
          )}
        </div>

        {/* Configured state */}
        {isConfigured ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-success/5 border border-success/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Recovery Kit Active
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {remaining} of {total} codes remaining · Keep them stored somewhere secure.
                  </p>
                </div>
              </div>

              {remaining < 4 && remaining > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-warning mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Only {remaining} code{remaining !== 1 ? 's' : ''} left. Consider regenerating your Recovery Kit soon.</span>
                </div>
              )}

              {remaining === 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-danger mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>All codes used. Regenerate your Recovery Kit to restore backup access.</span>
                </div>
              )}
            </div>

            {/* Regenerate */}
            {!showConfirmRegenerate ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs border-border hover:border-warning/50 hover:text-warning hover:bg-warning/5"
                onClick={() => setShowConfirmRegenerate(true)}
                disabled={generating}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate Recovery Kit
              </Button>
            ) : (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Regenerate Recovery Kit?</p>
                    <p className="text-muted-foreground mt-0.5">
                      This will <strong>permanently invalidate</strong> all your current recovery codes.
                      You will receive 12 new codes to save.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => setShowConfirmRegenerate(false)}
                    disabled={generating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg text-xs bg-warning/90 hover:bg-warning text-warning-foreground"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Regenerating…</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Yes, Regenerate</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Not configured state */
          <div className="space-y-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground text-xs">Generate 12 Backup Recovery Codes</p>
                <p className="text-muted-foreground text-[11px]">
                  Create a set of one-time backup codes in case you lose access to your other authentication methods.
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-xl h-9 px-4 text-xs font-semibold shrink-0 ml-3"
              >
                {generating ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    Generate Recovery Kit
                  </>
                )}
              </Button>
            </div>

            {error && !showCodesModal && (
              <p className="text-xs text-danger font-medium">{error}</p>
            )}
          </div>
        )}

        {/* Info callout */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            Recovery codes let you regain access if you lose all other authentication methods.
            Store them <strong>offline</strong> in a secure location.
          </span>
        </div>
      </div>

      {/* ── CODES DISPLAY MODAL ── */}
      {showCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Modal header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-success" />
                    </div>
                    <h2 className="font-heading text-base font-bold text-foreground">Your Recovery Kit</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Save these codes somewhere secure. Each code can only be used <strong>once</strong>.
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/5 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  <strong>These codes will only be shown once.</strong> After you close this window,
                  they cannot be retrieved — only regenerated.
                </p>
              </div>

              {/* Codes grid */}
              <div className="grid grid-cols-2 gap-2">
                {plaintextCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/60"
                  >
                    <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="font-mono text-sm font-semibold text-foreground tracking-wider">{code}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs flex-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-success" />Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy All</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs flex-1"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs flex-1"
                  onClick={handlePrint}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print
                </Button>
              </div>

              {/* Confirm button */}
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    I have saved my recovery codes in a secure location.
                  </span>
                </label>

                <Button
                  className="w-full h-10 rounded-xl text-sm font-semibold"
                  disabled={!confirmed}
                  onClick={handleConfirm}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I've Saved My Codes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
