import React, { useState } from 'react';
import { Property } from '../types';
import { motion } from 'motion/react';
import {
  X,
  MapPin,
  DollarSign,
  BedDouble,
  Bath,
  Square,
  Phone,
  MessageCircle,
  Mail,
  Share2,
  Heart,
  Check,
  AlertCircle,
  Home,
  Building2,
  Zap,
  Droplet,
  Shield,
  ParkingCircle,
  Trees,
  Wifi,
  ChefHat,
  Sofa,
  Maximize,
  Calendar,
  User,
  MapPinned,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyDetailsPageProps {
  property: Property;
  onClose: () => void;
  onPropertyClick: (property: Property) => void;
}

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  property,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length
    );
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement inquiry submission
    toast.success('Inquiry submitted! We will contact you soon.');
    setInquiryForm({ name: '', email: '', phone: '', message: '' });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const isRental = property.status === 'rent';

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header with Close Button */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 z-10 px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Property Details
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-blue-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden h-96 sm:h-[500px]">
              <img
                src={property.images[currentImageIndex] || 'https://via.placeholder.com/800x500?text=No+Image'}
                alt={`${property.title} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 transition-all shadow-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 transition-all shadow-lg"
                  >
                    →
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>

              {/* Image Thumbnails */}
              {property.images.length > 1 && (
                <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap max-w-xs">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-300'
                          : 'border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and Basic Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {property.title}
                    </h2>
                    <div className="flex items-center gap-2 text-blue-600 mt-2">
                      <MapPin className="w-5 h-5" />
                      <p className="text-lg">{property.location}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors">
                    <Heart className="w-6 h-6 text-red-500" />
                  </button>
                </div>

                {/* Price and Status */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                    <div className="text-sm opacity-90">
                      {isRental ? 'Monthly Rent' : 'Price'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold">
                      {formatPrice(property.price)}
                    </div>
                  </div>

                  {property.pricePerSqft && (
                    <div className="bg-indigo-100 text-indigo-900 px-4 py-3 rounded-lg">
                      <div className="text-sm opacity-80">Price per Sqft</div>
                      <div className="text-xl font-bold">
                        ₹{property.pricePerSqft.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {isRental && property.rentalDetails?.securityDeposit && (
                    <div className="bg-amber-100 text-amber-900 px-4 py-3 rounded-lg">
                      <div className="text-sm opacity-80">Security Deposit</div>
                      <div className="text-xl font-bold">
                        ₹{(property.rentalDetails.securityDeposit).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <BedDouble className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {property.basicDetails?.bedrooms || property.bedrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <Bath className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {property.basicDetails?.bathrooms || property.bathrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <Square className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {property.basicDetails?.areaSqft || property.areaSqft}
                  </div>
                  <div className="text-sm text-gray-600">Sq.ft</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {property.basicDetails?.balconies || 1}
                  </div>
                  <div className="text-sm text-gray-600">Balconies</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  About this property
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Property Features */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Property Features
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.propertyFeatures && (
                    <>
                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Home className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Type</div>
                          <div className="font-semibold text-gray-900">
                            {property.propertyFeatures.furnished ||
                              'Semi-Furnished'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Floor</div>
                          <div className="font-semibold text-gray-900">
                            {property.propertyFeatures.floorNumber} of{' '}
                            {property.propertyFeatures.floors}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Built</div>
                          <div className="font-semibold text-gray-900">
                            {property.propertyFeatures.yearBuilt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <ParkingCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Parking</div>
                          <div className="font-semibold text-gray-900">
                            {property.propertyFeatures.parking || 'Available'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <MapPinned className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Facing</div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {property.propertyFeatures.facingDirection ||
                              'North'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">Power</div>
                          <div className="font-semibold text-gray-900">
                            {property.propertyFeatures.powerBackup
                              ? 'Backup'
                              : '24/7'}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200"
                      >
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Locations */}
              {property.nearbyLocations && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Nearby Locations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(property.nearbyLocations).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-200"
                      >
                        <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Contact and CTA */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Owner/Broker Contact Card */}
                {property.brokerDetails && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg"
                  >
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {property.brokerDetails.brokerName}
                    </h4>

                    {/* Quick Contact Buttons */}
                    <div className="space-y-3 mb-6">
                      <a
                        href={`tel:${property.brokerDetails.brokerPhone}`}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg py-3 px-4 transition-all font-semibold"
                      >
                        <Phone className="w-5 h-5" />
                        Call Broker
                      </a>

                      <a
                        href={`https://wa.me/${property.brokerDetails.brokerWhatsApp?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 rounded-lg py-3 px-4 transition-all font-semibold"
                      >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp
                      </a>

                      <a
                        href={`mailto:${property.brokerDetails.brokerEmail}`}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg py-3 px-4 transition-all font-semibold"
                      >
                        <Mail className="w-5 h-5" />
                        Email
                      </a>
                    </div>

                    <div className="border-t border-white/30 pt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {property.brokerDetails.brokerPhone}
                      </p>
                      {property.brokerDetails.brokerLicense && (
                        <p className="flex items-center gap-2 text-xs">
                          <Check className="w-4 h-4" />
                          RERA: {property.brokerDetails.brokerLicense}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Inquiry Form */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200"
                >
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Interested? Inquire Now
                  </h4>

                  <form onSubmit={handleInquiry} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={inquiryForm.name}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={inquiryForm.email}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={inquiryForm.phone}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <textarea
                      placeholder="Your Message (Optional)"
                      value={inquiryForm.message}
                      onChange={(e) =>
                        setInquiryForm({
                          ...inquiryForm,
                          message: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      Send Inquiry
                    </button>
                  </form>
                </motion.div>

                {/* Share Buttons */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-2"
                >
                  <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-600 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
