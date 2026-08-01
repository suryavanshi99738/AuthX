'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, RefreshCw, Loader2, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

interface MobileQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (requestId: string) => void;
}

export function MobileQRScannerModal({ isOpen, onClose, onScanSuccess }: MobileQRScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanned, setScanned] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          let reqId = code.data.trim();
          if (reqId.includes('requestId=')) {
            reqId = reqId.split('requestId=')[1]?.split('&')[0] || reqId;
          }

          if (reqId && reqId.length > 5) {
            setScanned(true);
            if (navigator.vibrate) {
              try { navigator.vibrate(200); } catch { /* ignore */ }
            }
            stopCamera();
            setTimeout(() => {
              onScanSuccess(reqId);
            }, 500);
            return;
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  const startCamera = async () => {
    setErrorMsg('');
    setHasPermission(null);
    setScanned(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Camera access is not supported on this browser.');
        setHasPermission(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          animFrameRef.current = requestAnimationFrame(processFrame);
        }).catch(() => {});
      }
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

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = (formData.get('qrInput') as string) || '';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-2xl overflow-hidden p-5 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">Scan Laptop QR Code</h3>
                <p className="text-[11px] text-muted-foreground">Align QR inside frame to approve</p>
              </div>
            </div>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewfinder with Laser Scanner Animation */}
          <div className="w-full aspect-square rounded-2xl bg-black relative overflow-hidden flex flex-col items-center justify-center mb-3 border border-border shadow-inner">
            {hasPermission === null && (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-xs font-medium">Opening camera...</span>
              </div>
            )}

            {hasPermission === false && (
              <div className="p-4 text-center text-white flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-warning" />
                <span className="text-xs text-muted-foreground">{errorMsg || 'Camera access denied'}</span>
                <Button onClick={startCamera} size="sm" variant="outline" className="mt-2 text-xs gap-1 rounded-xl">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${hasPermission ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder Target & Laser Scanning Bar Animation */}
            {hasPermission && !scanned && (
              <div className="absolute inset-0 pointer-events-none p-8 flex items-center justify-center">
                {/* Outer Target Box with Corner Accents */}
                <div className="w-full h-full relative border border-white/20 rounded-2xl overflow-hidden">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-xl" />

                  {/* Animated Glowing Laser Beam */}
                  <motion.div
                    className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#3b82f6] absolute left-0"
                    animate={{ top: ['5%', '90%', '5%'] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scanned Success Overlay */}
            {scanned && (
              <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
                <span className="text-sm font-bold">QR Scanned!</span>
                <span className="text-xs text-white/80">Opening approval page…</span>
              </div>
            )}
          </div>

          {/* Scanner Guidance & Manual Option */}
          <div className="w-full space-y-2 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Scanning happens automatically when aligned.</span>
            </p>

            {!manualInputOpen ? (
              <button
                onClick={() => setManualInputOpen(true)}
                className="text-[11px] text-primary hover:underline font-medium pt-1"
              >
                Or enter approval URL manually
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="pt-2 space-y-2">
                <input
                  name="qrInput"
                  type="text"
                  placeholder="Paste URL or requestId..."
                  className="w-full h-9 rounded-xl px-3 bg-muted text-xs border border-border outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setManualInputOpen(false)} className="flex-1 h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 h-8 text-xs rounded-xl">
                    Submit
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
