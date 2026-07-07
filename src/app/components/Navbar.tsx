import React, { useState } from 'react';
import { Calendar, Menu, Search, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import companyLogo from '../../assets/companyLogo.png';
import toast from 'react-hot-toast';
import { createLead } from '../../services/storageService';

interface NavbarProps {
  onNavigate: (page: string) => void;
  onSearch: (filters: { status?: 'buy' | 'rent' }) => void;
  currentPage: string;
}

const emptyVisit = { name: '', phone: '', email: '', date: '', message: '' };

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onSearch, currentPage }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [visit, setVisit] = useState(emptyVisit);
  const [submittingVisit, setSubmittingVisit] = useState(false);

  const openSchedule = () => {
    setShowSchedule(true);
    setShowMobileMenu(false);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit.name || !visit.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }

    setSubmittingVisit(true);
    try {
      await createLead({
        propertyId: 'general',
        userId: 'guest',
        name: visit.name,
        email: visit.email,
        phone: visit.phone,
        message: [
          'Schedule visit request',
          visit.date ? `Preferred date/time: ${visit.date}` : '',
          visit.message ? `Notes: ${visit.message}` : '',
        ]
          .filter(Boolean)
          .join(' — '),
        type: 'schedule-visit',
      });
      toast.success('Visit request submitted — our team will reach out shortly');
      setVisit(emptyVisit);
      setShowSchedule(false);
    } catch (error) {
      toast.error('Failed to submit your request. Please try again.');
    } finally {
      setSubmittingVisit(false);
    }
  };
  // Navbar background + shadow interpolate with scroll (spec #8): transparent
  // cream at the top, opaque with a soft shadow once scrolled.
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(248,249,252,0.7)', 'rgba(248,249,252,0.98)']);
  const navShadow = useTransform(
    scrollY,
    [0, 80],
    ['0 0 0px rgba(26,26,46,0)', '0 4px 20px rgba(26,26,46,0.10)'],
  );

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
    { label: 'Blog', action: () => navigate('blog'), active: currentPage === 'blog' || currentPage === 'blog-post' },
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
    <>
    <motion.nav
      style={{ backgroundColor: navBg, boxShadow: navShadow }}
      className="sticky top-0 z-50 h-16 border-b border-black/5 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <button
            className="flex items-center gap-3 flex-shrink-0"
            onClick={() => navigate('home')}
          >
            <span className="h-9 w-9 overflow-hidden rounded-md shadow-subtle transition-transform duration-[250ms] hover:scale-105">
              <img
                src={companyLogo}
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
              className="hidden sm:flex h-11 w-11 items-center justify-center hover:bg-gold/10 rounded-md transition-colors"
              aria-label="Search"
            >
              <Search size={20} className="text-charcoal/70 hover:text-gold transition-colors" />
            </button>

            <button
              onClick={openSchedule}
              className="hidden md:flex items-center gap-2 min-h-[44px] bg-primary text-white font-semibold px-5 py-2 rounded-md hover:bg-primary-dark transition-all duration-[250ms] text-sm"
            >
              <Calendar size={16} />
              Schedule Visit
            </button>

            <button
              onClick={() => navigate('admin-login')}
              className="hidden md:flex items-center min-h-[44px] border border-primary text-gold font-semibold px-5 py-2 rounded-md hover:bg-gold/10 active:bg-gold/15 transition-all duration-[250ms] text-sm"
            >
              Admin Login
            </button>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex h-11 w-11 items-center justify-center hover:bg-gold/10 rounded-md transition-colors text-charcoal hover:text-gold"
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
              <div className="border-t border-black/10 pt-3 space-y-2">
                <button
                  onClick={openSchedule}
                  className="flex w-full items-center gap-2 px-4 py-3 rounded-md bg-primary text-white hover:bg-primary-dark transition-all duration-[250ms] font-semibold text-sm"
                >
                  <Calendar size={16} />
                  Schedule Visit
                </button>
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
    </motion.nav>

    {/* Schedule Visit modal — client-facing, saves a schedule-visit lead */}
    <AnimatePresence>
      {showSchedule && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowSchedule(false)}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-strong">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-charcoal">Schedule a Visit</h2>
                <button
                  onClick={() => setShowSchedule(false)}
                  className="min-h-[44px] min-w-[44px] rounded-md p-1 transition-colors hover:bg-surface"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="mb-5 text-sm text-charcoal/60">
                Tell us when works for you and our team will arrange the visit.
              </p>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-charcoal">Full Name *</span>
                  <input
                    type="text"
                    required
                    value={visit.name}
                    onChange={(e) => setVisit({ ...visit, name: e.target.value })}
                    className="w-full rounded-md border border-border bg-white px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-charcoal">Mobile *</span>
                    <input
                      type="tel"
                      required
                      value={visit.phone}
                      onChange={(e) => setVisit({ ...visit, phone: e.target.value })}
                      className="w-full rounded-md border border-border bg-white px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-charcoal">Email</span>
                    <input
                      type="email"
                      value={visit.email}
                      onChange={(e) => setVisit({ ...visit, email: e.target.value })}
                      className="w-full rounded-md border border-border bg-white px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-charcoal">Preferred Date &amp; Time</span>
                  <input
                    type="datetime-local"
                    value={visit.date}
                    onChange={(e) => setVisit({ ...visit, date: e.target.value })}
                    className="w-full rounded-md border border-border bg-white px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-charcoal">Notes (optional)</span>
                  <textarea
                    value={visit.message}
                    onChange={(e) => setVisit({ ...visit, message: e.target.value })}
                    rows={3}
                    placeholder="Area / budget / property you're interested in"
                    className="w-full resize-none rounded-md border border-border bg-white px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-400"
                >
                  <Calendar size={18} />
                  {submittingVisit ? 'Submitting...' : 'Request Visit'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};
