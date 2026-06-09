import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters } from '../types';
import { getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { motion } from 'motion/react';
import {
  MapPin,
  Filter,
  Grid3x3,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

const amenitiesOptions = [
  'Pool',
  'Gym',
  'Parking',
  'Garden',
  'Security',
  'Lift',
  'Power Backup',
  'Club House',
];

const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString()}`;
};

export const HomePage: React.FC<HomePageProps> = ({
  onPropertyClick,
  onSearch,
}) => {
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

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allProperties, selectedCategory, selectedStatus, sortBy, priceRange, selectedBedrooms, selectedAmenities]);

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
    let filtered = allProperties;

    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedBedrooms.length > 0) {
      filtered = filtered.filter((p) => selectedBedrooms.includes(p.bedrooms));
    }

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((p) =>
        selectedAmenities.some((a) => p.amenities.includes(a))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'area-asc':
        filtered.sort((a, b) => a.areaSqft - b.areaSqft);
        break;
      case 'area-desc':
        filtered.sort((a, b) => b.areaSqft - a.areaSqft);
        break;
    }

    setFilteredProperties(filtered.slice(0, 9));
  };

  const handleLocationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const location = e.target.value;
    setFilters({ ...filters, location });
  };

  const handleBuyClick = () => {
    setSelectedStatus('buy');
  };

  const handleRentClick = () => {
    setSelectedStatus('rent');
  };

  const scrollChips = (direction: 'left' | 'right') => {
    const container = document.getElementById('category-chips');
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            alt="Luxury Real Estate"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              Find Your Perfect Property in India
            </h1>
            <p className="text-sm sm:text-base text-gray-300 mb-6">
              Verified listings. Real prices.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-white rounded-lg p-1.5 max-w-2xl mx-auto shadow-lg">
              <div className="flex-1 relative flex items-center">
                <MapPin size={18} className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter location..."
                  onChange={handleLocationSearch}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 rounded text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleBuyClick}
                  className={`px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                    selectedStatus === 'buy'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={handleRentClick}
                  className={`px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                    selectedStatus === 'rent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Rent
                </button>
              </div>
              <button
                onClick={() => onSearch(filters)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto pb-2">
            {/* Category Chips */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-shrink-0" id="category-chips">
                {categoryChips.map((chip) => (
                  <button
                    key={chip.value || 'all'}
                    onClick={() => setSelectedCategory(chip.value)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === chip.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm"
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-2 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Sort</span>
                  <ChevronDown size={16} />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    {['newest', 'oldest', 'price-asc', 'price-desc', 'area-asc', 'area-desc'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setShowSortDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? (
                  <List size={18} />
                ) : (
                  <Grid3x3 size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-xs sm:text-sm text-gray-600 mt-2">
            {filteredProperties.length} Properties found • Budget: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </div>
        </div>
      </section>

      {/* Results Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {filteredProperties.length} Properties found
        </h2>
      </section>

      {/* Filter Drawer */}
      {showFilterDrawer && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilterDrawer(false)} />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: showFilterDrawer ? 0 : '100%' }}
        transition={{ duration: 0.3 }}
        className="fixed right-0 top-32 bottom-0 w-80 bg-white shadow-lg overflow-y-auto z-50 lg:hidden"
      >
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-bold">Filters</h3>

          {/* Budget Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Budget: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </label>
            <input
              type="range"
              min="500000"
              max="100000000"
              step="100000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Bedrooms
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4, 5].map((bed) => (
                <button
                  key={bed}
                  onClick={() => {
                    if (selectedBedrooms.includes(bed)) {
                      setSelectedBedrooms(selectedBedrooms.filter((b) => b !== bed));
                    } else {
                      setSelectedBedrooms([...selectedBedrooms, bed]);
                    }
                  }}
                  className={`py-2 rounded text-sm font-medium transition-colors ${
                    selectedBedrooms.includes(bed)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {bed}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amenities
            </label>
            <div className="space-y-2">
              {amenitiesOptions.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAmenities([...selectedAmenities, amenity]);
                      } else {
                        setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                setSelectedBedrooms([]);
                setSelectedAmenities([]);
                setPriceRange([500000, 100000000]);
                setShowFilterDrawer(false);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </motion.div>

      {/* Properties Grid/List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No properties found</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => onPropertyClick(property)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
