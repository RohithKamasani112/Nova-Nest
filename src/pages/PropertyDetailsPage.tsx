import React, { useEffect, useRef, useState } from 'react';
import { Property, Inquiry } from '../types';
import { createLead, getAllProperties } from '../services/storageService';
import { trackWhatsAppClick, trackPhoneClick } from '../utils/analytics';
import { PropertyCard } from '../app/components/PropertyCard';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { EASE_ELEGANT, imageSlide, scaleIn, staggerFastContainer, staggerContainer } from '../lib/animation';
import { toTitleCase } from '../utils/format';
import noImage from '../assets/no-image.png';
import { Seo } from '../components/Seo';
import {
  propertyTitle,
  propertyDescription,
  propertyPath,
  propertyImage,
  propertyJsonLd,
  breadcrumbJsonLd,
} from '../utils/seo';

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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  MapPin,
  Maximize,
  Phone,
  Share2,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WhatsAppIcon } from '../app/components/icons/WhatsAppIcon';
import { WhatsAppContactModal } from '../app/components/WhatsAppContactModal';
import { NEARBY_PLACE_CATEGORIES } from '../data/nearbyPlaceCategories';
import { getAmenityIcon } from '../data/amenityIcons';
import { estimateTravelMinutes, formatDistance, haversineDistanceMeters } from '../utils/nearbyPlaces';

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

type DetailTab = 'overview' | 'locality' | 'amenities' | 'summary' | 'similar';

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  property,
  onClose,
  onPropertyClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Direction of the last gallery move (1 = next, -1 = prev, 0 = first open) so
  // the crossfade slides the right way.
  const [imageDirection, setImageDirection] = useState(0);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadType, setLeadType] = useState<'contact-owner' | 'schedule-visit' | 'request-info'>('contact-owner');
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: '', phone: '', email: '' });
  const [loadingLead, setLoadingLead] = useState(false);
  // Gate shown before opening WhatsApp — captures the visitor's number as a lead.
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [summaryOpen, setSummaryOpen] = useState(true);
  // Scroll-spy targets — sections stay mounted at all times; tabs just
  // smooth-scroll to / highlight based on whichever is in view.
  const sectionElsRef = useRef<Partial<Record<DetailTab, HTMLElement>>>({});
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
    if (property.status === 'rent') return `₹${price.toLocaleString()}/month`;
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
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
  // Studio (0 BHK) is meaningful for an actual home; for plots/commercial
  // listings a bedroom count doesn't apply at all, so skip the card there
  // rather than showing a misleading "Studio" (spec #3, #11).
  const isResidential = property.category !== 'land' && property.category !== 'condo';
  const description = property.description?.trim();
  // Contact number priority: the per-property agent number set by the admin,
  // otherwise the default company number from the env file. Normalised to the
  // digits-with-country-code form wa.me/tel expect (a bare 10-digit Indian
  // mobile gets the 91 prefix).
  const normalizePhone = (raw?: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length === 10 ? `91${digits}` : digits;
  };
  const defaultNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
  const contactNumber = normalizePhone(property.agentPhone) || defaultNumber;
  const whatsappMessage = `Hi, I am interested in the property "${property.title}" located at ${property.location}. Please share more details.`;
  const whatsappUrl = `https://wa.me/${contactNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const goPrev = () => {
    setImageDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };
  const goNext = () => {
    setImageDirection(1);
    setCurrentImageIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };
  const goToImage = (index: number) => {
    setImageDirection(index > currentImageIndex ? 1 : index < currentImageIndex ? -1 : 0);
    setCurrentImageIndex(index);
  };
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
  // Open the number-capture modal first; the actual WhatsApp redirect happens
  // in submitWhatsappLead once we have the visitor's number.
  const handleWhatsApp = () => {
    trackWhatsAppClick('property_detail', { property_id: property.id, property_name: property.title });
    setShowWhatsappModal(true);
  };
  const submitWhatsappLead = (phone: string) => {
    void createLead({
      propertyId: property.id,
      userId: 'guest',
      name: 'WhatsApp Enquiry',
      email: '',
      phone,
      message: `WhatsApp enquiry for ${property.title} at ${property.location}`,
      type: 'contact-owner',
    }).catch((error) => {
      console.error('Failed to save WhatsApp lead:', error);
    });
    setShowWhatsappModal(false);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  const handleCall = () => {
    trackPhoneClick('property_detail', { property_id: property.id, property_name: property.title });
    saveQuickLead('Call', 'contact-owner');
    window.location.href = `tel:+${contactNumber}`;
  };

  // Property Overview quick-facts strip — hide any card whose value would be
  // 0/empty rather than showing a meaningless "0 Sqft" (spec #3, #11).
  const overviewCards = [
    isResidential
      ? { icon: Bed, label: 'Bedrooms', value: property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Studio' }
      : null,
    property.bathrooms > 0
      ? { icon: Bath, label: 'Bathrooms', value: <InViewCount value={property.bathrooms} format={(n) => `${Math.round(n)}`} /> }
      : null,
    property.areaSqft > 0
      ? {
          icon: Maximize,
          label: 'Area',
          value: <InViewCount value={property.areaSqft} format={(n) => `${Math.round(n).toLocaleString()} sqft`} />,
        }
      : null,
    { icon: Home, label: 'Type', value: propertyTypeLabel },
  ].filter((card): card is { icon: typeof Bed; label: string; value: React.ReactNode } => card !== null);

  // "About Home" summary rows — only fields the property actually has data
  // for (spec #8, #11). Facing / unit floor-number aren't persisted on the
  // Property record today, so they're intentionally not listed here.
  const summaryRows = [
    property.price > 0 ? { label: 'Ask Price', value: formatPrice(property.price) } : null,
    isResidential && property.bedrooms > 0 ? { label: 'Bedrooms', value: `${property.bedrooms} BHK` } : null,
    property.bathrooms > 0 ? { label: 'Bathrooms', value: `${property.bathrooms}` } : null,
    property.areaSqft > 0 ? { label: 'Area', value: `${property.areaSqft.toLocaleString()} sqft` } : null,
    property.furnished !== undefined
      ? { label: 'Furnishing', value: property.furnished ? 'Furnished' : 'Unfurnished' }
      : null,
    property.floors !== undefined ? { label: 'Total Floors', value: `${property.floors}` } : null,
    property.parking !== undefined && property.parking > 0 ? { label: 'Parking', value: `${property.parking} spaces` } : null,
    property.yearBuilt ? { label: 'Year Built', value: `${property.yearBuilt}` } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  const nearbyByCategory = NEARBY_PLACE_CATEGORIES.map((category) => ({
    category,
    places: (property.nearbyPlaces || []).filter((place) => place.category === category.key),
  })).filter((group) => group.places.length > 0);

  const propertyHasCoords = property.latitude !== undefined && property.longitude !== undefined;

  // Every tab maps 1:1 to a section that actually renders below — a tab is
  // only listed if its section has real content, so there's never a dead
  // scroll target (Locality's map is unconditional, so it's always listed).
  const tabs: { key: DetailTab; label: string }[] = [
    ...(description ? [{ key: 'overview' as const, label: 'Overview' }] : []),
    { key: 'locality', label: 'Locality' },
    ...(property.amenities.length > 0 ? [{ key: 'amenities' as const, label: 'Amenities' }] : []),
    ...(summaryRows.length > 0 ? [{ key: 'summary' as const, label: 'Summary' }] : []),
    ...(similarProperties.length > 0 ? [{ key: 'similar' as const, label: 'Similar Homes Nearby' }] : []),
  ];

  // Sticky top header (64px) + sticky tab bar (48px) — used both to offset
  // the smooth-scroll target and as the scroll-spy's "current section" line.
  const STICKY_OFFSET = 112;

  const setSectionRef = (key: DetailTab) => (el: HTMLElement | null) => {
    if (el) sectionElsRef.current[key] = el;
    else delete sectionElsRef.current[key];
  };

  const scrollToTab = (key: DetailTab) => {
    const el = sectionElsRef.current[key];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    setActiveTab(key);
  };

  const tabKeysSignature = tabs.map((tab) => tab.key).join(',');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const key = topMost.target.getAttribute('data-tab-section') as DetailTab | null;
        if (key) setActiveTab(key);
      },
      { rootMargin: `-${STICKY_OFFSET + 8}px 0px -60% 0px`, threshold: 0 }
    );

    Object.values(sectionElsRef.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKeysSignature]);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <Seo
        title={propertyTitle(property)}
        description={propertyDescription(property)}
        path={propertyPath(property)}
        image={propertyImage(property)}
        type="product"
        jsonLd={[
          propertyJsonLd(property),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Properties', path: '/properties' },
            { name: toTitleCase(property.title), path: propertyPath(property) },
          ]),
        ]}
      />
      <div className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-white/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-6 sm:px-8 lg:px-12">
          <button onClick={onClose} className="group flex min-h-[44px] items-center gap-2 text-sm font-semibold text-charcoal transition-colors hover:text-gold">
            <ArrowLeft size={20} className="transition-transform duration-[250ms] group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] rounded-md p-2 hover:bg-gold/10 sm:hidden">
            <X size={24} />
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
          <div className="min-w-0 space-y-5">
            <div className="relative h-64 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_50px_rgba(15,31,61,0.16)] sm:h-80 md:h-[420px] lg:h-[450px]">
              {imageCount > 0 ? (
                <>
                  <AnimatePresence custom={imageDirection} initial={false}>
                    <motion.img
                      key={currentImageIndex}
                      custom={imageDirection}
                      layoutId={currentImageIndex === 0 ? `property-image-${property.id}` : undefined}
                      src={property.images[currentImageIndex]}
                      alt={`${toTitleCase(property.title)} — ${
                        property.status === 'buy' ? 'for sale' : 'for rent'
                      } in ${toTitleCase(property.location)} (photo ${currentImageIndex + 1} of ${imageCount})`}
                      loading="eager"
                      decoding="async"
                      {...({ fetchpriority: 'high' } as any)}
                      variants={reduce ? undefined : imageSlide}
                      initial={reduce ? false : 'enter'}
                      animate={reduce ? { opacity: 1 } : 'center'}
                      exit={reduce ? { opacity: 0 } : 'exit'}
                      transition={reduce ? { duration: 0 } : undefined}
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
                <img
                  src={noImage}
                  alt={`${toTitleCase(property.title)} — no photo available`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>

            {imageCount > 1 && (
              <div className="flex gap-3 overflow-x-auto rounded-xl border border-border bg-white p-3 shadow-subtle no-scrollbar">
                {property.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => goToImage(index)}
                    className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg"
                  >
                    <img
                      src={image}
                      alt={`${toTitleCase(property.title)} thumbnail ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
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

            {/* Header: title, badges, address, price, brokerage, quick facts — always visible above the tabs. */}
            <section className="rounded-2xl border border-border border-t-4 border-t-primary bg-white p-6 shadow-[0_10px_30px_rgba(15,31,61,0.08)] sm:p-8">
              <h1 className="font-serif text-xl font-semibold leading-snug text-charcoal sm:text-2xl md:text-3xl">
                {toTitleCase(property.title)}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm capitalize">
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
                    <Check size={14} />
                    Verified
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin size={16} className="flex-shrink-0 text-gold" />
                <span>{toTitleCase(property.location)}</span>
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
            </section>

            {overviewCards.length > 0 && (
              <section className="rounded-xl border border-border bg-white p-6 shadow-subtle">
                <h2 className="mb-4 text-xl font-bold text-charcoal">Property Overview</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {overviewCards.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#F0EEE9] text-gold">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground">{label}</p>
                        <p className="mt-0.5 text-[15px] font-semibold capitalize leading-tight text-text-primary break-words">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tab navigation — anchor/scroll-spy, not a filter: every section
                below always renders, this just smooth-scrolls to it and
                highlights whichever one is currently in view. Sticky right
                below the top header once scrolled past. */}
            <div className="sticky top-16 z-30 border-b border-border bg-white/95 backdrop-blur-md">
              <div className="flex gap-6 overflow-x-auto no-scrollbar sm:gap-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => scrollToTab(tab.key)}
                    className={`relative flex-shrink-0 whitespace-nowrap pb-3 pt-4 text-[14px] transition-colors ${
                      activeTab === tab.key ? 'font-semibold text-primary' : 'font-medium text-muted-foreground hover:text-charcoal'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.span
                        layoutId="detailTabUnderline"
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {description && (
              <section
                ref={setSectionRef('overview')}
                data-tab-section="overview"
                className="scroll-mt-28 rounded-2xl border border-border bg-white p-5 shadow-subtle sm:p-6"
              >
                <h2 className="mb-2 font-serif text-xl font-bold text-charcoal">Description</h2>
                <p className="line-clamp-4 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {description}
                </p>
              </section>
            )}

            <section
              ref={setSectionRef('locality')}
              data-tab-section="locality"
              className="scroll-mt-28 space-y-4 rounded-2xl border border-border bg-white p-5 shadow-subtle sm:p-6"
            >
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border shadow-subtle sm:h-96">
                <iframe
                  title="Property location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {nearbyByCategory.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {nearbyByCategory.map(({ category, places }) => {
                    const Icon = category.icon;
                    return (
                      <div key={category.key} className="w-72 flex-shrink-0 rounded-xl bg-[#F0EEE9] p-5">
                        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-charcoal">
                          <Icon size={18} className="text-gold" />
                          {category.label}
                        </h3>
                        <div>
                          {places.map((place, index) => {
                            const distanceMeters = propertyHasCoords
                              ? haversineDistanceMeters(property.latitude!, property.longitude!, place.lat, place.lng)
                              : null;
                            const distanceLabel =
                              distanceMeters !== null
                                ? `${formatDistance(distanceMeters).replace(' away', '')} • ${estimateTravelMinutes(distanceMeters)} mins`
                                : place.distance;
                            return (
                              <div key={`${place.name}-${index}`} className={index < places.length - 1 ? 'mb-4' : ''}>
                                <p className="truncate text-sm font-bold text-text-primary">{place.name}</p>
                                <p className="mt-0.5 text-[13px] text-muted-foreground">{distanceLabel}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {property.amenities.length > 0 && (
              <section
                ref={setSectionRef('amenities')}
                data-tab-section="amenities"
                className="scroll-mt-28 rounded-2xl border border-border bg-white p-5 shadow-subtle sm:p-6"
              >
                <h2 className="mb-4 font-serif text-xl font-bold text-charcoal sm:text-2xl">Amenities</h2>
                <motion.div
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
                  variants={reduce ? undefined : staggerFastContainer}
                  initial={reduce ? undefined : 'hidden'}
                  whileInView={reduce ? undefined : 'visible'}
                  viewport={{ once: true, margin: '-40px' }}
                >
                  {property.amenities.map((amenity) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <motion.div
                        key={amenity}
                        variants={reduce ? undefined : scaleIn}
                        className="flex flex-col items-center gap-2 text-center"
                      >
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                          <Icon size={20} />
                        </span>
                        <span className="text-xs font-medium leading-tight text-text-primary sm:text-sm">{amenity}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </section>
            )}

            {summaryRows.length > 0 && (
              <section
                ref={setSectionRef('summary')}
                data-tab-section="summary"
                className="scroll-mt-28 rounded-2xl border border-border bg-white p-5 shadow-subtle sm:p-6"
              >
                <button
                  type="button"
                  onClick={() => setSummaryOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h2 className="font-serif text-xl font-bold text-charcoal sm:text-2xl">About Home</h2>
                  <ChevronDown size={18} className={`text-muted-foreground transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                </button>
                {summaryOpen && (
                  <div className="mt-4 overflow-hidden rounded-md border border-border bg-white text-sm">
                    {summaryRows.map((row, index) => (
                      <div
                        key={row.label}
                        className={`flex justify-between px-4 py-3 ${index < summaryRows.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold text-text-primary">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {similarProperties.length > 0 && (
              <section ref={setSectionRef('similar')} data-tab-section="similar" className="scroll-mt-28">
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

          <aside className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_14px_40px_rgba(15,31,61,0.12)] lg:sticky lg:top-6"
            >
              <div className="bg-charcoal p-6 text-white">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Nova Nest Advisory</p>
                <div className="text-3xl font-bold text-accent">{formatPrice(property.price)}</div>
                {showPerSqft && <p className="mt-1 text-sm font-semibold text-white/80">{perSqftLabel}</p>}
                <p className="mt-2 text-sm text-white/70">{toTitleCase(property.location)}</p>
              </div>

              <div className="space-y-3 p-6">
                <button onClick={() => openLead('contact-owner')} className="h-12 w-full rounded-md bg-charcoal font-semibold text-white shadow-subtle transition-all duration-[250ms] hover:bg-charcoal hover:shadow-medium">
                  Contact Owner
                </button>
                <button onClick={() => openLead('schedule-visit')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-primary bg-white font-semibold text-primary transition-colors hover:bg-gold/10">
                  <Calendar size={16} />
                  Schedule Visit
                </button>
                {property.brochure && (
                  <button onClick={() => openLead('request-info')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold">
                    <Download size={16} />
                    Download Brochure
                  </button>
                )}

              <div className="mt-5 space-y-3 border-t border-border pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-gold/60 p-1">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gold text-white shadow-inner">
                      <User size={20} />
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-lg font-bold text-charcoal">Nova Nest Advisor</div>
                    <div className="text-xs text-muted-foreground">Verified Property Team</div>
                  </div>
                </div>

                <button onClick={handleCall} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold">
                  <Phone size={16} />
                  Call Agent
                </button>
                <button onClick={handleWhatsApp} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] font-semibold text-white shadow-subtle transition-colors hover:bg-[#1EBE57]">
                  <WhatsAppIcon size={16} />
                  WhatsApp
                </button>
                <button
                  onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white font-semibold text-text-primary transition-colors hover:bg-surface hover:text-gold"
                >
                  <Share2 size={16} />
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
                {property.status === 'buy' ? 'For Sale' : 'For Rent'} · {toTitleCase(property.location)}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleCall}
                aria-label="Call agent"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white text-charcoal transition-colors hover:text-gold"
              >
                <Phone size={18} />
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex min-h-[44px] items-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-subtle transition-colors hover:bg-[#1EBE57]"
              >
                <WhatsAppIcon size={16} />
                WhatsApp
              </button>
            </div>
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
                    <X size={22} />
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

      <WhatsAppContactModal
        open={showWhatsappModal}
        onClose={() => setShowWhatsappModal(false)}
        onSubmit={submitWhatsappLead}
      />
    </div>
  );
};
