import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters } from '../types';
import { getAllProperties } from '../services/storageService';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { motion } from 'motion/react';
import { Building2, ChevronDown, Filter, Grid3x3, IndianRupee, List, Search, BedDouble, Bath, Maximize2, MapPin } from 'lucide-react';

interface HomePageProps {
  onPropertyClick: (property: Property) => void;
  onSearch: (filters: PropertyFilters) => void;
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

const budgetOptions = [
  { label: 'All Budgets', min: undefined, max: undefined },
  { label: 'Under ₹50L', min: undefined, max: 5000000 },
  { label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
  { label: '₹1Cr - ₹3Cr', min: 10000000, max: 30000000 },
  { label: '₹3Cr+', min: 30000000, max: undefined },
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

const categoryLabel = (cat: string) => {
  if (cat === 'land') return 'Plot';
  if (cat === 'condo') return 'Commercial';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

export const HomePage: React.FC<HomePageProps> = ({ onPropertyClick, onSearch }) => {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'buy' | 'rent' | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [priceRange, setPriceRange] = useState([500000, 100000000]);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState('All Budgets');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => { loadProperties(); }, []);

  useEffect(() => { applyFilters(); }, [allProperties, selectedCategory, selectedStatus, sortBy, priceRange, selectedBedrooms, selectedAmenities]);

  const loadProperties = async () => {
    try {
      const properties = await getAllProperties();
      setAllProperties(properties);
      setFilteredProperties(properties.filter((p) => p.featured).slice(0, 9));
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
  };

  return (
    <div className="min-h-screen bg-cream" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative min-h-[700px] text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=85"
          alt="Luxury home"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0F1B2D]/55" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto text-center"
          >
            <span className="inline-flex items-center bg-[#0F1B2D]/85 text-gold border border-gold rounded-sm px-4 py-2 text-xs font-semibold mb-6 tracking-[0.14em] uppercase">
              India's Trusted Property Platform
            </span>

            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-4">
              <span className="block text-white">My-Properties</span>
              <span className="block text-gold">Property in India</span>
            </h1>
            <p className="text-base md:text-lg text-white/75 mb-10">
              Verified homes, plots, and commercial addresses curated with care.
            </p>

            {/* ── Search Box ── */}
            <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.22)]">

              {/* Row 1 — Location */}
              <div className="flex items-center border-b border-black/[0.07] px-5">
                <LocationAutocomplete
                  value={filters.location || ''}
                  onChange={handleLocationChange}
                  onSelect={(location) => setFilters({ ...filters, location })}
                  locations={allProperties.map((p) => p.location)}
                  className="flex-1"
                  inputClassName="h-14 w-full bg-transparent text-[15px] font-medium text-charcoal placeholder-charcoal/35 focus:outline-none pl-8"
                />
              </div>

              {/* Row 2 — Filters + Search */}
              <div className="flex items-center px-4 py-3 gap-3">

                {/* Buy / Rent */}
                <div className="flex items-center bg-[#f5f5f5] rounded-xl p-1 gap-0.5 flex-shrink-0">
                  {(['buy', 'rent'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                        selectedStatus === s ? 'bg-charcoal text-gold shadow-sm' : 'text-charcoal/50 hover:text-charcoal'
                      }`}
                    >
                      {s === 'buy' ? 'Buy' : 'Rent'}
                    </button>
                  ))}
                </div>

                <div className="w-px h-7 bg-black/10 flex-shrink-0" />

                {/* Budget */}
                <div className="flex items-center gap-2 flex-1 min-w-0 bg-[#f5f5f5] rounded-xl px-3 py-2.5">
                  <IndianRupee size={14} className="text-gold flex-shrink-0" />
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="flex-1 min-w-0 appearance-none bg-transparent text-[13px] font-semibold text-charcoal outline-none cursor-pointer"
                  >
                    {budgetOptions.map((o) => (
                      <option key={o.label} value={o.label}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="text-charcoal/35 flex-shrink-0 pointer-events-none" />
                </div>

                <div className="w-px h-7 bg-black/10 flex-shrink-0" />

                {/* Type */}
                <div className="flex items-center gap-2 flex-1 min-w-0 bg-[#f5f5f5] rounded-xl px-3 py-2.5">
                  <Building2 size={14} className="text-gold flex-shrink-0" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="flex-1 min-w-0 appearance-none bg-transparent text-[13px] font-semibold text-charcoal outline-none cursor-pointer"
                  >
                    {typeOptions.map((o) => (
                      <option key={o.label} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="text-charcoal/35 flex-shrink-0 pointer-events-none" />
                </div>

                {/* Search btn */}
                <button
                  onClick={search}
                  className="flex-shrink-0 h-11 px-7 rounded-xl bg-charcoal text-gold text-[13px] font-bold flex items-center gap-2 hover:bg-charcoal/85 active:scale-[0.97] transition-all duration-200"
                >
                  <Search size={15} />
                  Search
                </button>
              </div>
            </div>

            {/* Popular locations */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-white/60 text-[13px]">Popular:</span>
              {['Whitefield', 'Marathahalli', 'Bellandur', 'Hoodi'].map((place) => (
                <button
                  key={place}
                  onClick={() => handlePopularLocation(place)}
                  className="rounded-full border border-white/35 px-4 py-1.5 text-[13px] text-white hover:bg-white/10 transition-all"
                >
                  {place}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORY FILTER BAR ── */}
      <section className="sticky top-16 z-40 bg-white border-b border-black/[0.06] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            <div className="flex rounded-full bg-[#f5f5f5] p-1 gap-0.5">
              {categoryChips.map((chip) => (
                <button
                  key={chip.value || 'all'}
                  onClick={() => setSelectedCategory(chip.value)}
                  className={`h-9 px-4 text-[13px] rounded-full font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === chip.value ? 'bg-charcoal text-gold shadow-sm' : 'text-charcoal/55 hover:text-charcoal'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className="h-10 border border-black/10 bg-white text-charcoal/65 px-4 rounded-lg hover:border-gold/50 hover:text-gold transition-all text-[13px] font-semibold flex items-center gap-2"
              >
                <Filter size={15} />
                Filters
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="h-10 border border-black/10 bg-white text-charcoal/65 px-4 rounded-lg hover:border-gold/50 hover:text-gold transition-all text-[13px] font-semibold flex items-center gap-2"
                >
                  Sort <ChevronDown size={14} />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-black/10 rounded-xl shadow-lg py-1.5 z-50">
                    {['newest', 'oldest', 'price-asc', 'price-desc', 'area-asc', 'area-desc'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-gold/10 hover:text-gold transition-colors"
                      >
                        {opt.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-10 w-10 border border-black/10 bg-white text-charcoal/65 rounded-lg hover:border-gold/50 hover:text-gold transition-all flex items-center justify-center"
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

      {/* ── FILTER DRAWER ── */}
      {showFilterDrawer && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowFilterDrawer(false)} />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: showFilterDrawer ? 0 : '100%' }}
        transition={{ duration: 0.28 }}
        className="fixed right-0 top-32 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto z-50 lg:hidden"
      >
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-bold text-charcoal">Filters</h3>
          <div>
            <label className="block text-[13px] font-semibold text-charcoal mb-2">
              Budget: {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
            </label>
            <input
              type="range" min="500000" max="100000000" step="100000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-gold"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-charcoal mb-2">Bedrooms</label>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((bed) => (
                <button
                  key={bed}
                  onClick={() =>
                    setSelectedBedrooms((cur) =>
                      cur.includes(bed) ? cur.filter((b) => b !== bed) : [...cur, bed]
                    )
                  }
                  className={`py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    selectedBedrooms.includes(bed) ? 'bg-charcoal text-gold' : 'bg-[#f5f5f5] text-charcoal hover:text-gold'
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
                    className="rounded accent-gold"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── LISTINGS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-bold mb-1">Curated Listings</p>
          <h2 className="text-3xl font-bold text-charcoal">
            {filteredProperties.length} Properties Found
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-black/8" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-black/8 rounded w-3/4" />
                  <div className="h-3 bg-black/8 rounded w-1/2" />
                  <div className="h-3 bg-black/8 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-charcoal/35 text-base font-medium">No properties match your filters</p>
          </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.13)] transition-all duration-300 hover:-translate-y-0.5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {/* ── Image ── */}
                <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#f5f5f5] to-black/10 flex items-center justify-center">
                      <Building2 size={36} className="text-charcoal/20" />
                    </div>
                  )}

                  {/* Badges top-left */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {property.featured && (
                      <span className="bg-[#1a2744] text-gold text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                        🔥 New Launch
                      </span>
                    )}
                    <span className="bg-amber-400 text-[#1a2744] text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {categoryLabel(property.category)}
                    </span>
                  </div>

                  {/* View pill bottom-right */}
                  <button
                    onClick={() => onPropertyClick(property)}
                    className="absolute bottom-3 right-3 bg-white/95 text-charcoal text-[12px] font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 hover:bg-white transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
                    View
                  </button>
                </div>

                {/* ── Card Body ── */}
                <div className="p-4 pb-5">

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-[#1a1a1a] leading-tight mb-1 line-clamp-1 tracking-[-0.01em]">
                    {property.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin size={12} className="text-gold flex-shrink-0" />
                    <span className="text-[12px] font-medium text-[#888] truncate">{property.location}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#f0f0f0]">
                    {property.bedrooms > 0 && (
                      <div className="flex items-center gap-1.5">
                        <BedDouble size={14} className="text-[#aaa]" />
                        <span className="text-[13px] font-semibold text-[#333]">{property.bedrooms} BHK</span>
                      </div>
                    )}
                    {property.bathrooms > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Bath size={14} className="text-[#aaa]" />
                        <span className="text-[13px] font-semibold text-[#333]">{property.bathrooms} Bath</span>
                      </div>
                    )}
                    {property.areaSqft > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Maximize2 size={13} className="text-[#aaa]" />
                        <span className="text-[13px] font-semibold text-[#333]">{property.areaSqft.toLocaleString()} ft²</span>
                      </div>
                    )}
                  </div>

                  {/* Price row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[22px] font-extrabold text-[#1a1a1a] leading-none tracking-[-0.02em]">
                        {formatPrice(property.price)}
                      </p>
                      <p className="text-[11px] font-medium text-[#aaa] mt-0.5">onwards</p>
                    </div>
                    {property.bedrooms > 0 && (
                      <span className="text-[12px] font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-lg">
                        {property.bedrooms} BHK
                      </span>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPropertyClick(property)}
                      className="py-2.5 rounded-xl bg-[#1a2744] text-white text-[13px] font-bold tracking-wide hover:bg-[#0f1b2d] transition-colors"
                    >
                      BOOK VISIT
                    </button>
                    <button
                      onClick={() => onPropertyClick(property)}
                      className="py-2.5 rounded-xl bg-gold text-[#1a2744] text-[13px] font-bold tracking-wide hover:brightness-95 transition-all"
                    >
                      ENQUIRE
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
