import React, { useState } from 'react';
import { Property } from '../../types';
import {
  Bath,
  Bed,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Maximize,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
  index?: number;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavorite,
  isFavorite = false,
  onClick,
  index = 0,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price: number) => {
    if (property.status === 'rent') return `₹${price.toLocaleString()}/month`;
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const truncateWords = (text: string, maxLength = 72) => {
    if (text.length <= maxLength) return text;
    const trimmed = text.slice(0, maxLength).trim();
    const lastSpace = trimmed.lastIndexOf(' ');
    return `${trimmed.slice(0, lastSpace > 0 ? lastSpace : trimmed.length)}...`;
  };

  const price = formatPrice(property.price);
  const propertyType = property.category === 'land' ? 'Plot' : property.category;
  const currentImage =
    property.images.length > 0
      ? property.images[currentImageIndex]
      : 'https://via.placeholder.com/800x600?text=No+Image';

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group h-[540px] max-h-[550px] cursor-pointer overflow-hidden rounded-xl border border-black/5 bg-white shadow-subtle transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-medium flex flex-col"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-56 w-full flex-shrink-0 overflow-hidden rounded-t-xl bg-black/5">
        {property.images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={currentImage}
              alt={property.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gold/10">
            <Building2 size={48} className="text-gold" />
          </div>
        )}

        {property.images.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow-subtle backdrop-blur-md transition-all hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} className="text-charcoal" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow-subtle backdrop-blur-md transition-all hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight size={16} className="text-charcoal" />
            </button>
          </>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          {property.featured && (
            <span className="rounded-sm border border-gold/40 bg-[#0F1B2D]/70 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-gold shadow-subtle backdrop-blur-md">
              Featured
            </span>
          )}
          {property.verified && (
            <span className="flex items-center gap-1 rounded-sm border border-emerald/40 bg-[#0F1B2D]/70 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-white shadow-subtle backdrop-blur-md">
              <Check size={12} />
              Verified
            </span>
          )}
        </div>

        <button
          onClick={handleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-charcoal/45 shadow-subtle backdrop-blur-md transition-colors hover:text-red-500"
          aria-label="Save property"
        >
          <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <div className="font-sans text-[30px] font-extrabold leading-none tracking-normal text-gold">
          <span className="text-[#C89B3C]">{price.slice(0, 1)}</span>
          {price.slice(1)}
        </div>

        <h3 className="line-clamp-2 font-serif text-[20px] font-bold leading-snug text-charcoal transition-colors group-hover:text-gold">
          {property.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={15} className="flex-shrink-0 text-gold" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[12px] font-semibold text-charcoal/70">
          <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-cream px-2 py-2">
            <Bed size={16} className="flex-shrink-0 text-charcoal/60" />
            <span className="truncate">{property.bedrooms > 0 ? `${property.bedrooms} Bed` : 'Studio'}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-cream px-2 py-2">
            <Bath size={16} className="flex-shrink-0 text-charcoal/60" />
            <span className="truncate">{property.bathrooms} Bath</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-cream px-2 py-2">
            <Maximize size={16} className="flex-shrink-0 text-charcoal/60" />
            <span className="truncate">{property.areaSqft.toLocaleString()} sqft</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-cream px-2 py-2 capitalize">
            <Building2 size={16} className="flex-shrink-0 text-charcoal/60" />
            <span className="truncate">{propertyType}</span>
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {truncateWords(property.description)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/10 pt-4">
          <button className="flex h-10 min-w-0 items-center gap-2 text-sm text-charcoal/75 transition-colors hover:text-gold">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
              <User size={14} />
            </span>
            <span className="whitespace-nowrap font-semibold">Contact Agent</span>
          </button>
          <button
            onClick={onClick}
            className="h-10 whitespace-nowrap rounded-md border border-gold/40 bg-gold/[0.08] px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/15"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.article>
  );
};
