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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 relative border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Scan QR Code</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { stopCamera(); onClose(); }}
              className="absolute top-4 right-4 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Camera Viewfinder */}
          <div className="mx-5 mb-5 mt-5 aspect-square rounded-xl bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center border border-border shadow-inner">
            {hasPermission === null && (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-sm font-medium">Opening camera...</span>
              </div>
            )}

            {hasPermission === false && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
                <AlertCircle className="w-8 h-8 text-warning" />
                <span className="text-sm text-muted-foreground">{errorMsg || 'Camera access denied'}</span>
                <Button onClick={startCamera} size="sm" variant="outline" className="mt-2 text-xs gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder Target & Laser Scanning Bar Animation */}
            {hasPermission && !scanned && (
              <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                <div className="w-full h-full relative">
                  {/* Corner brackets */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

                  {/* Animated Glowing Laser Beam */}
                  <motion.div
                    className="w-full h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent absolute left-0"
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
              <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white z-20">
                <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
                <span className="text-sm font-bold">QR Scanned!</span>
              </div>
            )}
          </div>

          {/* Manual Option */}
          <div className="p-5 border-t border-border bg-muted/10">
            {!manualInputOpen ? (
              <button
                onClick={() => setManualInputOpen(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Or enter approval URL manually
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  name="qrInput"
                  type="text"
                  placeholder="Paste URL or requestId..."
                  className="w-full h-10 rounded-lg px-3 bg-background text-sm border border-border outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setManualInputOpen(false)} className="flex-1 h-10 text-sm">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg h-10 text-sm">
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
