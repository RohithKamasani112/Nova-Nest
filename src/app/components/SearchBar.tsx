import React, { useState } from 'react';
import { Search, MapPin, Home, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchBarProps {
  onSearch?: (filters: {
    location: string;
    status: 'buy' | 'rent';
    priceMax?: number;
  }) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'buy' | 'rent'>('buy');
  const [priceMax, setPriceMax] = useState('');

  const handleSearch = () => {
    onSearch?.({
      location,
      status,
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
      className={`bg-white rounded-2xl shadow-2xl p-2 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-2">
        {/* Buy/Rent Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setStatus('buy')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              status === 'buy'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setStatus('rent')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              status === 'rent'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rent
          </button>
        </div>

        {/* Location Input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <MapPin size={20} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Location (e.g., New York, Miami)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Price Input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <DollarSign size={20} className="text-gray-400 flex-shrink-0" />
          <input
            type="number"
            placeholder={`Max ${status === 'rent' ? 'rent' : 'price'}`}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Search size={20} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </motion.div>
  );
};
