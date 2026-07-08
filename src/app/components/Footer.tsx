import React from 'react';
import { Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import companyLogo from '../../assets/kmr-logo.svg';
import { trackWhatsAppClick, trackPhoneClick, trackSocialClick } from '../../utils/analytics';

interface FooterProps {
  onNavigate: (page: string) => void;
  onSearch: (filters: { status?: 'buy' | 'rent' }) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSearch }) => {
  const businessName = import.meta.env.VITE_BUSINESS_NAME || 'KMR Real Estates';
  const email = import.meta.env.VITE_CONTACT_EMAIL || 'contact@kmrrealestates.in';
  const mapsUrl = import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/V5dSTjfNRgDUWTmEA';
  const links = [
    { label: 'Home', action: () => onNavigate('home') },
    { label: 'Buy', action: () => onSearch({ status: 'buy' }) },
    { label: 'Rent', action: () => onSearch({ status: 'rent' }) },
    { label: 'Blog', action: () => onNavigate('blog') },
    { label: 'About', action: () => onNavigate('about') },
    { label: 'Contact', action: () => onNavigate('contact') },
  ];

  return (
    <footer className="bg-header text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-3 text-left"
            >
              <span className="h-12 w-12 overflow-hidden rounded-md shadow-subtle">
                <img src={companyLogo} alt="KMR Real Estates" className="h-full w-full object-cover" />
              </span>
              <span className="font-serif text-2xl font-bold tracking-[0.015em]">
                {businessName}
              </span>
            </button>
            <p className="mt-4 max-w-xl text-sm leading-7 text-cream/70">
              Where your next address begins. KMR Real Estates matches renters,
              buyers and sellers with verified 2, 3 &amp; 4 BHK homes across
              Bengaluru&apos;s best corridors.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#" onClick={() => trackWhatsAppClick('footer_rentals_group')} className="rounded-full border border-accent/30 px-4 py-2 text-sm text-accent hover:bg-accent/10 transition-colors">Rentals Group</a>
              <a href="#" onClick={() => trackWhatsAppClick('footer_sales_group')} className="rounded-full border border-accent/30 px-4 py-2 text-sm text-accent hover:bg-accent/10 transition-colors">Sales Group</a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg text-accent mb-4">Quick Links</h3>
            <div className="space-y-2">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="block text-sm text-cream/75 hover:text-accent transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg text-accent mb-4">Visit Us</h3>
            <div className="space-y-3 text-sm text-cream/75">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 leading-6 hover:text-accent transition-colors">
                <MapPin size={18} className="text-accent flex-shrink-0 mt-1" />
                2nd Floor, Plot No-14, Renigunta Road, Near Balaji Colony, Tirupati, Andhra Pradesh 517501
              </a>
              <a href="tel:+919000000000" onClick={() => trackPhoneClick('footer')} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone size={18} className="text-accent" />
                +91 90000 00000
              </a>
              <a href="tel:+919000000001" onClick={() => trackPhoneClick('footer')} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone size={18} className="text-accent" />
                +91 90000 00001
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail size={18} className="text-accent" />
                {email}
              </a>
              <div className="flex gap-3 pt-2">
                {[
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Youtube, href: '#', label: 'YouTube' },
                  { icon: WhatsAppIcon, href: '#', label: 'WhatsApp Rentals' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    onClick={() => trackSocialClick(label, href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/10 transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
