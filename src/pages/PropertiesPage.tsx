import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters, SortOption } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { FilterBar } from '../app/components/FilterBar';
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

  useEffect(() => {
    loadProperties();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Explore Properties
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
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
        <div className="mt-8 mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">
              {filteredProperties.length}
            </span>{' '}
            {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-64 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
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
            <div className="bg-white rounded-2xl p-12 max-w-md mx-auto">
              <Search size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                  setSortOption('newest');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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
