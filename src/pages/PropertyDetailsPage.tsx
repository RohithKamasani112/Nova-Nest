import React, { useState, useEffect } from 'react';
import { Property, Inquiry } from '../types';
import { getAllProperties, createLead } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Share2,
  MessageCircle,
  Phone,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PropertyDetailsPageProps {
  property: Property;
  onClose: () => void;
  onPropertyClick: (property: Property) => void;
}

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
}

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  property,
  onClose,
  onPropertyClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadType, setLeadType] = useState<'contact-owner' | 'schedule-visit' | 'request-info'>('contact-owner');
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: '', phone: '', email: '' });
  const [loadingLead, setLoadingLead] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    loadSimilarProperties();
  }, [property]);

  const loadSimilarProperties = async () => {
    try {
      const allProps = await getAllProperties();
      const similar = allProps
        .filter((p) => p.category === property.category && p.id !== property.id)
        .slice(0, 3);
      setSimilarProperties(similar);
    } catch (error) {
      console.error('Error loading similar properties:', error);
    }
  };

  const formatPrice = (price: number): string => {
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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.email) {
      toast.error('Please fill all fields');
      return;
    }

    setLoadingLead(true);
    try {
      const inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'status'> = {
        propertyId: property.id,
        userId: 'guest',
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        message: `${leadType === 'schedule-visit' ? 'Schedule a visit' : leadType === 'request-info' ? 'Request info' : 'Contact owner'}`,
        type: leadType,
      };

      await createLead(inquiryData);
      toast.success('Inquiry submitted successfully!');

      if (leadType === 'request-info' && property.brochure) {
        const link = document.createElement('a');
        link.href = property.brochure;
        link.download = `${property.title}-brochure.pdf`;
        link.click();
      }

      setShowLeadModal(false);
      setLeadForm({ name: '', phone: '', email: '' });
    } catch (error) {
      toast.error('Failed to submit inquiry');
    } finally {
      setLoadingLead(false);
    }
  };

  const descriptionPreview = expandedDescription
    ? property.description
    : property.description.substring(0, 200);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button
            onClick={onClose}
            className="sm:hidden"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative h-96 sm:h-[480px] bg-gray-200 rounded-xl overflow-hidden group">
              {property.images.length > 0 ? (
                <>
                  <motion.img
                    key={currentImageIndex}
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? property.images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-all shadow-lg z-10"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === property.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-all shadow-lg z-10"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {currentImageIndex + 1}/{property.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center" />
              )}
            </div>

            {/* Thumbnail Strip */}
            {property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Breadcrumb & Title */}
            <div>
              <div className="text-sm text-gray-600 mb-2">
                {property.category} • {property.status === 'buy' ? 'For Sale' : 'For Rent'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} />
                <span>{property.location}</span>
              </div>
            </div>

            {/* Price & Status Chips */}
            <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
              <div className="text-3xl font-bold text-blue-600">
                {formatPrice(property.price)}
              </div>
              {property.status === 'rent' && (
                <>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-600">Security Deposit</div>
                    <div className="font-semibold text-gray-900">₹{(property.price * 2).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-600">Maintenance</div>
                    <div className="font-semibold text-gray-900">₹{Math.floor(property.price * 0.1).toLocaleString()}</div>
                  </div>
                </>
              )}
              {property.featured && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium text-sm">
                  Featured
                </div>
              )}
              {property.verified && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1">
                  <Check size={16} />
                  Verified
                </div>
              )}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl">
              {property.bedrooms > 0 && (
                <div>
                  <div className="text-gray-600 text-xs mb-1">Bedrooms</div>
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                </div>
              )}
              <div>
                <div className="text-gray-600 text-xs mb-1">Bathrooms</div>
                <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs mb-1">Area</div>
                <div className="text-2xl font-bold text-gray-900">{property.areaSqft.toLocaleString()}</div>
              </div>
              {property.yearBuilt && (
                <div>
                  <div className="text-gray-600 text-xs mb-1">Year Built</div>
                  <div className="text-2xl font-bold text-gray-900">{property.yearBuilt}</div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">
                {descriptionPreview}
              </p>
              {property.description.length > 200 && (
                <button
                  onClick={() => setExpandedDescription(!expandedDescription)}
                  className="text-blue-600 font-medium mt-2"
                >
                  {expandedDescription ? 'Read Less' : 'Read More'}
                </button>
              )}
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg"
                    >
                      <Check size={18} className="text-blue-600" />
                      <span className="text-sm text-gray-900">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details Table */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Property Details</h2>
              <div className="space-y-2">
                {property.parking !== undefined && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Parking</span>
                    <span className="font-medium text-gray-900">{property.parking} spaces</span>
                  </div>
                )}
                {property.floors !== undefined && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Total Floors</span>
                    <span className="font-medium text-gray-900">{property.floors}</span>
                  </div>
                )}
                {property.furnished !== undefined && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Furnishing</span>
                    <span className="font-medium text-gray-900">
                      {property.furnished ? 'Furnished' : 'Unfurnished'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube Video */}
            {property.videoUrl && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Video Tour</h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
                  <iframe
                    src={property.videoUrl.replace('watch?v=', 'embed/')}
                    title="Property Video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Google Maps */}
            {property.latitude && property.longitude && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Location Map</h2>
                <div className="w-full h-80 rounded-xl overflow-hidden bg-gray-200">
                  <iframe
                    src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Similar Properties</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarProperties.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      onClick={() => onPropertyClick(prop)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Contact */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-24 bg-white rounded-2xl shadow-lg p-6 space-y-4"
            >
              <button
                onClick={() => {
                  setLeadType('contact-owner');
                  setShowLeadModal(true);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Contact Owner
              </button>

              <button
                onClick={() => {
                  setLeadType('schedule-visit');
                  setShowLeadModal(true);
                }}
                className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Schedule Visit
              </button>

              {property.brochure && (
                <button
                  onClick={() => {
                    setLeadType('request-info');
                    setShowLeadModal(true);
                  }}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Brochure
                </button>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Premium Agent</div>
                    <div className="text-xs text-gray-600">Verified Seller</div>
                  </div>
                </div>

                <button className="w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <Phone size={16} />
                  Call Agent
                </button>

                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </div>

              <div className="border-t border-gray-200 pt-4 flex gap-2">
                <button
                  onClick={() => navigator.share({ title: property.title, url: window.location.href })}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Share2 size={16} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lead Modal */}
      <AnimatePresence>
        {showLeadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeadModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {leadType === 'schedule-visit'
                      ? 'Schedule a Visit'
                      : leadType === 'request-info'
                      ? 'Request Brochure'
                      : 'Contact Owner'}
                  </h2>
                  <button
                    onClick={() => setShowLeadModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="\d{10}"
                      value={leadForm.phone}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, phone: e.target.value })
                      }
                      placeholder="10-digit phone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={leadForm.email}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingLead}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loadingLead ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! The property owner will contact you soon.');
    setShowContactModal(false);
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Visit scheduled! You will receive a confirmation email.');
    setShowScheduleModal(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleLeadCapture = (data: { name: string; email: string; phone: string }) => {
    // Save lead to storage (in a real app, this would go to a database/API)
    const lead = {
      id: `lead_${Date.now()}`,
      propertyId: property.id,
      propertyTitle: property.title,
      ...data,
      type: 'brochure-download',
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage for now
    const existingLeads = JSON.parse(localStorage.getItem('estate_leads') || '[]');
    localStorage.setItem('estate_leads', JSON.stringify([...existingLeads, lead]));

    console.log('Lead captured:', lead);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Share2 size={20} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main Image */}
            <div className="relative h-96 lg:h-[600px] rounded-2xl overflow-hidden group">
              <img
                src={property.images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowGallery(true)}
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold shadow-lg capitalize">
                For {property.status}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 gap-4">
              {property.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="h-44 lg:h-72 rounded-2xl overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => {
                    setCurrentImageIndex(index + 1);
                    setShowGallery(true);
                  }}
                >
                  <img
                    src={image}
                    alt={`${property.title} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {property.images.length > 5 && (
                <div
                  className="h-44 lg:h-72 rounded-2xl bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setShowGallery(true)}
                >
                  <span className="text-white text-xl font-semibold">
                    +{property.images.length - 5} more
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin size={20} className="mr-2" />
                    <span className="text-lg">{property.location}</span>
                  </div>
                </div>
                {property.verified && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Check size={16} />
                    Verified
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-blue-600">
                {formatPrice(property.price)}
              </div>
            </div>

            {/* Key Details */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Bed size={20} />
                    <span className="text-sm">Bedrooms</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {property.bedrooms}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Bath size={20} />
                    <span className="text-sm">Bathrooms</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {property.bathrooms}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Maximize size={20} />
                    <span className="text-sm">Area</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {property.areaSqft.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">sqft</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Type</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {property.category}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl"
                    >
                      <Check size={18} className="text-green-600 flex-shrink-0" />
                      <span className="text-gray-900">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {(property.yearBuilt || property.parking || property.floors) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Additional Details
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.yearBuilt && (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">Year Built</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {property.yearBuilt}
                      </div>
                    </div>
                  )}
                  {property.parking && (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">Parking</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {property.parking} {property.parking === 1 ? 'space' : 'spaces'}
                      </div>
                    </div>
                  )}
                  {property.floors && (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">Floors</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {property.floors}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* YouTube Video */}
            {property.videoUrl && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Video Walkthrough
                </h2>
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900">
                  <iframe
                    src={property.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Interested in this property?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Mail size={20} />
                    Contact Owner
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Schedule Visit
                  </button>
                  <button
                    onClick={() => setShowLeadCapture(true)}
                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download Brochure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Property Owner"
      >
        <form onSubmit={handleContact} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Your Name
            </label>
            <input
              type="text"
              required
              value={contactForm.name}
              onChange={(e) =>
                setContactForm({ ...contactForm, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={contactForm.email}
              onChange={(e) =>
                setContactForm({ ...contactForm, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone
            </label>
            <input
              type="tel"
              required
              value={contactForm.phone}
              onChange={(e) =>
                setContactForm({ ...contactForm, phone: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message
            </label>
            <textarea
              required
              rows={4}
              value={contactForm.message}
              onChange={(e) =>
                setContactForm({ ...contactForm, message: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
          >
            Send Message
          </button>
        </form>
      </Modal>

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule a Visit"
      >
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Time
            </label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select a time</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
          >
            Confirm Schedule
          </button>
        </form>
      </Modal>

      {/* Gallery Modal */}
      <Modal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        size="xl"
      >
        <div className="relative">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          {property.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <ChevronRight size={28} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        propertyTitle={property.title}
        onSubmit={handleLeadCapture}
      />
    </div>
  );
};