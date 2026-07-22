import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters, SortOption } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { FilterBar } from '../app/components/FilterBar';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { PropertyMapView } from '../app/components/PropertyMapView';
import { TopLocalitiesSection } from '../app/components/TopLocalitiesSection';
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // "Properties Near Me" — geolocation-driven split map/list view, layered on
  // top of whatever other filters are active.
  const [nearMeActive, setNearMeActive] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'granted' | 'denied' | 'error'>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeRadiusKm, setNearMeRadiusKm] = useState(10);
  const [selectedNearId, setSelectedNearId] = useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const requestNearMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('granted');
        setNearMeActive(true);
      },
      () => setGeoStatus('denied'),
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
    setFilters(initialFilters);
    setSearchQuery(initialFilters.location || '');
    if (initialFilters.nearMe) requestNearMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  useEffect(() => {
    const locationParam = new URLSearchParams(window.location.search).get('location');
    if (locationParam) {
      setSearchQuery(locationParam);
      setFilters((current) => ({ ...current, location: locationParam }));
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [properties, filters, sortOption, searchQuery]);

  const loadProperties = async () => {
    try {
      const data = await getAllProperties();
      setProperties(data.filter((property) => property.isActive !== false));
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...properties];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
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
        filters.bedrooms?.some((beds) => p.bedrooms >= beds)
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
      filtered = filtered.filter((p) => Boolean(p.locality && filters.locality!.includes(p.locality)));
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
  const isFiltered = Boolean(
    searchQuery ||
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

  return (
    <div className="min-h-screen bg-cream py-12">
      <Seo
        title="Properties for Sale & Rent in Bengaluru | Nova Nest"
        description="Browse verified homes, apartments, villas, plots and commercial spaces for sale and rent across Bengaluru. Filter by location, budget, type and more with Nova Nest."
        path="/properties"
        noindex={isFiltered}
      />

      <TopLocalitiesSection
        properties={properties}
        mode="filter"
        selected={filters.locality || []}
        onSelectLocality={toggleLocalityFilter}
        title="Filter by Locality"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.18em] text-gold font-semibold mb-3">Properties</p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-charcoal mb-3">
            Browse Properties
          </h1>
          <p className="text-muted-foreground text-base mb-6">
            Find verified homes, plots & commercial spaces
          </p>

          {/* Search Bar */}
          <LocationAutocomplete
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setFilters({ ...filters, location: value || undefined });
            }}
            onSelect={(value) => {
              setSearchQuery(value);
              setFilters({ ...filters, location: value });
            }}
            locations={properties.map((property) => property.location)}
            placeholder="Search by location..."
            className="w-full max-w-lg"
            inputClassName="bg-white border border-black/10 rounded-md pl-12 pr-5 py-4 w-full shadow-subtle focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />

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

            {(geoStatus === 'denied' || geoStatus === 'error') && (
              <p className="text-sm text-muted-foreground">
                Location access denied — you can search by locality instead.
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onSortChange={setSortOption}
          currentSort={sortOption}
        />

        {/* Results Count */}
        <div ref={resultsRef} className="mt-8 mb-6 scroll-mt-24">
          <p className="text-sm font-medium text-muted-foreground">
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
              <PropertyMapView
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
              />
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
                      onClick={() => onPropertyClick(property)}
                    />
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
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={index}
                onClick={() => onPropertyClick(property)}
              />
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
                  setSortOption('newest');
                }}
              className="premium-button px-6 py-3 font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
