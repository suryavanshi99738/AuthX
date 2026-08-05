'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { scaleInBounce, shakeAnimation } from '@/lib/animations';

interface AuthLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string;
  onDismiss?: () => void;
}

export function AuthLoadingOverlay({
  isVisible,
  message = 'Verifying...',
  status = 'loading',
  errorMessage,
  onDismiss,
}: AuthLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status === 'error' ? onDismiss : undefined}
          />

          {/* Content card */}
          <motion.div
            className="relative z-10 bg-[#FFF4E1] border border-[#E5D7C3] rounded-xl shadow-xl p-8 flex flex-col items-center text-center max-w-sm mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Loading state */}
            {status === 'loading' && (
              <motion.div
                className="mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-12 h-12 text-[#428475]" />
              </motion.div>
            )}

            {/* Success state */}
            {status === 'success' && (
              <motion.div variants={scaleInBounce} initial="hidden" animate="visible" className="mb-4">
                <motion.div
                  className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <motion.div
                variants={shakeAnimation}
                initial="initial"
                animate="animate"
                className="mb-4"
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <XCircle className="w-8 h-8 text-red-600" />
                </motion.div>
              </motion.div>
            )}

            {/* Message */}
            <motion.p
              className="text-sm font-medium text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {status === 'success' ? 'Verified Successfully!' : status === 'error' ? (errorMessage || 'Verification Failed') : message}
            </motion.p>

            {status === 'error' && onDismiss && (
              <motion.button
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-smooth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onDismiss}
              >
                Tap to try again
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
