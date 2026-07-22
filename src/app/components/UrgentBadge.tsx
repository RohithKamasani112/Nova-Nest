import React from 'react';
import { motion } from 'motion/react';

interface UrgentBadgeProps {
  reduce: boolean | null;
  className?: string;
  label?: string;
}

// Corner tag for admin-flagged urgent listings (Property.urgent). Loops a
// "coin flip" — scaleX 1 -> 0 -> 1 — which reads as the badge spinning
// edge-on without ever mirroring the text (unlike a real rotateY flip would).
// Freezes at full scale under prefers-reduced-motion instead of disappearing.
export const UrgentBadge: React.FC<UrgentBadgeProps> = ({ reduce, className, label = 'Urgent Sale' }) => (
  <motion.span
    aria-label={label}
    className={`pointer-events-none z-[5] inline-block select-none whitespace-nowrap rounded bg-[#E03131] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.03em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:text-[10px] ${className ?? ''}`}
    style={{ transformOrigin: 'center' }}
    animate={reduce ? { scaleX: 1 } : { scaleX: [1, 0, 1] }}
    transition={reduce ? { duration: 0 } : { duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
  >
    {label}
  </motion.span>
);
