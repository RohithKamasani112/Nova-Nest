import toast from 'react-hot-toast';
import { readPreference, savePreference } from '../utils/browserPreferences';
import { PropertyComparison } from '../components/PropertyComparison';
import { readPropertySearch, writePropertySearch, filterRangeError, matchesBhk, CATEGORY_LABELS } from '../utils/propertySearchState';
import { resolveLocality, localityKey } from '../utils/propertyLocalities';
import { usePropertyRefresh } from '../hooks/usePropertyRefresh';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Property, PropertyFilters, SortOption } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { FilterBar } from '../app/components/FilterBar';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
const PropertyMapView = lazy(() => import('../app/components/PropertyMapView').then(m => ({ default: m.PropertyMapView })));
import { motion } from 'motion/react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Seo } from '../components/Seo';
import { formatDistance, haversineDistanceMeters } from '../utils/nearbyPlaces';

interface PropertiesPageProps {
  onPropertyClick: (property: Property) => void;
  initialFilters?: PropertyFilters;
}

const NEAR_ME_RADIUS_OPTIONS = [2, 5, 10, 25];

export const PropertiesPage: React.FC<PropertiesPageProps> = ({
  onPropertyClick,
  initialFilters = {},
}) => {
  const [initialSearch] = useState(() => readPropertySearch(window.location.search || sessionStorage.getItem('nova-browse-query') || ''));
  const [shortlist, setShortlist] = useState<string[]>(() => { const saved = readPreference<unknown>('nova-shortlist', []); return Array.isArray(saved) ? saved.filter(v => typeof v === 'string').slice(0, 100) : []; });
  const [onlyShortlisted, setOnlyShortlisted] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<{ label: string; query: string }[]>(() => { const saved = readPreference<unknown>('nova-saved-searches', []); return Array.isArray(saved) ? saved.filter(v => typeof v?.label === 'string' && typeof v?.query === 'string').slice(0, 5) : []; });
  const [page, setPage] = useState(initialSearch.page);
  const pageSize = 12;
  const restoring = React.useRef(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>({ ...initialFilters, ...initialSearch.filters });
  const [sortOption, setSortOption] = useState<SortOption>(initialSearch.sort);
  const [searchQuery, setSearchQuery] = useState(initialSearch.query || initialSearch.filters.location || initialFilters.location || '');
  const [appliedSearch, setAppliedSearch] = useState(initialSearch.query);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // "Properties Near Me" — geolocation-driven split map/list view, layered on
  // top of whatever other filters are active.
  const [nearMeActive, setNearMeActive] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'granted' | 'denied' | 'timeout' | 'unsupported' | 'error'>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeRadiusKm, setNearMeRadiusKm] = useState(10);
  const [selectedNearId, setSelectedNearId] = useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const requestNearMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('granted');
        setNearMeActive(true);
      },
      error => setGeoStatus(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const exitNearMe = () => {
    setNearMeActive(false);
    setGeoStatus('idle');
    setSelectedNearId(null);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (initialFilters.nearMe) requestNearMe();
    const pop = () => {
      if (window.location.pathname !== '/properties') return;
      restoring.current = true;
      const next = readPropertySearch(window.location.search);
      setFilters(next.filters); setSortOption(next.sort); setPage(next.page); setAppliedSearch(next.query); setSearchQuery(next.query || next.filters.location || '');
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  const searchState = writePropertySearch(filters, appliedSearch, sortOption, page);
  useEffect(() => {
    if (restoring.current) { restoring.current = false; sessionStorage.setItem('nova-browse-query', searchState); return; }
    sessionStorage.setItem('nova-browse-query', searchState);
    if (window.location.pathname === '/properties' && window.location.search !== searchState) window.history.pushState({}, '', '/properties' + searchState);
  }, [searchState]);
  useEffect(() => {
    if (loading) return;
    const scroll = sessionStorage.getItem('nova-browse-scroll');
    if (scroll) { window.setTimeout(() => window.scrollTo({ top: Number(scroll), behavior: 'auto' }), 100); sessionStorage.removeItem('nova-browse-scroll'); }
  }, [loading]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [properties, filters, sortOption, appliedSearch, onlyShortlisted, shortlist]);

  usePropertyRefresh(() => loadProperties());

  const loadProperties = async () => {
    try {
      const data = await getAllProperties();
      setLoadError(false);
      setProperties(data.filter((property) => property.isActive !== false && !property.archivedAt));
    } catch (error) {
      setLoadError(true);
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    if (filterRangeError(filters)) { setFilteredProperties([]); return; }
    let filtered = onlyShortlisted ? properties.filter(p => shortlist.includes(p.id)) : [...properties];

    // Apply search query
    if (appliedSearch) {
      const query = appliedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          Boolean(p.locality?.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((p) => filters.category?.includes(p.category));
    }

    // Apply price filter
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.priceMax!);
    }

    // Apply bedrooms filter
    if (filters.bedrooms && filters.bedrooms.length > 0) {
      filtered = filtered.filter((p) =>
        matchesBhk(p.bedrooms, filters.bedrooms!)
      );
    }

    // Apply bathrooms filter
    if (filters.bathrooms && filters.bathrooms.length > 0) {
      filtered = filtered.filter((p) =>
        filters.bathrooms?.some((baths) => p.bathrooms >= baths)
      );
    }

    // Apply area filter
    if (filters.areaMin !== undefined) {
      filtered = filtered.filter((p) => p.areaSqft >= filters.areaMin!);
    }
    if (filters.areaMax !== undefined) {
      filtered = filtered.filter((p) => p.areaSqft <= filters.areaMax!);
    }

    // Apply amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((p) =>
        filters.amenities?.every((amenity) => p.amenities.includes(amenity))
      );
    }

    // Apply location filter — matches the structured `locality` field (set by
    // the admin form's Google Places autocomplete) as well as the free-text
    // `location` string, since older listings only have the latter.
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.location.toLowerCase().includes(location) ||
          Boolean(p.locality && p.locality.toLowerCase().includes(location))
      );
    }

    // Apply locality filter — exact-match multi-select (Top Localities
    // carousel / listings filter), ANDed with every other active filter here.
    if (filters.locality && filters.locality.length > 0) {
      filtered = filtered.filter((p) => filters.locality!.some(name => localityKey(name) === localityKey(resolveLocality(p))));
    }

    // Apply featured filter
    if (filters.featured) {
      filtered = filtered.filter((p) => p.featured);
    }

    // Apply verified filter
    if (filters.verified) {
      filtered = filtered.filter((p) => p.verified);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'area-asc':
          return a.areaSqft - b.areaSqft;
        case 'area-desc':
          return b.areaSqft - a.areaSqft;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest':
        default:
          // Urgent listings float to the top regardless of age; newest first within each group.
          if (Boolean(a.urgent) !== Boolean(b.urgent)) return a.urgent ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredProperties(filtered);
  };

  // Filtered/search permutations shouldn't be indexed as separate pages — they
  // point back to the canonical /properties listing instead (requirement #5).
  const isFiltered = Boolean(searchState || nearMeActive ||
    appliedSearch ||
      filters.location ||
      (filters.locality && filters.locality.length) ||
      filters.status ||
      (filters.category && filters.category.length) ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined
  );

  // Clicking a locality card toggles it live (no Apply step) — OR logic among
  // selected localities (handled in applyFiltersAndSort), ANDed with every
  // other active filter. Clicking the same card again deselects it.
  const toggleLocalityFilter = (locality: string) => {
    setFilters((prev) => {
      const current = prev.locality || [];
      const updated = current.includes(locality)
        ? current.filter((l) => l !== locality)
        : [...current, locality];
      return { ...prev, locality: updated.length > 0 ? updated : undefined };
    });
  };

  // Composed with every other active filter (built off filteredProperties, not
  // the raw list) — properties missing lat/lng are excluded rather than
  // breaking the sort. Nearest first.
  const nearMeResults = React.useMemo(() => {
    if (!nearMeActive || !userCoords) return [];
    return filteredProperties
      .filter((p) => p.latitude !== undefined && p.longitude !== undefined)
      .map((p) => ({
        property: p,
        distanceMeters: haversineDistanceMeters(userCoords.lat, userCoords.lng, p.latitude!, p.longitude!),
      }))
      .filter((entry) => entry.distanceMeters <= nearMeRadiusKm * 1000)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [nearMeActive, userCoords, filteredProperties, nearMeRadiusKm]);

  const toggleShortlist = (id: string) => {
    const next = shortlist.includes(id) ? shortlist.filter(value => value !== id) : [...shortlist, id].slice(-100);
    setShortlist(next); if (!savePreference('nova-shortlist', next)) toast.error('Shortlist could not be saved in this browser.');
  };
  const resultActions = (property: Property) => <div className="flex items-center justify-between gap-2 rounded-b-xl border border-t-0 bg-white px-4 py-3 text-xs">
    <button type="button" aria-pressed={shortlist.includes(property.id)} onClick={() => toggleShortlist(property.id)} className="rounded-md border px-3 py-2 font-semibold text-primary">{shortlist.includes(property.id) ? 'Saved to shortlist' : 'Save property'}</button>
    <button type="button" aria-pressed={compareIds.includes(property.id)} onClick={() => { if (compareIds.includes(property.id)) setCompareIds(compareIds.filter(id => id !== property.id)); else if (compareIds.length < 3) setCompareIds([...compareIds, property.id]); else toast.error('Compare up to three properties. Remove one first.'); }} className="rounded-md border px-3 py-2">{compareIds.includes(property.id) ? 'Remove comparison' : 'Compare'}</button>
  </div>;

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-12">
      <Seo
        title="Properties for Sale & Rent in Bengaluru | Nova Nest"
        description="Browse verified homes, apartments, villas, plots and commercial spaces for sale and rent across Bengaluru. Filter by location, budget, type and more with Nova Nest."
        path="/properties"
        noindex={isFiltered}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-gold/15 bg-white p-5 shadow-subtle sm:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-gold font-semibold mb-3">Properties</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-charcoal mb-3">
            Browse Properties
          </h1>
          <p className="text-muted-foreground text-base mb-6">
            Find verified homes, plots & commercial spaces
          </p>

          {/* Search Bar */}
          <form onSubmit={event => {
            event.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
            setPage(1);
            setAppliedSearch(searchQuery.trim());
            setFilters(current => ({ ...current, location: undefined }));
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }} className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start">
            <LocationAutocomplete
              flowOnMobile
              value={searchQuery}
              onChange={setSearchQuery}
              locations={properties.map(property => property.locality?.trim() || property.location)}
              placeholder="Enter a locality, address or property name"
              className="w-full min-w-0 flex-1"
              inputClassName="h-14 bg-white border border-black/10 rounded-md pl-12 pr-5 py-4 w-full shadow-subtle focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
            <button type="submit" onMouseDown={event => { event.preventDefault(); event.stopPropagation(); }} aria-label="Search listings" className="premium-button inline-flex h-14 w-full items-center sm:w-auto justify-center gap-2 px-4 py-4 font-semibold sm:px-6"><Search size={18} />Search</button>
          </form>
          <p className="mt-2 text-sm text-muted-foreground">Choose an area or property name, then Search. BHK and other filters update instantly.</p>
          {(appliedSearch || filters.location || filters.locality?.length) && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span>Showing: {[appliedSearch || filters.location, ...(filters.locality || [])].filter(Boolean).join(', ')}</span>
            <button type="button" className="font-semibold text-primary underline" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setFilters(current => ({ ...current, location: undefined, locality: undefined })); }}>Clear location</button>
          </div>}

          {/* Properties Near Me */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={nearMeActive ? exitNearMe : requestNearMe}
              disabled={geoStatus === 'locating'}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {geoStatus === 'locating' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {nearMeActive ? 'Exit Near Me' : geoStatus === 'locating' ? 'Locating…' : 'Find Properties Near Me'}
            </button>

            {nearMeActive && (
              <select
                value={nearMeRadiusKm}
                onChange={(e) => setNearMeRadiusKm(Number(e.target.value))}
                className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-charcoal focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                {NEAR_ME_RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>
                    within {km} km
                  </option>
                ))}
              </select>
            )}

            {['denied', 'timeout', 'unsupported', 'error'].includes(geoStatus) && (
              <p className="text-sm text-muted-foreground">
                {geoStatus === 'denied' ? 'Location permission was denied. Enable it in your browser, or search an area.' : geoStatus === 'timeout' ? 'Finding your location timed out. Try again or search an area.' : geoStatus === 'unsupported' ? 'This browser does not support location access. Search an area instead.' : 'Your location could not be found. Try again or search an area.'}
              </p>
            )}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-2" aria-label="Popular areas">
          <span className="mr-2 shrink-0 text-sm font-semibold text-charcoal">Explore areas</span>
          {Array.from(new Set(properties.map(resolveLocality).filter(Boolean))).sort().slice(0, 12).map(name => <button key={name} type="button" aria-pressed={Boolean(filters.locality?.includes(name))} onClick={() => { toggleLocalityFilter(name); setPage(1); }} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm ${filters.locality?.includes(name) ? 'bg-charcoal text-white' : 'bg-white text-charcoal'}`}>{name} <span className="opacity-60">({properties.filter(p => resolveLocality(p) === name).length})</span></button>)}
        </div>
        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={next => { setPage(1); setFilters(next); if (Object.keys(next).length === 0) { setSearchQuery(''); setAppliedSearch(''); } }}
          onSortChange={sort => { setSortOption(sort); setPage(1); }}
          currentSort={sortOption}
        />

        {loadError && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-800">Could not refresh properties. <button type="button" onClick={() => loadProperties()} className="font-semibold underline">Retry</button></div>}
        {filterRangeError(filters) && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">{filterRangeError(filters)}</p>}
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
          {Object.entries(filters).filter(([key, value]) => key !== 'nearMe' && value !== undefined && value !== false && (!Array.isArray(value) || value.length)).map(([key, value]) => <button type="button" key={key} aria-label={`Remove ${key} filter`} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary" onClick={() => { setFilters(current => { const next = { ...current }; delete (next as Record<string, unknown>)[key]; return next; }); setPage(1); }}>{key === 'status' ? (value === 'rent' ? 'For rent' : 'For sale') : `${({ priceMin: 'Min price', priceMax: 'Max price', areaMin: 'Min sq ft', areaMax: 'Max sq ft', bedrooms: 'BHK', locality: 'Area', category: 'Type' } as Record<string,string>)[key] || key}: ${Array.isArray(value) ? value.map(v => CATEGORY_LABELS[v] || v).join(', ') : value === true ? 'Yes' : value}`} <span aria-hidden="true"> x</span></button>)}
        </div>
        {nearMeActive && <p className="mt-4 text-sm text-muted-foreground">{filteredProperties.filter(p => !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)).length} matching listings have no map location and are excluded from nearby results. <button type="button" className="underline" onClick={() => { setFilters(current => ({ ...current, location: undefined, locality: undefined })); setAppliedSearch(''); setSearchQuery(''); }}>Clear area search</button></p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" className="rounded-lg border bg-white px-4 py-2 font-semibold text-primary" onClick={() => { const entry = { label: `${appliedSearch || filters.location || filters.locality?.join(', ') || 'All areas'} - ${filters.status === 'rent' ? 'Rent' : filters.status === 'buy' ? 'Sale' : 'Sale & rent'}`, query: searchState }; const next = [entry, ...savedSearches.filter(s => s.query !== entry.query)].slice(0,5); setSavedSearches(next); if (savePreference('nova-saved-searches', next)) toast.success('Search saved on this browser'); else toast.error('Browser storage is unavailable'); }}>Save this search</button>
          <button type="button" aria-pressed={onlyShortlisted} onClick={() => { setOnlyShortlisted(!onlyShortlisted); setPage(1); }} className={`rounded-lg border px-4 py-2 ${onlyShortlisted ? 'bg-charcoal text-white' : 'bg-white'}`}>Shortlisted ({properties.filter(p => shortlist.includes(p.id)).length})</button>
          <button type="button" className="text-primary underline" onClick={() => { void (navigator.clipboard?.writeText(window.location.origin + '/properties' + searchState) || Promise.reject(new Error('Clipboard unavailable'))).then(() => toast.success('Search link copied')).catch(() => toast.error('Copy the address from your browser to share this search.')); }}>Copy search link</button>
          {savedSearches.length > 0 && <select aria-label="Restore a saved search" value="" className="rounded-lg border bg-white p-2" onChange={e => { const saved = savedSearches[Number(e.target.value)]; if (!saved) return; const next = readPropertySearch(saved.query); setFilters(next.filters); setSortOption(next.sort); setAppliedSearch(next.query); setSearchQuery(next.query || next.filters.location || ''); setPage(1); }}><option value="">Saved searches</option>{savedSearches.map((saved,index) => <option key={index} value={index}>{saved.label}</option>)}</select>}
          {savedSearches.length > 0 && <button type="button" className="text-xs text-gray-500 underline" onClick={() => { setSavedSearches([]); savePreference('nova-saved-searches', []); }}>Clear saved searches</button>}
        </div>
        <PropertyComparison properties={compareIds.map(id => properties.find(p => p.id === id)).filter((p): p is Property => Boolean(p))} onClear={() => setCompareIds([])} onOpen={onPropertyClick} />
        {/* Results Count */}
        <div ref={resultsRef} className="mt-8 mb-6 scroll-mt-24">
          <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
            <span className="font-semibold text-charcoal">
              {nearMeActive ? nearMeResults.length : filteredProperties.length}
            </span>{' '}
            {(nearMeActive ? nearMeResults.length : filteredProperties.length) === 1 ? 'property' : 'properties'} found
            {nearMeActive && ` within ${nearMeRadiusKm} km`}
          </p>
        </div>

        {nearMeActive && userCoords ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="order-2 h-[420px] lg:sticky lg:top-24 lg:order-1 lg:h-[calc(100vh-8rem)]">
              <Suspense fallback={<p className="p-6">Loading map...</p>}><PropertyMapView
                center={userCoords}
                markers={nearMeResults.map(({ property }) => ({
                  id: property.id,
                  lat: property.latitude!,
                  lng: property.longitude!,
                  title: property.title,
                }))}
                selectedId={selectedNearId}
                onSelect={(id) => {
                  setSelectedNearId(id);
                  cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="h-full w-full"
              /></Suspense>
            </div>
            <div className="order-1 space-y-5 lg:order-2">
              {nearMeResults.length > 0 ? (
                nearMeResults.map(({ property, distanceMeters }) => (
                  <div
                    key={property.id}
                    ref={(el) => {
                      cardRefs.current[property.id] = el;
                    }}
                  >
                    <PropertyCard
                      property={property}
                      distanceLabel={formatDistance(distanceMeters)}
                      isActive={selectedNearId === property.id}
                      onHoverChange={(hovering) => setSelectedNearId(hovering ? property.id : null)}
                      onClick={() => { sessionStorage.setItem('nova-browse-scroll', String(window.scrollY)); onPropertyClick(property); }}
                    />{resultActions(property)}
                  </div>
                ))
              ) : (
                <div className="premium-card p-12 text-center">
                  <MapPin size={48} className="mx-auto mb-4 text-gold" />
                  <h3 className="mb-2 font-serif text-xl font-bold text-charcoal">No properties nearby</h3>
                  <p className="text-muted-foreground">Try a larger radius, or clear other active filters.</p>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-md overflow-hidden animate-pulse border border-black/5 shadow-subtle"
              >
                <div className="aspect-[4/3] bg-black/10" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-black/10 rounded w-2/3" />
                  <div className="h-4 bg-black/10 rounded w-1/2" />
                  <div className="h-4 bg-black/10 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.slice((Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) - 1) * pageSize, Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) * pageSize).map((property, index) => (
              <div key={property.id}><PropertyCard
                property={property}
                index={index}
                onClick={() => { sessionStorage.setItem('nova-browse-scroll', String(window.scrollY)); onPropertyClick(property); }}
              />{resultActions(property)}</div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="premium-card p-12 max-w-md mx-auto">
              <Search size={64} className="mx-auto text-gold mb-4" />
              <h3 className="font-serif text-2xl font-bold text-charcoal mb-2">
                No properties found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                  setAppliedSearch('');
                  setOnlyShortlisted(false); setPage(1);
                  setSortOption('newest');
                }}
              className="premium-button px-6 py-3 font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
        {!nearMeActive && filteredProperties.length > pageSize && <nav aria-label="Property results pages" className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button type="button" disabled={page <= 1} onClick={() => { setPage(Math.max(1, page - 1)); resultsRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-lg border bg-white px-4 py-3 disabled:opacity-40">Previous</button>
          <span className="text-sm">Page {Math.min(page, Math.ceil(filteredProperties.length / pageSize))} of {Math.ceil(filteredProperties.length / pageSize)}</span>
          <button type="button" disabled={page >= Math.ceil(filteredProperties.length / pageSize)} onClick={() => { setPage(page + 1); resultsRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-lg border bg-white px-4 py-3 disabled:opacity-40">Next</button>
        </nav>}
      </div>
    </div>
  );
};
