import React, { useState } from 'react';
import { Property } from '../../types';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavorite,
  isFavorite = false,
  onClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price: number) => {
    if (property.status === 'rent') {
      return `₹${price.toLocaleString()}/month`;
    }
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

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

  const currentImage =
    property.images.length > 0
      ? property.images[currentImageIndex]
      : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - h-220px */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Building2 size={48} className="text-gray-400" />
          </div>
        )}

        {/* Image Navigation */}
        {property.images.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-all shadow-lg z-10"
            >
              <ChevronLeft size={16} className="text-gray-800" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-all shadow-lg z-10"
            >
              <ChevronRight size={16} className="text-gray-800" />
            </button>

            {/* Image Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {property.images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.featured && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg">
              FEATURED
            </div>
          )}
          {property.verified && (
            <div className="bg-green-500 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg flex items-center gap-1">
              <Check size={12} />
              VERIFIED
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 shadow-lg"
        >
          <Heart
            size={16}
            className={`${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'
            } transition-colors`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3 bg-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg capitalize">
          For {property.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Row 1: Price & Category */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(property.price)}
          </div>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold capitalize whitespace-nowrap">
            {property.category}
          </span>
        </div>

        {/* Row 2: Title */}
        <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 text-sm group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        {/* Row 3: Location */}
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="text-xs line-clamp-1">{property.location}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-2" />

        {/* Row 4: Stats */}
        <div className="grid gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            {property.bedrooms > 0 && (
              <>
                <Bed size={14} />
                <span className="font-semibold">{property.bedrooms} Beds</span>
                <span className="mx-1">•</span>
              </>
            )}
            <Bath size={14} />
            <span className="font-semibold">{property.bathrooms} Baths</span>
            <span className="mx-1">•</span>
            <Maximize size={14} />
            <span className="font-semibold">{property.areaSqft.toLocaleString()} sqft</span>
          </div>
        </div>

        {/* Row 5: Amenities */}
        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Row 6: Description */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          {property.description}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100 my-2 mt-auto" />

        {/* Row 7: Agent & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Contact Agent</span>
          </div>
          <button
            onClick={onClick}
            className="px-3 py-1.5 bg-white border border-blue-600 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            View Details →
          </button>
        </div>
      </div>
    </motion.div>
  );
};
