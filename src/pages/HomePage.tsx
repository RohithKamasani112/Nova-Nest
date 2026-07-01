import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Property, PropertyFilters } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Grid3x3,
  IndianRupee,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { EASE_ELEGANT, staggerContainer } from '../lib/animation';
import { HeroVideoBackground } from '../components/HeroVideoBackground';
import { Seo } from '../components/Seo';
import { organizationJsonLd, websiteJsonLd } from '../utils/seo';

const AnimatedHeading: React.FC<{ text: string; reduce: boolean; start?: boolean; className?: string; delayStart?: number; style?: React.CSSProperties }> = ({
  text,
  reduce,
  start = true,
  className,
  delayStart = 0.15,
  style,
}) => {
  if (reduce) return <span className={className} style={style}>{text}</span>;
  return (
    <span className={className} style={style} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          aria-hidden
          className="inline-block"
          style={{ whiteSpace: 'pre' }}
          initial={{ opacity: 0, y: 22 }}
          animate={start ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          transition={{ duration: 0.6, delay: delayStart + i * 0.035, ease: EASE_ELEGANT }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </span>
  );
};

interface HomePageProps {
  onPropertyClick: (property: Property) => void;
  onSearch: (filters: PropertyFilters) => void;
  // True once the initial splash loader has finished. The hero text animations
  // are held until then, otherwise they play (and complete) hidden behind the
  // splash on first load and the user never sees them.
  appReady?: boolean;
}

const categoryChips = [
  { label: 'All', value: null },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Villa', value: 'villa' },
  { label: 'House', value: 'house' },
  { label: 'Plot', value: 'land' },
  { label: 'Commercial', value: 'condo' },
];

const amenitiesOptions = ['Pool', 'Gym', 'Parking', 'Garden', 'Security', 'Lift', 'Power Backup', 'Club House'];

const buyBudgetOptions = [
  { label: 'All Budgets', min: undefined, max: undefined },
  { label: 'Under ₹50 L', min: undefined, max: 5000000 },
  { label: '₹50 L - ₹1 Cr', min: 5000000, max: 10000000 },
  { label: '₹1 Cr - ₹3 Cr', min: 10000000, max: 30000000 },
  { label: '₹3 Cr+', min: 30000000, max: undefined },
];

const rentBudgetOptions = [
  { label: 'Below ₹30,000/mo', min: undefined, max: 30000 },
  { label: '₹30,000 - ₹50,000/mo', min: 30000, max: 50000 },
  { label: '₹50,000 - ₹1 L/mo', min: 50000, max: 100000 },
  { label: 'Above ₹1 L/mo', min: 100000, max: undefined },
];

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Villa', value: 'villa' },
  { label: 'House', value: 'house' },
  { label: 'Plot', value: 'land' },
  { label: 'Commercial', value: 'condo' },
];

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString()}`;
};

interface LocationFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: string) => void;
  locations: string[];
}

const LocationField: React.FC<LocationFieldProps> = ({ value, onChange, onSelect, locations }) => {
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const unique = Array.from(new Set(locations.filter(Boolean)));
    const query = value.trim().toLowerCase();
    const matches = query ? unique.filter((loc) => loc.toLowerCase().includes(query)) : unique;
    return matches.slice(0, 8);
  }, [locations, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const open = focused && suggestions.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = suggestions[highlight];
      if (pick) {
        onSelect(pick);
        setFocused(false);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setHighlight(0); }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="Enter location..."
        className="h-9 w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
          aria-label="Clear location"
        >
          <X size={15} />
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-[calc(100%+14px)] z-50 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl border border-charcoal/10 bg-white py-2 text-left shadow-[0_24px_48px_rgba(0,0,0,0.25)]">
          {suggestions.map((loc, i) => (
            <button
              key={loc}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(loc); setFocused(false); }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                highlight === i ? 'bg-accent/10' : 'hover:bg-charcoal/[0.04]'
              }`}
            >
              <MapPin size={15} className="flex-shrink-0 text-accent" />
              <span className="truncate text-[13px] font-medium text-charcoal sm:text-sm">{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onPropertyClick, onSearch, appReady = true }) => {
  // Gate the on-mount hero animations until the splash is gone.
  const start = appReady;
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'buy' | 'rent' | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showHeroFilters, setShowHeroFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState('All Budgets');
  const [selectedType, setSelectedType] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);

  const budgetOptions = selectedStatus === 'rent' ? rentBudgetOptions : buyBudgetOptions;

  const handleStatusToggle = (next: 'buy' | 'rent') => {
    setSelectedStatus(next);
    setSelectedBudget('All Budgets');
  };

  const reduce = useReducedMotion();

  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 90]);
  const heroFade = useTransform(scrollY, [0, 420], [1, reduce ? 1 : 0.35]);

  const [smallScreen, setSmallScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setSmallScreen(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const staticHero = Boolean(reduce) || smallScreen;

  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: start ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }, transition: { duration: 0.6, delay, ease: EASE_ELEGANT } };

  useEffect(() => { loadProperties(); }, []);
  useEffect(() => { applyFilters(); }, [allProperties, selectedCategory, selectedStatus, sortBy, priceRange, selectedBedrooms, selectedAmenities]);

  const loadProperties = async () => {
    try {
      const properties = await getAllProperties();
      const activeProperties = properties.filter((property) => property.isActive !== false);
      setAllProperties(activeProperties);
      setFilteredProperties(activeProperties.slice(0, 9));
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProperties];
    if (selectedStatus) filtered = filtered.filter((p) => p.status === selectedStatus);
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedBedrooms.length > 0) filtered = filtered.filter((p) => selectedBedrooms.includes(p.bedrooms));
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((p) => selectedAmenities.some((a) => p.amenities.includes(a)));
    }
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'area-asc': filtered.sort((a, b) => a.areaSqft - b.areaSqft); break;
      case 'area-desc': filtered.sort((a, b) => b.areaSqft - a.areaSqft); break;
      default: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setFilteredProperties(filtered.slice(0, 9));
  };

  const handleLocationChange = (location: string) => setFilters({ ...filters, location });

  const handlePopularLocation = (location: string) => {
    const nextFilters = { ...filters, location };
    setFilters(nextFilters);
    window.history.pushState({}, '', `?location=${encodeURIComponent(location)}`);
    onSearch(nextFilters);
  };

  const search = () => {
    const budget = budgetOptions.find((o) => o.label === selectedBudget);
    onSearch({
      ...filters,
      status: selectedStatus || undefined,
      category: selectedType ? [selectedType as Property['category']] : undefined,
      priceMin: budget?.min,
      priceMax: budget?.max,
    });
    setShowHeroFilters(false);
  };

  const activeFilterCount = (selectedBudget !== 'All Budgets' ? 1 : 0) + (selectedType ? 1 : 0);

  return (
    <div className="min-h-screen bg-cream" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Seo
        title="Nova Nest | Buy, Rent & Sell Property in Bengaluru"
        description="Nova Nest Property Management — discover verified apartments, villas, plots and commercial spaces for sale and rent in Whitefield, Marathahalli, Bellandur and across Bengaluru."
        path="/"
        jsonLd={[organizationJsonLd(), websiteJsonLd()]}
      />

      {/* ================================================================= */}
      {/* HERO                                                              */}
      {/* ================================================================= */}
      <section ref={heroRef} className="relative min-h-[680px] text-white sm:min-h-[760px]">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div style={reduce ? undefined : { y: heroParallax, opacity: heroFade }} className="absolute inset-0">
            <HeroVideoBackground staticOnly={staticHero} />
          </motion.div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-32 pb-16 sm:px-6 sm:py-28 lg:px-8 md:py-36">
          <div className="text-center">

            {/* Eyebrow */}
            <motion.p
              {...fadeUp(0)}
              className="font-serif italic text-sm sm:text-base text-accent/90 mb-5 tracking-wide"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8)' }}
            >
              Est. Whitefield, Bangalore — Curated Since Day One
            </motion.p>

            <h1 className="font-serif t-display tracking-tight mb-5">
              <AnimatedHeading
                text="Nova Nest"
                reduce={Boolean(reduce)}
                start={start}
                className="block text-white"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 8px 40px rgba(0,0,0,0.85)' }}
              />
              <span
                className="relative inline-block"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 8px 32px rgba(0,0,0,0.8))' }}
              >
                <motion.span
                  className="block text-accent"
                  style={
                    reduce
                      ? undefined
                      : {
                          backgroundImage:
                            'linear-gradient(90deg, #8C6B2E 0%, #C9A35F 35%, #E0BB76 50%, #C9A35F 65%, #8C6B2E 100%)',
                          backgroundSize: '200% auto',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'transparent',
                        }
                  }
                  initial={reduce ? undefined : { backgroundPosition: '200% center' }}
                  animate={reduce ? undefined : start ? { backgroundPosition: '-200% center' } : { backgroundPosition: '200% center' }}
                  transition={reduce ? undefined : { duration: 2.4, delay: 0.9, ease: 'easeInOut' }}
                >
                  Property in Benguluru
                </motion.span>
                {!reduce && (
                  <motion.svg
                    viewBox="0 0 320 12"
                    className="absolute left-1/2 -bottom-2 h-3 w-[88%] -translate-x-1/2"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d="M4 7 C 80 2, 240 2, 316 7"
                      stroke="#C9A35F"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={start ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
                      transition={{ duration: 1, delay: 1.5, ease: EASE_ELEGANT }}
                    />
                  </motion.svg>
                )}
              </span>
            </h1>

            <motion.p
              {...fadeUp(0.3)}
              className="text-sm sm:text-base md:text-lg text-white/90 mb-12 max-w-xl mx-auto"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8)' }}
            >
              Verified homes, plots, and commercial addresses curated with care.
            </motion.p>

            {/* Search bar */}
            <motion.div {...fadeUp(0.45)} className="w-full max-w-3xl mx-auto relative">
              {!reduce && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 animate-[borderTravel_4s_linear_infinite]"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0%, transparent 55%, #C9A35F 70%, #E0BB76 80%, #F4DDA0 87%, #FCEDC4 90%, #F4DDA0 93%, #E0BB76 97%, transparent 100%)',
                    WebkitMask:
                      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '1px',
                  }}
                />
              )}

              <div className="relative flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:gap-1">
                <div className="relative flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 sm:py-2">
                  <MapPin size={17} className="text-accent flex-shrink-0" />
                  <LocationField
                    value={filters.location || ''}
                    onChange={handleLocationChange}
                    onSelect={(location) => setFilters({ ...filters, location })}
                    locations={allProperties.map((p) => p.location)}
                  />
                </div>

                <div className="hidden h-7 w-px bg-white/15 sm:block" />

                <div className="flex h-11 flex-shrink-0 items-center gap-1 rounded-xl bg-white/[0.06] p-1">
                  {(['buy', 'rent'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusToggle(s)}
                      className={`relative min-h-[36px] flex-1 rounded-lg px-4 text-[13px] font-semibold transition-colors duration-200 sm:flex-none ${
                        selectedStatus === s ? 'text-charcoal' : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {selectedStatus === s && (
                        <motion.span
                          layoutId="buyRentPillHero"
                          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 20 }}
                          className="absolute inset-0 rounded-lg bg-accent"
                        />
                      )}
                      <span className="relative z-10">{s === 'buy' ? 'Buy' : 'Rent'}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowHeroFilters((v) => !v)}
                  className="relative flex h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-charcoal">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown size={13} className={`transition-transform ${showHeroFilters ? 'rotate-180' : ''}`} />
                </button>

                <motion.button
                  onClick={search}
                  whileHover={reduce ? undefined : { scale: 1.03 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.2, ease: EASE_ELEGANT }}
                  className="flex h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[13px] font-bold text-charcoal hover:bg-accent/90"
                >
                  <Search size={15} />
                  Search
                </motion.button>
              </div>

              {/* Expanding filters panel */}
              <AnimatePresence>
                {showHeroFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.25, ease: EASE_ELEGANT }}
                    className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-white/15 bg-charcoal/95 text-left backdrop-blur-xl shadow-2xl z-50"
                  >
                    <div className="max-h-[60vh] overflow-y-auto p-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent/80">
                          <IndianRupee size={13} /> Budget
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {budgetOptions.map((o) => (
                            <button
                              key={o.label}
                              onClick={() => setSelectedBudget(o.label)}
                              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                selectedBudget === o.label
                                  ? 'border-accent bg-accent text-charcoal'
                                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent/80">
                          <Building2 size={13} /> Property Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {typeOptions.map((o) => (
                            <button
                              key={o.label}
                              onClick={() => setSelectedType(o.value)}
                              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                selectedType === o.value
                                  ? 'border-accent bg-accent text-charcoal'
                                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2 border-t border-white/10 pt-4">
                      <button
                        onClick={() => { setSelectedBudget('All Budgets'); setSelectedType(''); }}
                        className="px-3 py-2 text-[12px] font-semibold text-white/60 hover:text-white"
                      >
                        Reset
                      </button>
                      <button
                        onClick={search}
                        className="rounded-lg bg-accent px-4 py-2 text-[12px] font-bold text-charcoal hover:bg-accent/90"
                      >
                        Apply
                      </button>
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Popular locations */}
            <motion.div {...fadeUp(0.6)} className="mt-9 flex flex-wrap items-center justify-center gap-2 text-sm sm:mt-10 sm:gap-3">
              <span className="text-white/55 text-[13px]">Popular:</span>
              {['Whitefield', 'Marathahalli', 'Bellandur', 'Hoodi'].map((place, i) => (
                <motion.button
                  key={place}
                  {...(reduce
                    ? {}
                    : {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.4, delay: 0.6 + i * 0.05, ease: EASE_ELEGANT },
                      })}
                  whileHover={reduce ? undefined : { scale: 1.05, borderColor: 'rgba(201,163,95,0.6)' }}
                  onClick={() => handlePopularLocation(place)}
                  className="rounded-full border border-white/25 px-3.5 py-1.5 text-[12px] text-white/85 transition-colors hover:text-white sm:px-4 sm:text-[13px]"
                >
                  {place}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Brass hairline bottom rule */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </section>

      {/* ================================================================= */}
      {/* STICKY FILTER / CATEGORY BAR                                      */}
      {/* ================================================================= */}
      <section className="sticky top-16 z-40 border-b border-charcoal/[0.07] bg-cream/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-full gap-1 overflow-x-auto no-scrollbar">
              {categoryChips.map((chip) => (
                <button
                  key={chip.value || 'all'}
                  onClick={() => setSelectedCategory(chip.value)}
                  className={`relative h-9 flex-shrink-0 whitespace-nowrap px-4 text-[13px] font-semibold transition-colors duration-200 ${
                    selectedCategory === chip.value ? 'text-charcoal' : 'text-charcoal/50 hover:text-charcoal'
                  }`}
                >
                  <span className="relative z-10">{chip.label}</span>
                  {selectedCategory === chip.value && (
                    <motion.span
                      layoutId="categoryUnderline"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }}
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_1fr_40px] items-center gap-2 md:flex md:flex-shrink-0">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className="h-10 border border-charcoal/10 bg-white text-charcoal/65 px-3 rounded-lg hover:border-accent/50 hover:text-accent transition-all text-[13px] font-semibold flex items-center justify-center gap-2 sm:px-4"
              >
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="h-10 w-full border border-charcoal/10 bg-white text-charcoal/65 px-3 rounded-lg hover:border-accent/50 hover:text-accent transition-all text-[13px] font-semibold flex items-center justify-center gap-2 sm:px-4"
                >
                  Sort <ChevronDown size={14} />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-charcoal/10 rounded-xl shadow-lg py-1.5 z-50">
                    {['newest', 'oldest', 'price-asc', 'price-desc', 'area-asc', 'area-desc'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-accent/10 hover:text-accent transition-colors"
                      >
                        {opt.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-10 w-10 border border-charcoal/10 bg-white text-charcoal/65 rounded-lg hover:border-accent/50 hover:text-accent transition-all flex items-center justify-center"
                aria-label="Toggle listing view"
              >
                {viewMode === 'grid' ? <List size={16} /> : <Grid3x3 size={16} />}
              </button>
            </div>
          </div>
          <p className="text-[12px] text-charcoal/40 font-medium mt-2">
            {filteredProperties.length} properties found
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* MOBILE FILTER DRAWER                                              */}
      {/* ================================================================= */}
      {showFilterDrawer && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowFilterDrawer(false)} />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: showFilterDrawer ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: EASE_ELEGANT }}
        className="fixed right-0 top-0 bottom-0 w-[min(100vw,22rem)] bg-white shadow-2xl overflow-y-auto z-50 lg:hidden"
      >
        <div className="p-5 pt-20 space-y-6 sm:p-6 sm:pt-24">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-serif font-bold text-charcoal">Filters</h3>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="h-9 px-3 rounded-lg bg-[#f5f5f5] text-[13px] font-semibold text-charcoal"
            >
              Close
            </button>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-charcoal mb-2">
              Budget: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </label>
            <input
              type="range" min="0" max="100000000" step="100000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-accent"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-charcoal mb-2">Bedrooms</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((bed) => (
                <button
                  key={bed}
                  onClick={() =>
                    setSelectedBedrooms((cur) =>
                      cur.includes(bed) ? cur.filter((b) => b !== bed) : [...cur, bed]
                    )
                  }
                  className={`py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    selectedBedrooms.includes(bed) ? 'bg-charcoal text-accent' : 'bg-[#f5f5f5] text-charcoal hover:text-accent'
                  }`}
                >
                  {bed}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-charcoal mb-2">Amenities</label>
            <div className="space-y-2">
              {amenitiesOptions.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2.5 cursor-pointer text-[13px] text-charcoal/70">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) =>
                      setSelectedAmenities((cur) =>
                        e.target.checked ? [...cur, amenity] : cur.filter((a) => a !== amenity)
                      )
                    }
                    className="rounded accent-accent"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* LISTINGS                                                          */}
      {/* ================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          {...(reduce
            ? {}
            : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.6, ease: EASE_ELEGANT } })}
          className="mb-10 flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent font-bold mb-2">Curated Listings</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
              {filteredProperties.length} Properties Found
            </h2>
          </div>
          <div className="hidden h-px flex-1 bg-charcoal/10 sm:block" />
        </motion.div>

        {loading ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                animate={reduce ? undefined : { opacity: [0.4, 0.8, 0.4] }}
                transition={reduce ? undefined : { repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: i * 0.08 }}
                className="bg-white rounded-2xl overflow-hidden border border-charcoal/[0.06]"
              >
                <div className="aspect-[4/3] bg-black/8" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-black/8 rounded w-3/4" />
                  <div className="h-3 bg-black/8 rounded w-1/2" />
                  <div className="h-3 bg-black/8 rounded w-2/3" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-charcoal/35 text-base font-medium">No properties match your filters</p>
          </div>
        ) : (
          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'visible'}
            viewport={{ once: true, margin: '-60px' }}
            className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={index}
                onClick={() => onPropertyClick(property)}
              />
            ))}
          </motion.div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <motion.div
            {...(reduce
              ? {}
              : { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.2 } })}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={() => onSearch(filters)}
              className="group flex items-center gap-2 rounded-full border border-charcoal/15 px-6 py-3 text-[13px] font-semibold text-charcoal transition-colors hover:border-accent hover:text-accent"
            >
              View All Properties
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </section>

      <style>{`
        @keyframes borderTravel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};