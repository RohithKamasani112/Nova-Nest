import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AnimatedCheckProps {
  size?: number;
  delay?: number;
  active: boolean;
  className?: string;
}

// A checkmark that draws itself in (circle + tick, both animated via SVG
// `pathLength`) whenever `active` becomes true, and resets to undrawn when it
// goes false — so revisiting a Services tab replays the draw-in each time
// instead of only once. Falls back to a fully-drawn, static mark under
// prefers-reduced-motion.
export const AnimatedCheck: React.FC<AnimatedCheckProps> = ({ size = 22, delay = 0, active, className }) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 0.5, delay: active ? delay : 0, ease: 'easeOut' }}
      />
      <motion.path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 0.35, delay: active ? delay + 0.35 : 0, ease: 'easeOut' }}
      />
    </svg>
  );
};
