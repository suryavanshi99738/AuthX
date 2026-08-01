'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Laptop,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  KeyRound,
  Mail,
  Loader2,
  Smartphone,
  SmartphoneNfc,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  getQRRequestInfo,
  approveQRRequest,
  signupCheck,
  performPasskeyAuthentication,
  generateOTP,
  verifyOTP,
  trustDevice,
  UserMethods,
} from '@/services/auth-client';
import { OTPAuthForm } from '@/components/auth/OTPAuthForm';
import { useAuth } from '@/hooks/useAuth';

function QRApproveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestId = searchParams.get('requestId');
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [requestInfo, setRequestInfo] = useState<{
    status: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Authentication & Approval State
  const [email, setEmail] = useState(currentUser?.email || '');
  const [userMethods, setUserMethods] = useState<UserMethods | null>(null);
  const [step, setStep] = useState<'info' | 'auth_method' | 'otp_verify' | 'approved' | 'rejected' | 'expired'>('info');
  const [authMethodSelected, setAuthMethodSelected] = useState<'passkey' | 'otp' | null>(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Processing & Trust Device Modal State
  const [approving, setApproving] = useState(false);
  const [approvedUser, setApprovedUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [showTrustPopup, setShowTrustPopup] = useState(false);
  const [trustSuccess, setTrustSuccess] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      if (!requestId) {
        setErrorMsg('Invalid approval link. Missing request ID.');
        setLoading(false);
        return;
      }

      const res = await getQRRequestInfo(requestId);
      if (!res.success) {
        setErrorMsg(res.error || 'QR login request expired or not found.');
        setStep('expired');
      } else {
        setRequestInfo(res);
        if (res.status === 'expired') {
          setStep('expired');
        }
      }
      setLoading(false);
    }
    loadInfo();
  }, [requestId]);

  const handleContinueWithEmail = async () => {
    setErrorMsg('');
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const checkRes = await signupCheck(targetEmail);
      if (!checkRes.success || !checkRes.exists) {
        setErrorMsg('No registered account found with this email. Please sign up on Desktop.');
        setLoading(false);
        return;
      }

      if (checkRes.methods) {
        setUserMethods(checkRes.methods);
      }
      setStep('auth_method');
    } catch {
      setErrorMsg('Could not verify account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAuthMethod = async (method: 'passkey' | 'otp') => {
    setErrorMsg('');
    setAuthMethodSelected(method);

    if (method === 'passkey') {
      setLoading(true);
      try {
        const checkRes = await signupCheck(email.trim().toLowerCase());
        if (!checkRes.userId) {
          setErrorMsg('User not found.');
          setLoading(false);
          return;
        }

        const passkeyRes = await performPasskeyAuthentication(checkRes.userId);
        if (!passkeyRes.success) {
          setErrorMsg(passkeyRes.error || 'Passkey verification failed.');
          setLoading(false);
          return;
        }

        // Passkey verified! Proceed to approve QR request
        await executeApproval('approve', checkRes.userId);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Passkey error.');
      } finally {
        setLoading(false);
      }
    } else if (method === 'otp') {
      setOtpLoading(true);
      try {
        const otpGenRes = await generateOTP(email.trim().toLowerCase());
        if (!otpGenRes.success) {
          setErrorMsg(otpGenRes.error || 'Failed to send OTP code.');
        } else {
          setOtpSent(true);
          setStep('otp_verify');
        }
      } catch {
        setErrorMsg('Failed to send OTP code.');
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleVerifyOTPAndApprove = async () => {
    setOtpError('');
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError('Please enter a valid 6-digit code.');
      return;
    }

    setOtpLoading(true);
    try {
      const verifyRes = await verifyOTP(email.trim().toLowerCase(), otpCode);
      if (!verifyRes.success || !verifyRes.userId) {
        setOtpError(verifyRes.error || 'Invalid or expired OTP code.');
        setOtpLoading(false);
        return;
      }

      await executeApproval('approve', verifyRes.userId);
    } catch {
      setOtpError('OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const executeApproval = async (action: 'approve' | 'reject', userId?: string) => {
    if (!requestId) return;
    setApproving(true);

    const mobileAgent = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(mobileAgent);
    const mobileDevice = isIOS ? 'iPhone (Safari)' : 'Android Phone (Chrome)';

    try {
      const res = await approveQRRequest(requestId, email.trim().toLowerCase(), action, mobileDevice);
      if (res.success && res.status === 'approved') {
        setStep('approved');
        if (res.user) {
          setApprovedUser(res.user);
        }
        // Show trust device prompt
        setShowTrustPopup(true);
      } else if (res.status === 'rejected') {
        setStep('rejected');
      } else {
        setErrorMsg(res.error || 'Approval failed.');
      }
    } catch {
      setErrorMsg('Approval request failed.');
    } finally {
      setApproving(false);
    }
  };

  const handleTrustDevice = async (trust: boolean) => {
    setShowTrustPopup(false);
    if (!trust || !approvedUser) return;

    try {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const deviceName = isIOS ? 'iPhone Mobile' : 'Android Mobile';
      const browser = /safari/i.test(navigator.userAgent) ? 'Safari' : 'Chrome';

      await trustDevice(approvedUser.id, deviceName, browser, `fingerprint_${Date.now()}`);
      setTrustSuccess(true);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading QR Login details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Header Branding */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold">BankShield Auth</span>
        </div>

        {/* Expired State */}
        {step === 'expired' && (
          <Card className="shadow-card border-warning/30">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Request Expired</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  This QR login request has expired or was already used (60s limit). Please scan a new QR code from your Desktop.
                </p>
              </div>
              <Button onClick={() => router.push('/')} className="w-full rounded-xl h-11">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Approved State */}
        {step === 'approved' && (
          <Card className="shadow-card border-success/30">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Authentication Successful!</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your Windows Laptop has been authenticated and redirected to the Dashboard.
                </p>
              </div>

              {trustSuccess && (
                <div className="p-3 rounded-xl bg-success/10 text-success text-xs flex items-center gap-2 w-full">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>This device is now trusted for future approvals.</span>
                </div>
              )}

              <Button onClick={() => router.push('/')} variant="outline" className="w-full rounded-xl h-11">
                Done
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Rejected State */}
        {step === 'rejected' && (
          <Card className="shadow-card border-danger/30">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Request Declined</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  The login request was rejected. The laptop session was not created.
                </p>
              </div>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full rounded-xl h-11">
                Close
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Info & Enter Email */}
        {step === 'info' && requestInfo && (
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <Badge variant="outline" className="text-primary text-[10px]">QR Login Approval</Badge>
                <h2 className="font-heading text-xl font-bold text-foreground">Approve Login Request</h2>
                <p className="text-xs text-muted-foreground">
                  A device on your local network is requesting access to your account.
                </p>
              </div>

              {/* Request Metadata Card */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Laptop className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{requestInfo.deviceInfo || 'Windows Laptop'}</p>
                    <p className="text-[11px] text-muted-foreground">Requesting Device</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" />
                    <span>IP: {requestInfo.ipAddress || '10.17.87.25'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires: 60s TTL</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-danger" role="alert">{errorMsg}</p>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="qr-email" className="text-xs font-medium">Your Account Email</Label>
                <Input
                  id="qr-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => executeApproval('reject')}
                  variant="outline"
                  disabled={approving}
                  className="flex-1 rounded-xl h-11 text-danger hover:text-danger hover:bg-danger/10"
                >
                  Reject
                </Button>

                <Button
                  onClick={handleContinueWithEmail}
                  disabled={!email.trim() || approving}
                  className="flex-1 rounded-xl h-11"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Auth Method */}
        {step === 'auth_method' && userMethods && (
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-foreground">Authenticate to Approve</h2>
                <p className="text-xs text-muted-foreground">
                  Confirm your identity for <span className="font-medium text-foreground">{email}</span>.
                </p>
              </div>

              {errorMsg && (
                <p className="text-xs text-danger" role="alert">{errorMsg}</p>
              )}

              <div className="space-y-2">
                {/* Email OTP Option */}
                <button
                  onClick={() => handleSelectAuthMethod('otp')}
                  disabled={otpLoading}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-smooth text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email OTP</p>
                      <p className="text-[11px] text-muted-foreground">Send 6-digit verification code</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">Available</Badge>
                </button>

                {/* Passkey Option */}
                <button
                  onClick={() => handleSelectAuthMethod('passkey')}
                  disabled={!userMethods.passkey}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-smooth text-left ${
                    userMethods.passkey
                      ? 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                      : 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Passkey</p>
                      <p className="text-[11px] text-muted-foreground">
                        {userMethods.passkey ? 'Device Biometrics / PIN' : 'Not registered for account'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={userMethods.passkey ? 'bg-success/10 text-success text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                    {userMethods.passkey ? 'Available' : 'Not registered'}
                  </Badge>
                </button>
              </div>

              <Button onClick={() => setStep('info')} variant="ghost" className="w-full text-xs text-muted-foreground">
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Enter OTP */}
        {step === 'otp_verify' && (
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-foreground">Enter Verification Code</h2>
                <p className="text-xs text-muted-foreground">
                  We emailed a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                </p>
              </div>

              {otpError && (
                <p className="text-xs text-danger" role="alert">{otpError}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="qr-otp-input" className="text-xs font-medium">6-Digit Code</Label>
                <Input
                  id="qr-otp-input"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  className="h-12 rounded-xl text-center text-lg tracking-widest font-mono"
                />
              </div>

              <Button
                onClick={handleVerifyOTPAndApprove}
                disabled={otpCode.length !== 6 || otpLoading || approving}
                className="w-full rounded-xl h-11"
              >
                {otpLoading || approving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying & Approving…
                  </>
                ) : (
                  'Verify & Approve Login'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trust This Device Popup Modal */}
      {showTrustPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-card rounded-2xl border border-border p-6 shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <SmartphoneNfc className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Trust this device for future approvals?</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Saving this mobile phone as a trusted device enables faster 1-tap approvals.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleTrustDevice(false)} variant="outline" className="flex-1 rounded-xl h-10 text-xs">
                Not Now
              </Button>
              <Button onClick={() => handleTrustDevice(true)} className="flex-1 rounded-xl h-10 text-xs">
                Trust Device
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function QRApprovePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading Approval Page...</p>
      </div>
    }>
      <QRApproveContent />
    </Suspense>
  );
}
