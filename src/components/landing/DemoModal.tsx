'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
  resolvedTheme?: 'light' | 'dark';
}

export function DemoModal({ open, onClose, resolvedTheme }: DemoModalProps) {
  const { setPageView } = useAuth();

  const handleStartDemo = () => {
    onClose();
    setPageView('demoAuth');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md p-6 text-center flex flex-col items-center ${resolvedTheme === 'dark' ? 'dark bg-[#0D1110] border-[#31443F] text-[#F8FAF8]' : 'bg-background'}`}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary dark:text-[#5FA895]" />
          </div>
          
          <h3 className="font-heading text-xl font-semibold mb-2 dark:text-[#F8FAF8]">Experience AuthX Demo</h3>
          
          <p className="text-sm text-muted-foreground dark:text-[#97A39E] mb-6">
            Test our seamless passwordless authentication flows in a secure sandbox environment. Experience how modern login should feel.
          </p>

          <div className="w-full space-y-3 mb-8 text-left">
            {[
              'Passkey Authentication',
              'Email OTP Verification',
              'QR Code Login',
              'Security Dashboard'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary dark:text-[#5FA895] shrink-0" />
                <span className="text-sm text-foreground dark:text-[#F8FAF8]">{feature}</span>
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col gap-3">
            <Button className="w-full dark:bg-[#5FA895] dark:text-white dark:hover:bg-[#4C8B7A]" onClick={handleStartDemo}>
              Start Demo
            </Button>
            <Button variant="ghost" className="w-full dark:text-[#F8FAF8] dark:hover:bg-white/10" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
