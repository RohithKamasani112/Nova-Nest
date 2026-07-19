import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Quote, Star } from 'lucide-react';
import { TESTIMONIALS, type Testimonial } from '../../data/testimonials';
import { EASE_ELEGANT } from '../../lib/animation';

// Marquee speed target (~40-60px/s) and the approximate rendered width of one
// card (width + gap) — used to derive a per-row animation duration so both
// rows visually scroll at the same speed despite having different item counts.
const TARGET_SPEED_PX_PER_SEC = 50;
const CARD_WIDTH_PX = 340;
const CARD_GAP_PX = 16;

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
  <div className="relative flex h-[170px] w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:h-[190px] sm:w-[340px]">
    <Quote size={30} className="absolute right-4 top-4 text-gold/10" />
    <p className="relative truncate pr-8 text-[15px] font-bold text-charcoal">{testimonial.name}</p>
    <div className="relative mb-3 mt-1.5 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < testimonial.rating ? 'fill-gold text-gold' : 'fill-none text-border'}
        />
      ))}
    </div>
    <p className="relative line-clamp-4 text-sm leading-relaxed text-muted-foreground">{testimonial.text}</p>
  </div>
);

interface MarqueeRowProps {
  items: Testimonial[];
  direction: 'left' | 'right';
  forcePaused: boolean;
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ items, direction, forcePaused }) => {
  const [hovering, setHovering] = useState(false);
  const doubled = useMemo(() => [...items, ...items], [items]);
  const durationSec = (items.length * (CARD_WIDTH_PX + CARD_GAP_PX)) / TARGET_SPEED_PX_PER_SEC;

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="flex w-max gap-4"
        style={{
          animationName: direction === 'left' ? 'testimonialMarqueeLeft' : 'testimonialMarqueeRight',
          animationDuration: `${durationSec}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: forcePaused || hovering ? 'paused' : 'running',
        }}
      >
        {doubled.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
};

export const TestimonialsSection: React.FC = () => {
  const reduce = useReducedMotion();
  // Roughly even split — first half scrolls one way, the rest the other.
  const midpoint = Math.ceil(TESTIMONIALS.length / 2);
  const row1 = TESTIMONIALS.slice(0, midpoint);
  const row2 = TESTIMONIALS.slice(midpoint);

  return (
    <section className="border-t border-charcoal/[0.07] bg-cream/60 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE_ELEGANT }}
          className="mb-10 text-center"
        >
          <h2 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">What Our Clients Say</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Real experiences from renters, buyers, and owners we've worked with across Bangalore.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-semibold text-gold">
            <Star size={14} className="fill-gold text-gold" />
            4.9 · 100+ Google Reviews
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE_ELEGANT }}
        >
          <MarqueeRow items={row1} direction="left" forcePaused={Boolean(reduce)} />
        </motion.div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE_ELEGANT }}
          className="hidden sm:block"
        >
          <MarqueeRow items={row2} direction="right" forcePaused={Boolean(reduce)} />
        </motion.div>
      </div>

      <style>{`
        @keyframes testimonialMarqueeLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes testimonialMarqueeRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
};
