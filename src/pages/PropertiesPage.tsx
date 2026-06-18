import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters, SortOption } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { FilterBar } from '../app/components/FilterBar';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

interface PropertiesPageProps {
  onPropertyClick: (property: Property) => void;
  initialFilters?: PropertyFilters;
}

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

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    setFilters(initialFilters);
    setSearchQuery(initialFilters.location || '');
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
      setProperties(data);
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

    // Apply location filter
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(location)
      );
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-cream py-12">
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
              {filteredProperties.length}
            </span>{' '}
            {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>

        {/* Properties Grid */}
        {loading ? (
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
