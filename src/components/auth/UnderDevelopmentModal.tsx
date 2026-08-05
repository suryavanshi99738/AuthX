'use client';

import { motion } from 'framer-motion';
import { Construction, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { scaleInBounce } from '@/lib/animations';

interface UnderDevelopmentModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UnderDevelopmentModal({ open, onClose, featureName }: UnderDevelopmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-xl border-border">
        <div className="p-6 flex flex-col items-center text-center">
          {/* Animated construction icon */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Construction className="w-7 h-7 text-primary" />
            </div>
          </motion.div>

          {/* Heading */}
          <DialogTitle className="font-heading text-lg font-semibold mt-4">
            Under Development
          </DialogTitle>

          {/* Description */}
          <p className="text-sm text-muted-foreground max-w-xs mt-2">
            {featureName
              ? `${featureName} authentication is coming soon. Stay tuned for updates.`
              : 'This feature is coming soon. Stay tuned for updates.'}
          </p>

          {/* Close button */}
          <Button onClick={onClose} className="w-full mt-6 bg-primary text-primary-foreground rounded-lg h-11">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
