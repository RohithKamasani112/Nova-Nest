import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../data/services';
import { EASE_ELEGANT } from '../../lib/animation';

interface ServicesTeaserSectionProps {
  onNavigate: (page: string) => void;
}

// Compact teaser above the testimonials section — one condensed line per
// service category, linking through to the full /services page for detail.
// Reveal/stagger/hover treatment mirrors TestimonialsSection.tsx's heading
// block and TenantOnboardingChecklist.tsx's card conventions, so this reads
// as part of the same site rather than a bolted-on feature.
export const ServicesTeaserSection: React.FC<ServicesTeaserSectionProps> = ({ onNavigate }) => {
  const reduce = useReducedMotion();

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
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">What we handle</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-charcoal sm:text-3xl">
            End-to-end property care
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {SERVICE_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.13, ease: EASE_ELEGANT }}
                className="group rounded-2xl border border-charcoal/10 bg-white p-6 text-center shadow-subtle transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-medium sm:text-left"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-transform duration-[250ms] group-hover:scale-110 sm:mx-0">
                  <Icon size={22} className="text-accent" />
                </span>
                <h3 className="mt-4 font-serif text-lg font-bold text-charcoal">{category.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{category.teaserSubtitle}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: 0.4, ease: EASE_ELEGANT }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => onNavigate('services')}
            className="group flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-all duration-[250ms] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-medium sm:w-auto"
          >
            View all services
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
