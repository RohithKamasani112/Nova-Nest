import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Seo } from '../components/Seo';
import { breadcrumbJsonLd } from '../utils/seo';
import { EASE_ELEGANT, EASE_TAB_SWITCH } from '../lib/animation';
import { SERVICE_CATEGORIES } from '../data/services';
import { BUSINESS_EMAIL, BUSINESS_PHONE, BUSINESS_WHATSAPP_NUMBER } from '../utils/siteSettings';
import { trackPhoneClick, trackWhatsAppClick } from '../utils/analytics';
import { AnimatedCheck } from '../app/components/AnimatedCheck';
import { CategoryIconBadge } from '../app/components/CategoryIconBadge';
import { MagneticCard } from '../app/components/MagneticCard';

interface ServicesPageProps {
  onNavigate: (page: string) => void;
}

const buildWhatsappLink = (message: string): string =>
  `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const phoneDigits = BUSINESS_PHONE.replace(/\D/g, '').replace(/^0+/, '');
const phoneTel = `tel:+91${phoneDigits}`;
const phoneDisplay = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;

// Short tab labels for the sticky tab bar — the full category name still
// lives inside the panel itself, per category id in data/services.ts.
const TAB_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  documentation: 'Documentation',
  management: 'Management',
};

const SLIDE_DISTANCE = 15;

export const ServicesPage: React.FC<ServicesPageProps> = () => {
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <Seo
        title="Our Services | Nova Nest Property Management"
        description="End-to-end property care in Bangalore — maintenance & improvements, documentation & legal assistance, and full property management for owners."
        path="/services"
        jsonLd={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ]}
      />

      {/* Hero band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark py-24 sm:py-32">
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute -top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center text-white">
          <motion.p
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_ELEGANT }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-accent sm:text-sm sm:tracking-[0.35em]"
          >
            Nova Nest Property Management
          </motion.p>
          <motion.h1
            initial={reduce ? undefined : { opacity: 0, y: 30 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_ELEGANT }}
            className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
          >
            End-to-End Property Care in Bangalore
          </motion.h1>
          <motion.p
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_ELEGANT }}
            className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg"
          >
            From fresh paint to full-time management — one team handles it all.
          </motion.p>
        </div>
      </section>

      {/* Sticky tab bar */}
      <div
        role="tablist"
        aria-label="Service categories"
        className="sticky top-16 z-30 border-b border-charcoal/[0.07] bg-cream/95 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto px-4 no-scrollbar sm:px-6 lg:px-8">
          {SERVICE_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            const active = index === activeIndex;
            return (
              <button
                key={category.id}
                role="tab"
                id={`services-tab-${category.id}`}
                aria-selected={active}
                aria-controls={`services-panel-${category.id}`}
                onClick={() => setActiveIndex(index)}
                className={`relative flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-semibold transition-colors duration-200 sm:px-5 ${
                  active ? 'text-charcoal' : 'text-charcoal/50 hover:text-charcoal'
                }`}
              >
                <CategoryIconBadge icon={Icon} active={active} size="sm" />
                {TAB_LABELS[category.id]}
                {active && (
                  <motion.span
                    layoutId="servicesTabUnderline"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }}
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-gold"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabbed content panel — all three categories stay mounted (stacked in
          the same grid cell) so the content remains in the DOM for crawlers;
          only the active one is visible/interactive. */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative grid">
            {SERVICE_CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              const active = index === activeIndex;
              const enquireMessage = `Hi, I'd like to know more about ${category.title}`;
              const offset = index < activeIndex ? -SLIDE_DISTANCE : SLIDE_DISTANCE;

              return (
                <motion.div
                  key={category.id}
                  role="tabpanel"
                  id={`services-panel-${category.id}`}
                  aria-labelledby={`services-tab-${category.id}`}
                  aria-hidden={!active}
                  style={{ gridArea: '1 / 1' }}
                  animate={reduce ? undefined : { opacity: active ? 1 : 0, x: active ? 0 : offset }}
                  transition={{ duration: 0.3, ease: EASE_TAB_SWITCH }}
                  className={[
                    active ? 'pointer-events-auto' : 'pointer-events-none select-none',
                    reduce && !active ? 'hidden' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-5">
                    <CategoryIconBadge icon={Icon} active={active} size="lg" />
                    <div>
                      <span className="font-serif text-3xl font-bold text-charcoal/10 sm:text-4xl" aria-hidden>
                        0{index + 1}
                      </span>
                      <h2 className="-mt-2 font-serif text-2xl font-bold text-charcoal sm:text-3xl">
                        {category.title}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {category.items.map((item, itemIndex) => (
                      <MagneticCard
                        key={item.title}
                        className="rounded-xl border border-charcoal/10 bg-white p-5 shadow-subtle transition-shadow duration-[250ms] hover:shadow-medium"
                      >
                        <AnimatedCheck
                          size={22}
                          active={active}
                          delay={0.1 + itemIndex * 0.12}
                          className="text-gold"
                        />
                        <h3 className="mt-3 font-semibold text-charcoal">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      </MagneticCard>
                    ))}
                  </div>

                  <div className="mt-8">
                    <a
                      href={buildWhatsappLink(enquireMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={active ? 0 : -1}
                      onClick={() => trackWhatsAppClick(`services_${category.id}`)}
                      className="inline-flex items-center gap-2 rounded-md border border-gold/50 px-5 py-2.5 text-sm font-semibold text-gold transition-all duration-[250ms] hover:bg-gold/10 hover:-translate-y-0.5"
                    >
                      <MessageCircle size={16} />
                      Ask about this service
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom contact CTA — appears once, not repeated per category */}
      <section className="border-t border-charcoal/[0.07] bg-cream/60 py-16 sm:py-20">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE_ELEGANT }}
          className="max-w-3xl mx-auto px-4 text-center sm:px-6 lg:px-8"
        >
          <h2 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">
            Need help with your property?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Reach out and our team will take it from there.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="relative w-full sm:w-auto">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-md bg-[#25D366]"
                  style={{ willChange: 'transform, opacity' }}
                  animate={{ scale: [1, 1.5], opacity: [0.35, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <a
                href={buildWhatsappLink('Hi, I need help with my property')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('services_bottom')}
                className="relative flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-[250ms] hover:brightness-95 hover:-translate-y-0.5 hover:shadow-medium sm:w-auto"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>
            <a
              href={phoneTel}
              onClick={() => trackPhoneClick('services_bottom')}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-charcoal/15 bg-white px-6 py-3.5 text-sm font-semibold text-charcoal transition-all duration-[250ms] hover:border-gold hover:text-gold hover:-translate-y-0.5 sm:w-auto"
            >
              <Phone size={18} />
              {phoneDisplay}
            </a>
            <a
              href={`mailto:${BUSINESS_EMAIL}`}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-charcoal/15 bg-white px-6 py-3.5 text-sm font-semibold text-charcoal transition-all duration-[250ms] hover:border-gold hover:text-gold hover:-translate-y-0.5 sm:w-auto"
            >
              <Mail size={18} />
              Email Us
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
