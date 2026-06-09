import React, { useState } from 'react';
import { Home, Menu, X, LogOut, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PropertyFilters } from '../../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  onSearch: (filters: PropertyFilters) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onSearch, currentPage }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleBuyClick = () => {
    onSearch({ status: 'buy' });
    onNavigate('properties');
    setShowMobileMenu(false);
  };

  const handleRentClick = () => {
    onSearch({ status: 'rent' });
    onNavigate('properties');
    setShowMobileMenu(false);
  };

  const handleExploreClick = () => {
    onNavigate('properties');
    setShowMobileMenu(false);
  };

  const isActive = (page: string) => currentPage === page;
  const activeClass = 'text-blue-600 border-b-2 border-blue-600 pb-1';
  const inactiveClass = 'text-gray-700 hover:text-blue-600 transition-colors pb-1';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:inline">
              My-Properties
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={handleBuyClick}
              className={`font-medium text-sm ${isActive('properties') ? activeClass : inactiveClass}`}
            >
              Buy
            </button>
            <button
              onClick={handleRentClick}
              className={`font-medium text-sm ${isActive('properties') ? activeClass : inactiveClass}`}
            >
              Rent
            </button>
            <button
              onClick={handleExploreClick}
              className={`font-medium text-sm ${isActive('properties') ? activeClass : inactiveClass}`}
            >
              Explore
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('properties')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              aria-label="Search"
            >
              <Search size={20} className="text-gray-700" />
            </button>

            <button
              onClick={() => onNavigate('admin-login')}
              className="hidden md:block px-4 py-2 border-2 border-slate-900 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Admin Login
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 overflow-hidden bg-white"
          >
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={handleBuyClick}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Buy
              </button>
              <button
                onClick={handleRentClick}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Rent
              </button>
              <button
                onClick={handleExploreClick}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Explore
              </button>
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => {
                    onNavigate('admin-login');
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
