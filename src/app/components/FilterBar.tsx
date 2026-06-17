import React, { useState } from 'react';
import { PropertyFilters, SortOption } from '../../types';
import { SlidersHorizontal, SortAsc, X } from 'lucide-react';
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

  const categories: { label: string; value: PropertyFilters['category'] }[] = [
    { label: 'All', value: undefined },
    { label: 'Apartment', value: ['apartment'] },
    { label: 'Villa', value: ['villa'] },
    { label: 'House', value: ['house'] },
    { label: 'Plot', value: ['land'] },
    { label: 'Commercial', value: ['condo'] },
  ];
  const advancedCategories = ['apartment', 'house', 'villa', 'condo', 'townhouse', 'land'];
  const amenities = ['Pool', 'Gym', 'Parking', 'Garden', 'Ocean View', 'City View', 'Fireplace', 'Smart Home'];

  const inputClass = 'flex-1 px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none bg-white';

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

  const setCategory = (category: PropertyFilters['category']) => {
    onFilterChange({ ...filters, category });
  };

  const hasActiveFilters =
    filters.category?.length ||
    filters.amenities?.length ||
    filters.bedrooms?.length ||
    filters.priceMin ||
    filters.priceMax;

  const pillClass = (active: boolean) =>
    `h-10 px-4 py-2.5 rounded-full font-semibold transition-all duration-[250ms] whitespace-nowrap text-sm leading-none ${
      active ? 'bg-charcoal text-gold shadow-subtle' : 'text-charcoal/65 hover:text-gold'
    }`;

  return (
    <div className="bg-white border border-black/5 rounded-md shadow-subtle p-4 sticky top-20 z-10">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 rounded-full bg-cream border border-black/5">
          {categories.map((category) => {
            const active =
              !category.value?.length
                ? !filters.category?.length
                : filters.category?.length === 1 && filters.category[0] === category.value[0];

            return (
              <button
                key={category.label}
                onClick={() => setCategory(category.value)}
                className={pillClass(Boolean(active))}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <label className="ml-auto h-11 inline-flex items-center gap-2 border border-black/10 text-charcoal/70 rounded-md px-3 bg-white hover:border-gold/50 hover:text-gold transition-all">
          <SortAsc size={18} />
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent outline-none text-sm font-semibold"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="area-asc">Area: Small to Large</option>
            <option value="area-desc">Area: Large to Small</option>
          </select>
        </label>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-11 px-4 border border-black/10 text-charcoal/70 hover:border-gold/50 hover:text-gold hover:shadow-subtle rounded-md font-semibold transition-all duration-[250ms] flex items-center gap-2"
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-11 px-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-md font-semibold transition-all duration-[250ms] flex items-center gap-2"
          >
            <X size={18} />
            Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-black/10 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">Price Range</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ''}
                    onChange={(e) => onFilterChange({ ...filters, priceMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ''}
                    onChange={(e) => onFilterChange({ ...filters, priceMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {advancedCategories.map((category) => (
                    <button key={category} onClick={() => toggleCategory(category)} className={`${pillClass(Boolean(filters.category?.includes(category as any)))} capitalize bg-cream`}>
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">Bedrooms</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((beds) => (
                    <button
                      key={beds}
                      onClick={() => toggleBedrooms(beds)}
                      className={`${pillClass(Boolean(filters.bedrooms?.includes(beds)))} bg-cream`}
                    >
                      {beds}+ Bed
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <button key={amenity} onClick={() => toggleAmenity(amenity)} className={`${pillClass(Boolean(filters.amenities?.includes(amenity)))} bg-cream`}>
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">Area (sqft)</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min sqft"
                    value={filters.areaMin || ''}
                    onChange={(e) => onFilterChange({ ...filters, areaMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Max sqft"
                    value={filters.areaMax || ''}
                    onChange={(e) => onFilterChange({ ...filters, areaMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  ['featured', 'Featured Only'],
                  ['verified', 'Verified Only'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(filters[field as 'featured' | 'verified'])}
                      onChange={(e) => onFilterChange({ ...filters, [field]: e.target.checked || undefined })}
                      className="w-5 h-5 rounded border-black/20 text-gold focus:ring-gold/30"
                    />
                    <span className="text-sm font-semibold text-charcoal/75">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
