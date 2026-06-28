import React, { useEffect, useRef, useState } from 'react';
import { Property, Inquiry } from '../types';
import { createLead, getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { EASE_ELEGANT, scaleIn, staggerFastContainer, staggerContainer } from '../lib/animation';

// Number that counts up from 0 to `value` when it scrolls into view (spec #25),
// driven by a spring and formatted each frame. Snaps under reduced-motion.
const InViewCount: React.FC<{ value: number; format: (n: number) => string; className?: string }> = ({
  value,
  format,
  className,
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    if (inView) mv.set(value);
    const unsubscribe = spring.on('change', (latest) => setDisplay(format(latest)));
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};
import {
  ArrowLeft,
  Bath,
  Bed,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  Share2,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyDetailsPageProps {
  property: Property;
  onClose: () => void;
  onPropertyClick: (property: Property) => void;
}

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
}

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  property,
  onClose,
  onPropertyClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadType, setLeadType] = useState<'contact-owner' | 'schedule-visit' | 'request-info'>('contact-owner');
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: '', phone: '', email: '' });
  const [loadingLead, setLoadingLead] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const reduce = useReducedMotion();
  // Sticky mobile CTA (spec #26): the bar appears once the inline price scrolls
  // out of view.
  const priceRef = useRef<HTMLDivElement>(null);
  const priceInView = useInView(priceRef, { margin: '-80px' });
  const showPerSqft = property.status === 'buy' && (property.pricePerSqft ?? 0) > 0;
  const perSqftLabel = showPerSqft ? `₹${property.pricePerSqft!.toLocaleString('en-IN')}/sqft` : '';

  // Brokerage / commission recorded by the admin (spec: shown when opening the
  // property). Resolve the ₹ amount and % regardless of how it was entered.
  const hasCommission = (property.commissionValue ?? 0) > 0;
  const commissionPct =
    property.commissionType === 'percentage' ? property.commissionValue : property.commissionCalculated;
  const commissionAmt =
    property.commissionType === 'percentage' ? property.commissionCalculated : property.commissionValue;
  const commissionLabel = hasCommission
    ? [
        commissionAmt ? `₹${Math.round(commissionAmt).toLocaleString('en-IN')}` : '',
        commissionPct ? `${Number(commissionPct).toFixed(2)}%` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  useEffect(() => {
    const loadSimilarProperties = async () => {
      try {
        const allProps = await getAllProperties();
        setSimilarProperties(
          allProps
            .filter((p) => p.isActive !== false && p.category === property.category && p.id !== property.id)
            .slice(0, 3)
        );
      } catch (error) {
        console.error('Error loading similar properties:', error);
      }
    };

    loadSimilarProperties();
  }, [property]);

  const formatPrice = (price: number): string => {
    if (property.status === 'rent') return `\u20B9${price.toLocaleString()}/month`;
    if (price >= 10000000) return `\u20B9${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `\u20B9${(price / 100000).toFixed(2)} L`;
    return `\u20B9${price.toLocaleString()}`;
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.email) {
      toast.error('Please fill all fields');
      return;
    }

    setLoadingLead(true);
    try {
      const inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'status'> = {
        propertyId: property.id,
        userId: 'guest',
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        message: leadType === 'schedule-visit' ? 'Schedule a visit' : leadType === 'request-info' ? 'Request info' : 'Contact owner',
        type: leadType,
      };

      await createLead(inquiryData);
      toast.success('Inquiry submitted successfully');
      setShowLeadModal(false);
      setLeadForm({ name: '', phone: '', email: '' });
    } catch (error) {
      toast.error('Failed to submit inquiry');
    } finally {
      setLoadingLead(false);
    }
  };

  const imageCount = property.images.length;
  const propertyTypeLabel = property.category === 'land' ? 'Plot' : property.category;
  const description =
    property.description ||
    'A verified Nova Nest listing with detailed advisory support available for site visits, pricing guidance, and documentation.';
  const descriptionText = expandedDescription ? description : description.substring(0, 220);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
  const whatsappMessage = `Hi, I am interested in the property "${property.title}" located at ${property.location}. Please share more details.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const goPrev = () => setCurrentImageIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  const goNext = () => setCurrentImageIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  const openLead = (type: typeof leadType) => {
    setLeadType(type);
    setShowLeadModal(true);
  };
  const saveQuickLead = (source: string, type: Inquiry['type']) => {
    void createLead({
      propertyId: property.id,
      userId: 'guest',
      name: `${source} Enquiry`,
      email: '',
      phone: source === 'Call' ? 'Via Call' : 'Via WhatsApp',
      message: `${source} enquiry for ${property.title} at ${property.location}`,
      type,
    }).catch((error) => {
      console.error(`Failed to save ${source.toLowerCase()} lead:`, error);
    });
  };
  const handleWhatsApp = () => {
    saveQuickLead('WhatsApp', 'contact-owner');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  const handleCall = () => {
    saveQuickLead('Call', 'contact-owner');
    window.location.href = 'tel:+919845418570';
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={onClose} className="group flex min-h-[44px] items-center gap-2 text-sm font-semibold text-charcoal transition-colors hover:text-gold">
            <ArrowLeft size={20} className="transition-transform duration-[250ms] group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] rounded-md p-2 hover:bg-gold/10 sm:hidden">
            <X size={24} />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <div className="space-y-8">
            <div className="relative h-96 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_50px_rgba(15,31,61,0.16)] sm:h-[520px]">
              {imageCount > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      layoutId={currentImageIndex === 0 ? `property-image-${property.id}` : undefined}
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      initial={reduce ? false : { opacity: 0, scale: currentImageIndex === 0 ? 1 : 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.4, ease: EASE_ELEGANT }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />
                  {imageCount > 1 && (
                    <>
                      <button onClick={goPrev} className="absolute left-4 top-1/2 z-10 min-h-[44px] min-w-[44px] rounded-full bg-white/35 p-3 backdrop-blur-md transition-all hover:bg-white/55">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={goNext} className="absolute right-4 top-1/2 z-10 min-h-[44px] min-w-[44px] rounded-full bg-white/35 p-3 backdrop-blur-md transition-all hover:bg-white/55">
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 right-4 rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                        {currentImageIndex + 1}/{imageCount}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gold/10">
                  <Home size={72} className="text-gold" />
                </div>
              )}
            </div>

            {imageCount > 1 && (
              <div className="flex gap-3 overflow-x-auto rounded-xl border border-border bg-white p-3 shadow-subtle no-scrollbar">
                {property.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setCurrentImageIndex(index)}
                    className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg"
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 rounded-lg border-2 border-border" />
                    {index === currentImageIndex && (
                      <motion.span
                        layoutId="activeThumb"
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 28 }}
                        className="pointer-events-none absolute inset-0 rounded-lg border-2 border-primary shadow-subtle"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <section className="rounded-2xl border border-border border-t-4 border-t-primary bg-white p-6 shadow-[0_10px_30px_rgba(15,31,61,0.08)] sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm capitalize">
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-semibold text-gold">
                  {propertyTypeLabel}
                </span>
                <span className="rounded-full border border-border bg-surface px-3 py-1 font-semibold text-muted-foreground">
                  {property.status === 'buy' ? 'For Sale' : 'For Rent'}
                </span>
                {property.featured && (
                  <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 font-semibold text-gold">
                    Featured
                  </span>
                )}
                {property.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 font-semibold text-gold">
                    <Check size={15} />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl font-bold leading-tight text-charcoal md:text-5xl">
                {property.title}
              </h1>

              <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin size={18} className="flex-shrink-0 text-gold" />
                <span>{property.location}</span>
              </div>

              <div ref={priceRef} className="mt-5 font-sans text-4xl font-bold leading-none text-primary">
                <InViewCount value={property.price} format={(n) => formatPrice(Math.round(n))} />
              </div>
              {showPerSqft && (
                <div className="mt-1.5 text-sm font-semibold text-muted-foreground">{perSqftLabel}</div>
              )}
              {hasCommission && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold">
                  <span className="uppercase tracking-wider text-xs">Brokerage</span>
                  <span>{commissionLabel}</span>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: Bed, label: 'Bedrooms', value: property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Studio' },
                  {
                    icon: Bath,
                    label: 'Bathrooms',
                    value: <InViewCount value={property.bathrooms} format={(n) => `${Math.round(n)}`} />,
                  },
                  {
                    icon: Maximize,
                    label: 'Area',
                    value: <InViewCount value={property.areaSqft} format={(n) => `${Math.round(n).toLocaleString()} sqft`} />,
                  },
                  { icon: Home, label: 'Type', value: propertyTypeLabel },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                      <span className="block font-semibold text-text-primary capitalize">{value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-border pt-7">
                <h2 className="mb-4 font-serif text-3xl font-bold text-charcoal">Description</h2>
                <p className="leading-8 text-muted-foreground">
                  {descriptionText}
                  {!expandedDescription && description.length > 220 ? '...' : ''}
                </p>
                {description.length > 220 && (
                  <button onClick={() => setExpandedDescription(!expandedDescription)} className="mt-3 min-h-[44px] font-semibold text-gold underline-offset-4 hover:underline">
                    {expandedDescription ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            </section>

            {property.amenities.length > 0 && (
              <section className="rounded-2xl border border-border bg-white p-6 shadow-subtle">
                <h2 className="mb-4 font-serif text-3xl font-bold text-charcoal">Amenities</h2>
                <motion.div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  variants={reduce ? undefined : staggerFastContainer}
                  initial={reduce ? undefined : 'hidden'}
                  whileInView={reduce ? undefined : 'visible'}
                  viewport={{ once: true, margin: '-40px' }}
                >
                  {property.amenities.map((amenity) => (
                    <motion.div
                      key={amenity}
                      variants={reduce ? undefined : scaleIn}
                      whileHover={reduce ? undefined : { scale: 1.05, backgroundColor: '#F0E2C0' }}
                      transition={{ duration: 0.2, ease: EASE_ELEGANT }}
                      className="flex items-center gap-2 rounded-md border border-border bg-white p-4 shadow-subtle"
                    >
                      <Check size={18} className="text-gold" />
                      <span className="text-sm text-text-primary">{amenity}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {(property.parking !== undefined || property.floors !== undefined || property.furnished !== undefined) && (
              <section className="rounded-2xl border border-border bg-white p-6 shadow-subtle">
                <h2 className="mb-4 font-serif text-3xl font-bold text-charcoal">Property Details</h2>
                <div className="overflow-hidden rounded-md border border-border bg-white">
                  {property.parking !== undefined && (
                    <div className="flex justify-between border-b border-border p-4">
                      <span className="text-muted-foreground">Parking</span>
                      <span className="font-semibold text-text-primary">{property.parking} spaces</span>
                    </div>
                  )}
                  {property.floors !== undefined && (
                    <div className="flex justify-between border-b border-border p-4">
                      <span className="text-muted-foreground">Total Floors</span>
                      <span className="font-semibold text-text-primary">{property.floors}</span>
                    </div>
                  )}
                  {property.furnished !== undefined && (
                    <div className="flex justify-between p-4">
                      <span className="text-muted-foreground">Furnishing</span>
                      <span className="font-semibold text-text-primary">{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 font-serif text-3xl font-bold text-charcoal">Location</h2>
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border shadow-subtle sm:h-96">
                <iframe
                  title="Property location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {!reduce && (
                  <motion.div
                    initial={{ x: '0%' }}
                    whileInView={{ x: '100%' }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6, delay: 0.2, ease: EASE_ELEGANT }}
                    className="absolute inset-0 z-10 bg-charcoal"
                  />
                )}
              </div>
            </section>

            {similarProperties.length > 0 && (
              <section>
                <h2 className="mb-6 font-serif text-3xl font-bold text-charcoal">Similar Properties</h2>
                <motion.div
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  variants={reduce ? undefined : staggerContainer}
                  initial={reduce ? undefined : 'hidden'}
                  whileInView={reduce ? undefined : 'visible'}
                  viewport={{ once: true, margin: '-60px' }}
                >
                  {similarProperties.map((prop, index) => (
                    <PropertyCard key={prop.id} property={prop} index={index} onClick={() => onPropertyClick(prop)} />
                  ))}
                </motion.div>
              </section>
            )}
          </div>

          <aside>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_14px_40px_rgba(15,31,61,0.12)] lg:sticky lg:top-6"
            >
              <div className="bg-charcoal p-6 text-white">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Nova Nest Advisory</p>
                <div className="text-3xl font-bold text-accent">{formatPrice(property.price)}</div>
                {showPerSqft && <p className="mt-1 text-sm font-semibold text-white/80">{perSqftLabel}</p>}
                <p className="mt-2 text-sm text-white/70">{property.status === 'buy' ? 'For Sale' : 'For Rent'} in {property.location}</p>
              </div>

              <div className="space-y-4 p-6">
                <button onClick={() => openLead('contact-owner')} className="h-12 w-full rounded-md bg-charcoal font-semibold text-white shadow-subtle transition-all duration-[250ms] hover:bg-charcoal hover:shadow-medium">
                  Contact Owner
                </button>
                <button onClick={() => openLead('schedule-visit')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-primary bg-white font-semibold text-primary transition-colors hover:bg-gold/10">
                  <Calendar size={18} />
                  Schedule Visit
                </button>
                {property.brochure && (
                  <button onClick={() => openLead('request-info')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold">
                    <Download size={18} />
                    Download Brochure
                  </button>
                )}

              <div className="mt-5 space-y-3 border-t border-border pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-gold/60 p-1">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gold text-white shadow-inner">
                      <User size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-lg font-bold text-charcoal">Nova Nest Advisor</div>
                    <div className="text-xs text-muted-foreground">Verified Property Team</div>
                  </div>
                </div>

                <button onClick={handleCall} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold">
                  <Phone size={18} />
                  Call Agent
                </button>
                <button onClick={handleWhatsApp} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold">
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button
                  onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>

      {/* Sticky mobile CTA bar — slides up once the price scrolls away (spec #26) */}
      <AnimatePresence>
        {!priceInView && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-6px_24px_rgba(15,31,61,0.12)] backdrop-blur-md lg:hidden"
          >
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-primary">{formatPrice(property.price)}</div>
              <div className="truncate text-xs text-muted-foreground">
                {property.status === 'buy' ? 'For Sale' : 'For Rent'} · {property.location}
              </div>
            </div>
            <button
              onClick={() => openLead('contact-owner')}
              className="flex-shrink-0 min-h-[44px] rounded-md bg-charcoal px-5 py-2.5 text-sm font-semibold text-white"
            >
              Contact Owner
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowLeadModal(false)}
              className="fixed inset-0 z-40 bg-black/50"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
              transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-md rounded-md bg-white p-6 shadow-strong">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-charcoal">
                    {leadType === 'schedule-visit' ? 'Schedule a Visit' : leadType === 'request-info' ? 'Request Brochure' : 'Contact Owner'}
                  </h2>
                  <button onClick={() => setShowLeadModal(false)} className="min-h-[44px] min-w-[44px] rounded-md p-1 transition-colors hover:bg-surface">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  {[
                    ['name', 'Full Name', 'text'],
                    ['phone', 'Mobile', 'tel'],
                    ['email', 'Email', 'email'],
                  ].map(([field, label, type]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-semibold text-text-primary">{label} *</span>
                      <input
                        type={type}
                        required
                        value={leadForm[field as keyof LeadFormData]}
                        onChange={(e) => setLeadForm({ ...leadForm, [field]: e.target.value })}
                        className="w-full rounded-md border border-border px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                    </label>
                  ))}
                  <button type="submit" disabled={loadingLead} className="premium-button w-full py-3 font-semibold disabled:bg-black/20">
                    {loadingLead ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
