import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionTemplate, useReducedMotion, useSpring } from 'motion/react';

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
}

// Subtle cursor-following tilt (max ~5deg) with a soft edge glow in the site's
// existing gold accent (#C9A35F / NN_GOLD, see src/lib/animation.ts) —
// desktop only. Touch devices and prefers-reduced-motion get a plain static
// card with no listeners attached.
export const MagneticCard: React.FC<MagneticCardProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isTouch, setIsTouch] = useState(true);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 14 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 14 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(220px circle at ${glowX}% ${glowY}%, rgba(201,163,95,${glowOpacity}), transparent 70%)`;

  useEffect(() => {
    setIsTouch(!window.matchMedia('(pointer: fine)').matches);
  }, []);

  if (reduce || isTouch) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 10);
    rotateX.set(-(py - 0.5) * 10);
    glowX.set(px * 100);
    glowY.set(py * 100);
    glowOpacity.set(0.16);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springX, rotateY: springY, backgroundImage: background, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
