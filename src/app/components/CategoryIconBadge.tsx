import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

interface CategoryIconBadgeProps {
  icon: LucideIcon;
  active: boolean;
  size?: 'sm' | 'lg';
}

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', glow: 'rounded-lg', icon: 16 },
  lg: { box: 'h-16 w-16 rounded-2xl', glow: 'rounded-2xl', icon: 28 },
} as const;

// Starts as a thin gold outline and morphs into the solid filled+glowing
// badge the moment `active` is true — used both for the small icon inside a
// Services tab button and the larger one inside its panel, so both flip in
// sync when a tab is selected. Falls back to the final filled state
// immediately under prefers-reduced-motion.
export const CategoryIconBadge: React.FC<CategoryIconBadgeProps> = ({ icon: Icon, active, size = 'lg' }) => {
  const reduce = useReducedMotion();
  const { box, glow, icon } = SIZES[size];

  return (
    <div className="relative flex-shrink-0">
      <motion.span
        aria-hidden
        className={`absolute -inset-1.5 bg-gold/15 blur-md ${glow}`}
        animate={reduce ? { opacity: 1 } : { opacity: active ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Outline stage — always present underneath */}
      <span className={`relative flex items-center justify-center border-2 border-gold/50 bg-transparent ${box}`}>
        <Icon size={icon} className="text-gold/70" />
      </span>

      {/* Filled stage — crossfades on top once active */}
      <motion.span
        animate={{ opacity: reduce ? 1 : active ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`absolute inset-0 flex items-center justify-center bg-primary shadow-medium ${box}`}
      >
        <Icon size={icon} className="text-accent" />
      </motion.span>
    </div>
  );
};
