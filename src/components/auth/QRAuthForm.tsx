'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, RefreshCw, Loader2, ShieldCheck, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { generateQRRequest, checkQRStatus } from '@/services/auth-client';
import { AuthLoadingOverlay } from './AuthLoadingOverlay';
import { StatusBadge } from '@/components/ui/status-badge';

export function QRAuthForm() {
  const { setUser, setSession, setPageView, setAuthMethod, isDemo } = useAuth();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'rejected' | 'expired'>('loading');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [overlayMessage, setOverlayMessage] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all intervals/timers on unmount
  const stopTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const createQR = async () => {
    stopTimers();
    setStatus('loading');
    setTimeLeft(60);
    setRequestId(null);
    setQrUrl('');

    try {
      const res = await generateQRRequest('Windows Laptop (Chrome)');
      if (res.success && res.requestId && res.qrUrl) {
        setRequestId(res.requestId);
        setQrUrl(res.qrUrl);
        setStatus('pending');

        // Start 60s countdown timer
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              stopTimers();
              setStatus('expired');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Start 2s polling timer
        pollRef.current = setInterval(async () => {
          if (!res.requestId) return;
          const statusRes = await checkQRStatus(res.requestId);
          if (statusRes.success && statusRes.status) {
            if (statusRes.status === 'approved' && statusRes.sessionToken && statusRes.user) {
              stopTimers();
              setStatus('approved');
              setOverlayVisible(true);
              setOverlayStatus('success');
              setOverlayMessage('Mobile Approval Verified! Logged in.');

              setUser({
                id: statusRes.user.id,
                email: statusRes.user.email,
                name: statusRes.user.name,
              });
              setSession(statusRes.sessionToken);

              setTimeout(() => {
                setOverlayVisible(false);
                setPageView(isDemo ? 'demoDashboard' : 'dashboard');
              }, 1000);
            } else if (statusRes.status === 'rejected') {
              stopTimers();
              setStatus('rejected');
            } else if (statusRes.status === 'expired') {
              stopTimers();
              setStatus('expired');
            }
          }
        }, 2000);
      } else {
        setStatus('expired');
      }
    } catch {
      setStatus('expired');
    }
  };

  useEffect(() => {
    createQR();
    return () => {
      stopTimers();
    };
  }, []);

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
          onClick={() => { stopTimers(); setAuthMethod('default'); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all methods
        </button>

        {/* Method header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">QR Code Authentication</span>
          </div>

          {status === 'pending' && (
            <StatusBadge variant="neutral">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {timeLeft}s
            </StatusBadge>
          )}
        </div>

        {/* QR Code Card Display */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[260px]">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Generating secure QR code...</p>
            </div>
          )}

          {status === 'pending' && qrUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-border">
                <QRCodeSVG
                  value={qrUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span>Waiting for mobile approval...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Open the app or camera on your mobile phone to scan.
                </p>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-1">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <StatusBadge variant="warning">QR Request Expired</StatusBadge>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                QR codes expire after 60 seconds to ensure strict security.
              </p>
              <Button onClick={createQR} className="mt-2 rounded-lg h-10 px-4 gap-2 bg-primary">
                <RefreshCw className="w-4 h-4" />
                Generate New QR Code
              </Button>
            </div>
          )}

          {status === 'rejected' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center mb-1">
                <Lock className="w-6 h-6 text-danger" />
              </div>
              <StatusBadge variant="danger">Approval Rejected</StatusBadge>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                The login request was declined on the mobile device.
              </p>
              <Button onClick={createQR} className="mt-2 rounded-lg h-10 px-4 gap-2 bg-primary">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {status === 'approved' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-1">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <StatusBadge variant="success">Authentication Approved!</StatusBadge>
            </div>
          )}
        </div>

        {/* Security hint */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
          <Lock className="w-3.5 h-3.5" />
          <span>One-time request (60s TTL). No credentials stored in QR.</span>
        </div>
      </div>

      <AuthLoadingOverlay
        isVisible={overlayVisible}
        message={overlayMessage}
        status={overlayStatus}
        onDismiss={() => setOverlayVisible(false)}
      />
    </motion.div>
  );
}
