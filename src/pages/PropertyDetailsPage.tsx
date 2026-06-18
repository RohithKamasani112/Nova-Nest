import React, { useEffect, useState } from 'react';
import { Property, Inquiry } from '../types';
import { createLead, getAllProperties } from '../services/storageService';
import { PropertyCard } from '../app/components/PropertyCard';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bath,
  Bed,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  Share2,
  User,
  X,
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
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadType, setLeadType] = useState<'contact-owner' | 'schedule-visit' | 'request-info'>('contact-owner');
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: '', phone: '', email: '' });
  const [loadingLead, setLoadingLead] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    const loadSimilarProperties = async () => {
      try {
        const allProps = await getAllProperties();
        setSimilarProperties(
          allProps.filter((p) => p.category === property.category && p.id !== property.id).slice(0, 3)
        );
      } catch (error) {
        console.error('Error loading similar properties:', error);
      }
    };

    loadSimilarProperties();
  }, [property]);

  const formatPrice = (price: number): string => {
    if (property.status === 'rent') return `\u20B9${price.toLocaleString()}/month`;
    if (price >= 10000000) return `\u20B9${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `\u20B9${(price / 100000).toFixed(2)} L`;
    return `\u20B9${price.toLocaleString()}`;
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
        message: leadType === 'schedule-visit' ? 'Schedule a visit' : leadType === 'request-info' ? 'Request info' : 'Contact owner',
        type: leadType,
      };

      await createLead(inquiryData);
      toast.success('Inquiry submitted successfully');
      setShowLeadModal(false);
      setLeadForm({ name: '', phone: '', email: '' });
    } catch (error) {
      toast.error('Failed to submit inquiry');
    } finally {
      setLoadingLead(false);
    }
  };

  const imageCount = property.images.length;
  const propertyTypeLabel = property.category === 'land' ? 'Plot' : property.category;
  const description =
    property.description ||
    'A verified Nova Nest listing with detailed advisory support available for site visits, pricing guidance, and documentation.';
  const descriptionText = expandedDescription ? description : description.substring(0, 220);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
  const whatsappMessage = `Hi, I am interested in the property "${property.title}" in ${property.location}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const goPrev = () => setCurrentImageIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  const goNext = () => setCurrentImageIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  const openLead = (type: typeof leadType) => {
    setLeadType(type);
    setShowLeadModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#111827]">
      <div className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={onClose} className="group flex items-center gap-2 text-sm font-semibold text-[#0F1F3D] transition-colors hover:text-gold">
            <ArrowLeft size={20} className="transition-transform duration-[250ms] group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gold/10 sm:hidden">
            <X size={24} />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <div className="space-y-8">
            <div className="relative h-96 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_50px_rgba(15,31,61,0.16)] sm:h-[520px]">
              {imageCount > 0 ? (
                <>
                  <motion.img
                    key={currentImageIndex}
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />
                  {imageCount > 1 && (
                    <>
                      <button onClick={goPrev} className="absolute left-4 top-1/2 z-10 rounded-full bg-white/35 p-3 backdrop-blur-md transition-all hover:bg-white/55">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={goNext} className="absolute right-4 top-1/2 z-10 rounded-full bg-white/35 p-3 backdrop-blur-md transition-all hover:bg-white/55">
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 right-4 rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                        {currentImageIndex + 1}/{imageCount}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gold/10">
                  <Home size={72} className="text-gold" />
                </div>
              )}
            </div>

            {imageCount > 1 && (
              <div className="flex gap-3 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-subtle no-scrollbar">
                {property.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      index === currentImageIndex ? 'border-[#C9922A] shadow-subtle' : 'border-[#E5E7EB] hover:border-gold/50'
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <section className="rounded-2xl border border-[#E5E7EB] border-t-4 border-t-[#C9922A] bg-white p-6 shadow-[0_10px_30px_rgba(15,31,61,0.08)] sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm capitalize">
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-semibold text-gold">
                  {propertyTypeLabel}
                </span>
                <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 font-semibold text-[#374151]">
                  {property.status === 'buy' ? 'For Sale' : 'For Rent'}
                </span>
                {property.featured && (
                  <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 font-semibold text-gold">
                    Featured
                  </span>
                )}
                {property.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 font-semibold text-gold">
                    <Check size={15} />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[1.75rem] font-bold leading-tight text-[#0F1F3D] md:text-5xl">
                {property.title}
              </h1>

              <div className="mt-3 flex items-center gap-2 text-[#4B5563]">
                <MapPin size={18} className="flex-shrink-0 text-gold" />
                <span>{property.location}</span>
              </div>

              <div className="mt-5 font-sans text-[2.15rem] font-bold leading-none text-[#C9922A]">
                {formatPrice(property.price)}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: Bed, label: 'Bedrooms', value: property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Studio' },
                  { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                  { icon: Maximize, label: 'Area', value: `${property.areaSqft.toLocaleString()} sqft` },
                  { icon: Home, label: 'Type', value: propertyTypeLabel },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-[#FBFAF7] p-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{label}</span>
                      <span className="block font-semibold text-[#111827] capitalize">{value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[#E5E7EB] pt-7">
                <h2 className="mb-4 font-serif text-3xl font-bold text-[#0F1F3D]">Description</h2>
                <p className="leading-8 text-[#4B5563]">
                  {descriptionText}
                  {!expandedDescription && description.length > 220 ? '...' : ''}
                </p>
                {description.length > 220 && (
                  <button onClick={() => setExpandedDescription(!expandedDescription)} className="mt-3 font-semibold text-gold underline-offset-4 hover:underline">
                    {expandedDescription ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            </section>

            {property.amenities.length > 0 && (
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
                <h2 className="mb-4 font-serif text-3xl font-bold text-[#0F1F3D]">Amenities</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-4 shadow-subtle">
                      <Check size={18} className="text-gold" />
                      <span className="text-sm text-[#111827]">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(property.parking !== undefined || property.floors !== undefined || property.furnished !== undefined) && (
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
                <h2 className="mb-4 font-serif text-3xl font-bold text-[#0F1F3D]">Property Details</h2>
                <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
                  {property.parking !== undefined && (
                    <div className="flex justify-between border-b border-[#E5E7EB] p-4">
                      <span className="text-[#6B7280]">Parking</span>
                      <span className="font-semibold text-[#111827]">{property.parking} spaces</span>
                    </div>
                  )}
                  {property.floors !== undefined && (
                    <div className="flex justify-between border-b border-[#E5E7EB] p-4">
                      <span className="text-[#6B7280]">Total Floors</span>
                      <span className="font-semibold text-[#111827]">{property.floors}</span>
                    </div>
                  )}
                  {property.furnished !== undefined && (
                    <div className="flex justify-between p-4">
                      <span className="text-[#6B7280]">Furnishing</span>
                      <span className="font-semibold text-[#111827]">{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {similarProperties.length > 0 && (
              <section>
                <h2 className="mb-6 font-serif text-3xl font-bold text-[#0F1F3D]">Similar Properties</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similarProperties.map((prop, index) => (
                    <PropertyCard key={prop.id} property={prop} index={index} onClick={() => onPropertyClick(prop)} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_14px_40px_rgba(15,31,61,0.12)] lg:sticky lg:top-6"
            >
              <div className="bg-[#0F1F3D] p-6 text-white">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9922A]">Nova Nest Advisory</p>
                <div className="text-3xl font-bold text-[#C9922A]">{formatPrice(property.price)}</div>
                <p className="mt-2 text-sm text-white/70">{property.status === 'buy' ? 'For Sale' : 'For Rent'} in {property.location}</p>
              </div>

              <div className="space-y-4 p-6">
                <button onClick={() => openLead('contact-owner')} className="h-12 w-full rounded-md bg-[#0F1F3D] font-semibold text-[#C9922A] shadow-subtle transition-all duration-[250ms] hover:bg-[#1A2B4A] hover:shadow-medium">
                  Contact Owner
                </button>
                <button onClick={() => openLead('schedule-visit')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#C9922A] bg-white font-semibold text-[#C9922A] transition-colors hover:bg-gold/10">
                  <Calendar size={18} />
                  Schedule Visit
                </button>
                {property.brochure && (
                  <button onClick={() => openLead('request-info')} className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white font-semibold text-[#111827] transition-colors hover:bg-[#F9F5EF] hover:text-gold">
                    <Download size={18} />
                    Download Brochure
                  </button>
                )}

              <div className="mt-5 space-y-3 border-t border-[#E5E7EB] pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-gold/60 p-1">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gold text-white shadow-inner">
                      <User size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-lg font-bold text-[#0F1F3D]">Nova Nest Advisor</div>
                    <div className="text-xs text-[#6B7280]">Verified Property Team</div>
                  </div>
                </div>

                <a href="tel:+919845418570" className="flex h-12 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white font-semibold text-[#111827] transition-colors hover:bg-[#F9F5EF] hover:text-gold">
                  <Phone size={18} />
                  Call Agent
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white font-semibold text-[#111827] transition-colors hover:bg-[#F9F5EF] hover:text-gold">
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
                <button
                  onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white font-semibold text-[#111827] transition-colors hover:bg-[#F9F5EF] hover:text-gold"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {showLeadModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLeadModal(false)} className="fixed inset-0 z-40 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="w-full max-w-md rounded-md bg-white p-6 shadow-strong">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-[#0F1F3D]">
                    {leadType === 'schedule-visit' ? 'Schedule a Visit' : leadType === 'request-info' ? 'Request Brochure' : 'Contact Owner'}
                  </h2>
                  <button onClick={() => setShowLeadModal(false)} className="rounded-md p-1 transition-colors hover:bg-[#F5F5F0]">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  {[
                    ['name', 'Full Name', 'text'],
                    ['phone', 'Mobile', 'tel'],
                    ['email', 'Email', 'email'],
                  ].map(([field, label, type]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#111827]">{label} *</span>
                      <input
                        type={type}
                        required
                        value={leadForm[field as keyof LeadFormData]}
                        onChange={(e) => setLeadForm({ ...leadForm, [field]: e.target.value })}
                        className="w-full rounded-md border border-[#E5E7EB] px-4 py-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                    </label>
                  ))}
                  <button type="submit" disabled={loadingLead} className="premium-button w-full py-3 font-semibold disabled:bg-black/20">
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
};
