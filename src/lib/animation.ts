import type { Transition, Variants } from 'motion/react';

/**
 * Nova Nest motion system.
 *
 * A single source of truth for every spring, easing curve and reusable variant
 * used across the app, so interactions feel consistent and intentional.
 *
 * Durations are kept inside the 0.2s–0.6s band, opacity/position slides use the
 * elegant cubic-bezier, and transform-heavy reveals use springs.
 */

// ----- Springs -----------------------------------------------------------
export const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 60, damping: 18 };
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 120, damping: 20 };
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 200, damping: 15 };

// ----- Easing ------------------------------------------------------------
// Elegant ease used for opacity + positional slides.
export const EASE_ELEGANT: [number, number, number, number] = [0.25, 0.1, 0.0, 1.0];

// ----- Variants ----------------------------------------------------------
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_ELEGANT },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE_ELEGANT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_ELEGANT } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_ELEGANT } },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE_ELEGANT } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerFastContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

// ----- Page transition (React state router) ------------------------------
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_ELEGANT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: EASE_ELEGANT } },
};

// ----- Admin step transition (blur + slide + scale) ----------------------
export const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.35, ease: EASE_ELEGANT },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
    transition: { duration: 0.25, ease: EASE_ELEGANT },
  }),
};

// Shared accent used by decorative gold shimmer / glow effects. The Nova Nest
// palette maps the legacy "gold" onto amber, so animations reference the accent.
export const NN_GOLD = '#C9A35F';
