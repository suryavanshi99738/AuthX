"use client";

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({ value, duration = 300, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const startValueRef = useRef(0);
  const endValueRef = useRef(value);

  useEffect(() => {
    startValueRef.current = count;
    endValueRef.current = value;
    
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      const t = Math.min(progress / duration, 1);
      const easedT = easeOutCubic(t);
      
      const currentVal = startValueRef.current + (endValueRef.current - startValueRef.current) * easedT;
      setCount(currentVal);
      
      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(endValueRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  const formattedCount = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(count));

  return (
    <span className={cn("inline-block", className)}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
}
