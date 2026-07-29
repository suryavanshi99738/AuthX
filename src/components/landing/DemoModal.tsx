'use client';

import { motion } from 'framer-motion';
import { Shield, KeyRound, Fingerprint, QrCode, Mail, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

export function DemoModal({ open, onClose }: DemoModalProps) {
  const { setPageView } = useAuth();

  const handleGetStarted = () => {
    onClose();
    setPageView('demoAuth');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Visual */}
          <div
            className="relative min-h-[280px] md:min-h-[400px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <svg viewBox="0 0 120 144" width="120" height="144">
                <path d="M60 8 L112 32 L112 96 C112 116 88 138 60 144 C32 138 8 116 8 96 L8 32 Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" />
                <rect x="46" y="68" width="28" height="22" rx="3" fill="white" opacity="0.85" />
                <path d="M52 68 L52 60 C52 52 60 46 68 52 L68 60 L68 68" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <circle cx="60" cy="78" r="3" fill="#2563EB" />
                <path d="M50 38 L58 46 L74 30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </motion.div>
          </div>

          {/* Right: Content */}
          <div className="p-8 flex flex-col justify-center">
            <h3 className="font-heading text-xl font-semibold mb-3">See BankShield in Action</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Experience how passwordless authentication works for banking. No passwords to remember, no credentials to leak — just seamless, secure access.
            </p>

            <div className="space-y-4 mb-6">
              {[
                { icon: KeyRound, label: 'Passkey-first login', desc: 'WebAuthn/FIDO2 standard' },
                { icon: Fingerprint, label: 'Biometric verification', desc: 'Fingerprint & Face ID' },
                { icon: QrCode, label: 'QR authentication', desc: 'Scan & go — no typing' },
                { icon: Mail, label: 'OTP fallback', desc: 'Email one-time codes' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button className="rounded-xl flex-1" onClick={handleGetStarted}>
                Try Demo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
