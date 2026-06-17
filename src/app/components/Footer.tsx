import React from 'react';
import { Facebook, Home, Instagram, Linkedin, MapPin, Phone, Twitter } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const links = [
    { label: 'Home', page: 'home' },
    { label: 'Buy', page: 'properties' },
    { label: 'Rent', page: 'properties' },
    { label: 'About', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ];

  return (
    <footer className="bg-charcoal text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-3 text-left"
            >
              <span className="w-10 h-10 rounded-md gold-gradient flex items-center justify-center shadow-subtle">
                <Home size={20} className="text-charcoal" />
              </span>
              <span className="font-serif text-2xl font-bold tracking-[0.015em]">
                My-Properties
              </span>
            </button>
            <p className="mt-4 max-w-xl text-sm leading-7 text-cream/70">
              Premium verified properties across India, curated for buyers, tenants,
              sellers, and investors who value trust as much as location.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg text-gold mb-4">Quick Links</h3>
            <div className="space-y-2">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => onNavigate(link.page)}
                  className="block text-sm text-cream/75 hover:text-gold transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg text-gold mb-4">Visit Us</h3>
            <div className="space-y-3 text-sm text-cream/75">
              <p className="flex gap-2 leading-6">
                <MapPin size={18} className="text-gold flex-shrink-0 mt-1" />
                Ground Floor, Site No-29&30 Meshwarama Temple 1st Main Rd,
                Maheswari Nagar, Bengaluru 560048
              </p>
              <a href="tel:+919663795675" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone size={18} className="text-gold" />
                +91 96637 95675
              </a>
              <div className="flex gap-3 pt-2">
                {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                  <span
                    key={index}
                    className="w-9 h-9 rounded-full border border-gold/30 text-gold flex items-center justify-center hover:bg-gold/10 transition-colors"
                  >
                    <Icon size={16} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
