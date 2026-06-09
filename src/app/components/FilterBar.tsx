import React, { useState } from 'react';
import { PropertyFilters, SortOption } from '../../types';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilterBarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  onSortChange: (sort: SortOption) => void;
  currentSort: SortOption;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onSortChange,
  currentSort,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = ['apartment', 'house', 'villa', 'condo', 'townhouse', 'land'];
  const amenities = [
    'Pool',
    'Gym',
    'Parking',
    'Garden',
    'Ocean View',
    'City View',
    'Fireplace',
    'Smart Home',
  ];

  const toggleCategory = (category: string) => {
    const current = filters.category || [];
    const updated = current.includes(category as any)
      ? current.filter((c) => c !== category)
      : [...current, category as any];
    onFilterChange({ ...filters, category: updated });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFilterChange({ ...filters, amenities: updated });
  };

  const toggleBedrooms = (beds: number) => {
    const current = filters.bedrooms || [];
    const updated = current.includes(beds)
      ? current.filter((b) => b !== beds)
      : [...current, beds];
    onFilterChange({ ...filters, bedrooms: updated });
  };

  const clearFilters = () => {
    onFilterChange({});
    onSortChange('newest');
  };

  const hasActiveFilters =
    filters.category?.length ||
    filters.amenities?.length ||
    filters.bedrooms?.length ||
    filters.priceMin ||
    filters.priceMax;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sticky top-4 z-10">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Sort Dropdown */}
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="area-asc">Area: Small to Large</option>
          <option value="area-desc">Area: Large to Small</option>
        </select>

        {/* Bedrooms Quick Filter */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((beds) => (
            <button
              key={beds}
              onClick={() => toggleBedrooms(beds)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filters.bedrooms?.includes(beds)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {beds}+ Bed
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal size={18} />
          Advanced
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Price Range
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        priceMin: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        priceMax: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Property Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                        filters.category?.includes(category as any)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filters.amenities?.includes(amenity)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Area (sqft)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min sqft"
                    value={filters.areaMin || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        areaMin: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max sqft"
                    value={filters.areaMax || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        areaMax: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured || false}
                    onChange={(e) =>
                      onFilterChange({ ...filters, featured: e.target.checked || undefined })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified || false}
                    onChange={(e) =>
                      onFilterChange({ ...filters, verified: e.target.checked || undefined })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Verified Only</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
