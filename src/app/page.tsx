'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/landing/LandingPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { DemoAuthPage } from '@/components/demo/DemoAuthPage';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
import { pageTransition } from '@/lib/animations';

export default function Home() {
  const { pageView, hydrateFromStorage } = useAuth();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <AnimatePresence mode="wait">
      {pageView === 'landing' && (
        <motion.div key="landing" {...pageTransition}>
          <LandingPage />
        </motion.div>
      )}
      {pageView === 'auth' && (
        <motion.div key="auth" {...pageTransition}>
          <AuthPage />
        </motion.div>
      )}
      {pageView === 'dashboard' && (
        <motion.div key="dashboard" {...pageTransition}>
          <Dashboard />
        </motion.div>
      )}
      {pageView === 'demoAuth' && (
        <motion.div key="demoAuth" {...pageTransition}>
          <DemoAuthPage />
        </motion.div>
      )}
      {pageView === 'demoDashboard' && (
        <motion.div key="demoDashboard" {...pageTransition}>
          <DemoDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
