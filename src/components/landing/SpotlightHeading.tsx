'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

/* ── Spotlight Heading (Hero Text Interaction) ── */
export function SpotlightHeading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30, mass: 0.5 });

  const maskImage = useTransform(
    [smoothX, smoothY] as const,
    ([x, y]) =>
      `radial-gradient(circle 120px at ${x}px ${y}px, white 0%, rgba(255,255,255,0.6) 40%, transparent 70%)`
  );

  const spotLightBg = useTransform(
    [smoothX, smoothY] as const,
    ([x, y]) =>
      `radial-gradient(circle 200px at ${x}px ${y}px, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 40%, transparent 70%)`
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const headingClasses = "font-hero text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]";

  return (
    <motion.div
      ref={containerRef}
      variants={fadeInUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative mb-4 cursor-default select-none overflow-hidden rounded-lg"
    >
      {/* Base text layer — per-word coloring */}
      <h1 className={headingClasses}>
        <span className="text-[#0F172A]">The Presence of </span>
        <span className="text-[#3B82F6]">SECURED </span>
        <span className="text-[#0F172A]">Authentication</span>
      </h1>

      {/* Spotlight glow — blue radial gradient following cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: spotLightBg,
          filter: 'blur(30px)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
          willChange: 'background',
        }}
      />

      {/* Revealed text layer — white, masked by cursor spotlight */}
      <motion.h1
        className={`absolute inset-0 ${headingClasses} text-white`}
        style={{
          WebkitMaskImage: maskImage,
          maskImage: maskImage,
          willChange: 'mask-image, -webkit-mask-image',
        }}
      >
        <span>The Presence of </span>
        <span>SECURED </span>
        <span>Authentication</span>
      </motion.h1>
    </motion.div>
  );
}
