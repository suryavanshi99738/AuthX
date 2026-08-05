'use client';

import { motion } from 'framer-motion';

export function SpotlightHeading({ resolvedTheme }: { resolvedTheme?: 'light' | 'dark' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 text-left"
    >
      <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground dark:text-[#F8FAF8]">
        Presence of <span className={resolvedTheme === 'dark' ? 'text-[#9DE6C8]' : 'text-accent'}>SECURE</span> Authentication
      </h1>
    </motion.div>
  );
}
