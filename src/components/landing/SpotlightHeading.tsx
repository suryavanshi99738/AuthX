'use client';

import { motion } from 'framer-motion';

export function SpotlightHeading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <h1 
        className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text"
        style={{ backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6, #6366F1)' }}
      >
        Authentication Reimagined for the Modern Enterprise
      </h1>
    </motion.div>
  );
}
