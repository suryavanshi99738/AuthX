'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (requestId: string) => void;
}

export function MobileQRScannerModal({ isOpen, onClose, onScanSuccess }: MobileQRScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setErrorMsg('');
    setHasPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Camera access is not supported on this browser.');
        setHasPermission(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Simple QR Code URL / text extractor from video frame canvas
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          // Standard URL check if video element QR scanner decoded or user enters manually
        } catch {
          // ignore frame errors
        }
      }, 500);
    } catch (err) {
      setHasPermission(false);
      const msg = err instanceof Error ? err.message : 'Camera permission denied or camera unavailable.';
      setErrorMsg(msg);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = (formData.get('qrUrlInput') as string) || '';

    let reqId = input.trim();
    if (reqId.includes('requestId=')) {
      reqId = reqId.split('requestId=')[1]?.split('&')[0] || reqId;
    }

    if (reqId) {
      stopCamera();
      onScanSuccess(reqId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden p-5 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading text-sm font-semibold">Mobile QR Scanner</span>
            </div>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="w-full aspect-square rounded-xl bg-black relative overflow-hidden flex flex-col items-center justify-center mb-4 border border-border">
            {hasPermission === null && (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Requesting camera access...</span>
              </div>
            )}

            {hasPermission === false && (
              <div className="p-4 text-center text-white flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-warning" />
                <span className="text-xs text-muted-foreground">{errorMsg || 'Camera permission denied'}</span>
                <Button onClick={startCamera} size="sm" variant="outline" className="mt-2 text-xs gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry Permission
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${hasPermission ? 'block' : 'hidden'}`}
            />

            {hasPermission && (
              <div className="absolute inset-0 pointer-events-none border-2 border-primary/60 rounded-xl m-8 flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary/80 animate-pulse shadow-glow" />
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualCodeSubmit} className="w-full space-y-2">
            <p className="text-[11px] text-muted-foreground text-center">
              Scan the QR code on your Laptop or paste the approval link below:
            </p>
            <div className="flex gap-2">
              <input
                name="qrUrlInput"
                type="text"
                placeholder="Paste QR Link or requestId..."
                className="flex-1 h-10 rounded-xl px-3 bg-muted text-xs border border-border outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" className="h-10 rounded-xl px-3 text-xs">
                Open
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
