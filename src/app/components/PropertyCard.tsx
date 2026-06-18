import React from 'react';
import { Property } from '../../types';
import { Bath, BedDouble, Building2, Eye, MapPin, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
  index?: number;
}

const formatPrice = (property: Property): string => {
  if (property.status === 'rent') return `\u20B9${property.price.toLocaleString()}/month`;
  if (property.price >= 10000000) return `\u20B9${(property.price / 10000000).toFixed(2)} Cr`;
  if (property.price >= 100000) return `\u20B9${(property.price / 100000).toFixed(2)} L`;
  return `\u20B9${property.price.toLocaleString()}`;
};

const categoryLabel = (category: Property['category']) => {
  if (category === 'land') return 'Plot';
  if (category === 'condo') return 'Commercial';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onClick,
  index = 0,
}) => {
  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_36px_rgba(0,0,0,0.13)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-black/10">
            <Building2 size={36} className="text-charcoal/20" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.featured && (
            <span className="rounded-full bg-[#1a2744] px-2.5 py-1 text-[11px] font-bold tracking-wide text-gold">
              New Launch
            </span>
          )}
          <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-[#1a2744]">
            {categoryLabel(property.category)}
          </span>
        </div>

        <button
          onClick={handleActionClick}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-charcoal shadow transition-colors hover:bg-white"
          aria-label={`View ${property.title}`}
        >
          <Eye size={13} />
          View
        </button>
      </div>

      <div className="p-4 pb-5">
        <h3 className="mb-1 line-clamp-1 text-[15px] font-bold leading-tight tracking-normal text-[#1a1a1a]">
          {property.title}
        </h3>

        <div className="mb-3 flex items-center gap-1">
          <MapPin size={12} className="flex-shrink-0 text-gold" />
          <span className="truncate text-[12px] font-medium text-[#666]">{property.location}</span>
        </div>

        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#f0f0f0] pb-4">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-[#888]" />
              <span className="text-[13px] font-semibold text-[#333]">{property.bedrooms} BHK</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1.5">
              <Bath size={14} className="text-[#888]" />
              <span className="text-[13px] font-semibold text-[#333]">{property.bathrooms} Bath</span>
            </div>
          )}
          {property.areaSqft > 0 && (
            <div className="flex items-center gap-1.5">
              <Maximize2 size={13} className="text-[#888]" />
              <span className="text-[13px] font-semibold text-[#333]">{property.areaSqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] font-extrabold leading-none tracking-normal text-[#1a1a1a]">
              {formatPrice(property)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[#777]">
              {property.status === 'rent' ? 'rental price' : 'onwards'}
            </p>
          </div>
          {property.bedrooms > 0 && (
            <span className="flex-shrink-0 rounded-lg bg-gold/10 px-2.5 py-1 text-[12px] font-bold text-gold">
              {property.bedrooms} BHK
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleActionClick}
            className="rounded-xl bg-[#1a2744] py-2.5 text-[13px] font-bold tracking-wide text-white transition-colors hover:bg-[#0f1b2d]"
          >
            BOOK VISIT
          </button>
          <button
            onClick={handleActionClick}
            className="rounded-xl bg-gold py-2.5 text-[13px] font-bold tracking-wide text-[#1a2744] transition-all hover:brightness-95"
          >
            ENQUIRE
          </button>
        </div>
      </div>
    </motion.article>
  );
};
