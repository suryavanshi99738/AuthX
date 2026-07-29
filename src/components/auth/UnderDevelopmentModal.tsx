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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Animated construction icon */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <Construction className="w-8 h-8 text-warning" />
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <DialogTitle className="font-heading text-xl font-semibold mb-2">
              Under Development
            </DialogTitle>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-sm text-muted-foreground leading-relaxed max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {featureName
              ? `${featureName} authentication is coming soon. Stay tuned for updates.`
              : 'This feature is coming soon. Stay tuned for updates.'}
          </motion.p>

          {/* Close button */}
          <motion.div
            className="mt-6"
            variants={scaleInBounce}
            initial="hidden"
            animate="visible"
          >
            <Button onClick={onClose} className="rounded-xl px-6">
              Got it
            </Button>
          </motion.div>
        </div>

        {/* Close X button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
