import React, { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  onSearch: (filters: { status?: 'buy' | 'rent' }) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onSearch, currentPage }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigate = (page: string) => {
    onNavigate(page);
    setShowMobileMenu(false);
  };

  const handleBuyClick = () => {
    onSearch({ status: 'buy' });
    setShowMobileMenu(false);
  };

  const handleRentClick = () => {
    onSearch({ status: 'rent' });
    setShowMobileMenu(false);
  };

  const navLinks = [
    { label: 'Home', action: () => navigate('home'), active: currentPage === 'home' },
    { label: 'Buy', action: handleBuyClick, active: false },
    { label: 'Rent', action: handleRentClick, active: false },
    { label: 'About Us', action: () => navigate('about'), active: currentPage === 'about' },
    { label: 'Contact Us', action: () => navigate('contact'), active: currentPage === 'contact' },
  ];

  const linkClass = (active: boolean) =>
    `relative pb-1 text-sm font-semibold tracking-[0.05em] uppercase transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-gold after:transition-all after:duration-[250ms] ${
      active
        ? 'text-gold after:w-full'
        : 'text-charcoal/70 hover:text-gold after:w-0 hover:after:w-full'
    }`;

  return (
    <nav className="bg-cream/95 border-b border-black/5 sticky top-0 z-50 h-16 backdrop-blur-md shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <button
            className="flex items-center gap-3 flex-shrink-0"
            onClick={() => navigate('home')}
          >
            <span className="h-10 w-10 overflow-hidden rounded-md bg-charcoal shadow-subtle transition-transform duration-[250ms] hover:scale-105">
              <img
                src="/nova-nest-logo.png"
                alt="Nova Nest Property Management"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-display text-xl font-bold tracking-[0.015em] text-charcoal hidden sm:inline">
              Nova Nest
            </span>
          </button>

          <div className="hidden md:flex items-center gap-[28px]">
            {navLinks.map((link) => (
              <button key={link.label} onClick={link.action} className={linkClass(link.active)}>
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 md:ml-4">
            <button
              onClick={() => navigate('properties')}
              className="hidden sm:flex h-10 w-10 items-center justify-center hover:bg-gold/10 rounded-md transition-colors"
              aria-label="Search"
            >
              <Search size={20} className="text-charcoal/60 hover:text-gold transition-colors" />
            </button>

            <button
              onClick={() => navigate('admin-login')}
              className="hidden md:block border border-[#C99A3F] text-gold font-semibold px-5 py-2 rounded-md hover:bg-gold/10 active:bg-gold/15 transition-all duration-[250ms] text-sm"
            >
              Admin Login
            </button>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gold/10 rounded-md transition-colors text-charcoal hover:text-gold"
              aria-label="Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-black/5 overflow-hidden bg-cream shadow-medium"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className={`block w-full text-left px-4 py-3 rounded-md transition-colors font-semibold text-sm ${
                    link.active ? 'text-gold bg-gold/10' : 'text-charcoal/75 hover:bg-gold/10 hover:text-gold'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-black/10 pt-3">
                <button
                  onClick={() => navigate('admin-login')}
                  className="block w-full text-left px-4 py-3 rounded-md border border-gold/70 text-gold hover:bg-gold/10 transition-all duration-[250ms] font-semibold text-sm"
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
