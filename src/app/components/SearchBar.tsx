import React, { useState } from 'react';
import { Search, MapPin, Building2, ChevronDown, IndianRupee } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchBarProps {
  onSearch?: (filters: {
    location: string;
    status?: 'buy' | 'rent';
    priceMax?: number;
  }) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'buy' | 'rent' | null>(null);
  const [priceMax, setPriceMax] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const budgetOptions = [
    { label: 'All Budgets', value: '' },
    { label: 'Under Rs 50L', value: '5000000' },
    { label: 'Rs 50L - Rs 1Cr', value: '10000000' },
    { label: 'Rs 1Cr - Rs 3Cr', value: '30000000' },
    { label: 'Rs 3Cr+', value: '100000000' },
  ];

  const typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'Villa', value: 'villa' },
    { label: 'House', value: 'house' },
    { label: 'Plot', value: 'land' },
    { label: 'Commercial', value: 'condo' },
  ];

  const handleSearch = () => {
    onSearch?.({
      location,
      status: status || undefined,
      priceMax: priceMax ? parseInt(priceMax) : undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white rounded-md shadow-strong p-3 ${className}`}
    >
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
        <div className="flex-[1.8] h-14 flex items-center gap-3 px-4 bg-cream rounded-md hover:bg-gold-pale/70 transition-colors">
          <MapPin size={20} className="text-gold flex-shrink-0" />
          <input
            type="text"
            placeholder="Location (e.g., Whitefield, Hebbal)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-charcoal placeholder-muted-foreground focus:ring-0"
          />
        </div>

        <div className="relative h-14 rounded-full bg-cream p-1 flex min-w-[148px]">
          {status && (
            <span
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-charcoal shadow-subtle transition-transform duration-[250ms] ${
                status === 'rent' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          )}
          <button
            onClick={() => setStatus('buy')}
            className={`relative z-10 flex-1 px-5 rounded-full text-sm font-semibold transition-colors ${
              status === 'buy' ? 'text-gold' : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setStatus('rent')}
            className={`relative z-10 flex-1 px-5 rounded-full text-sm font-semibold transition-colors ${
              status === 'rent' ? 'text-gold' : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            Rent
          </button>
        </div>

        <label className="relative h-14 min-w-[160px]">
          <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-14 w-full appearance-none rounded-md bg-cream pl-10 pr-9 text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-gold/25"
          >
            {budgetOptions.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50" />
        </label>

        <label className="relative h-14 min-w-[150px]">
          <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="h-14 w-full appearance-none rounded-md bg-cream pl-10 pr-9 text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-gold/25"
          >
            {typeOptions.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/50" />
        </label>

        <button
          onClick={handleSearch}
          className="h-14 px-7 rounded-md gold-gradient text-charcoal font-bold shadow-subtle hover:-translate-y-0.5 hover:shadow-medium transition-all duration-[250ms] inline-flex items-center justify-center gap-2.5"
        >
          <Search size={18} />
          <span>Search</span>
        </button>
      </div>
    </motion.div>
  );
};
