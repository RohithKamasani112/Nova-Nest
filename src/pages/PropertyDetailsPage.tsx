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
    if (property.status === 'rent') return `₹${price.toLocaleString()}/month`;
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
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

  const descriptionPreview = expandedDescription ? property.description : property.description.substring(0, 220);
  const imageCount = property.images.length;

  const goPrev = () => setCurrentImageIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  const goNext = () => setCurrentImageIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));

  const openLead = (type: typeof leadType) => {
    setLeadType(type);
    setShowLeadModal(true);
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="sticky top-0 z-40 bg-cream/95 border-b border-black/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={onClose} className="group flex items-center gap-2 text-sm text-charcoal hover:text-gold font-semibold transition-colors">
            <ArrowLeft size={20} className="transition-transform duration-[250ms] group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={onClose} className="sm:hidden p-2 hover:bg-gold/10 rounded-md">
            <X size={24} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <div className="space-y-8">
            <div className="relative h-96 sm:h-[520px] bg-black/10 rounded-xl overflow-hidden group shadow-subtle border border-black/5">
              {imageCount > 0 ? (
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
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />
                  {imageCount > 1 && (
                    <>
                      <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md p-3 rounded-full hover:bg-white/45 transition-all z-10">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md p-3 rounded-full hover:bg-white/45 transition-all z-10">
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/45 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        {currentImageIndex + 1}/{imageCount}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gold/10 flex items-center justify-center">
                  <Home size={72} className="text-gold" />
                </div>
              )}
            </div>

            {imageCount > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {property.images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-gold' : 'border-transparent hover:border-gold/40'
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <section>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm capitalize">
                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-semibold text-gold">
                  {property.category === 'land' ? 'Land' : property.category}
                </span>
                <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 font-semibold text-[#8A8A8A]">
                  {property.status === 'buy' ? 'For Sale' : 'For Rent'}
                </span>
              </div>
              <div className="hidden">
                {property.category} · {property.status === 'buy' ? 'For Sale' : 'For Rent'}
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={18} className="text-gold" />
                <span>{property.location}</span>
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-4 rounded-xl border border-black/5 bg-white p-5 shadow-subtle">
              <div className="font-sans text-4xl font-extrabold text-gold mr-2">
                {formatPrice(property.price)}
              </div>
              {property.featured && (
                <span className="inline-flex items-center bg-gold/15 text-gold border border-gold/25 px-4 py-2 rounded-sm font-semibold text-sm">
                  Featured
                </span>
              )}
              {property.verified && (
                <span className="inline-flex items-center bg-emerald/15 text-emerald border border-emerald/20 px-4 py-2 rounded-sm font-semibold text-sm gap-1">
                  <Check size={16} />
                  Verified
                </span>
              )}
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Bed, label: 'Bedrooms', value: property.bedrooms > 0 ? property.bedrooms : 'Studio' },
                { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                { icon: Maximize, label: 'Area', value: property.areaSqft.toLocaleString(), suffix: 'sqft' },
                { icon: Home, label: 'Year Built', value: property.yearBuilt || 'Ready' },
              ].map(({ icon: Icon, label, value, suffix }) => (
                <div key={label} className="rounded-xl border border-black/5 bg-white p-6 text-center shadow-subtle">
                  <Icon size={24} className="mx-auto text-gold mb-3" />
                  <div className="font-serif text-3xl font-bold text-charcoal">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{suffix || label}</div>
                </div>
              ))}
            </section>

            <div className="border-t border-black/10" />

            <section className="rounded-xl border border-black/5 bg-white p-6 shadow-subtle">
              <h2 className="font-serif text-3xl font-bold text-charcoal mb-4">Description</h2>
              <p className="text-muted-foreground leading-8">
                {descriptionPreview}
                {!expandedDescription && property.description.length > 220 ? '...' : ''}
              </p>
              {property.description.length > 220 && (
                <button onClick={() => setExpandedDescription(!expandedDescription)} className="text-gold font-semibold mt-3 hover:underline underline-offset-4">
                  {expandedDescription ? 'Read Less' : 'Read More'}
                </button>
              )}
            </section>

            {property.amenities.length > 0 && (
              <section className="rounded-xl border border-black/5 bg-white p-6 shadow-subtle">
                <h2 className="font-serif text-3xl font-bold text-charcoal mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 bg-white p-4 rounded-md shadow-subtle border border-black/5">
                      <Check size={18} className="text-gold" />
                      <span className="text-sm text-charcoal">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(property.parking !== undefined || property.floors !== undefined || property.furnished !== undefined) && (
              <section className="rounded-xl border border-black/5 bg-white p-6 shadow-subtle">
                <h2 className="font-serif text-3xl font-bold text-charcoal mb-4">Property Details</h2>
                <div className="bg-white rounded-md border border-black/5 overflow-hidden">
                  {property.parking !== undefined && (
                    <div className="flex justify-between p-4 border-b border-black/10">
                      <span className="text-muted-foreground">Parking</span>
                      <span className="font-semibold text-charcoal">{property.parking} spaces</span>
                    </div>
                  )}
                  {property.floors !== undefined && (
                    <div className="flex justify-between p-4 border-b border-black/10">
                      <span className="text-muted-foreground">Total Floors</span>
                      <span className="font-semibold text-charcoal">{property.floors}</span>
                    </div>
                  )}
                  {property.furnished !== undefined && (
                    <div className="flex justify-between p-4">
                      <span className="text-muted-foreground">Furnishing</span>
                      <span className="font-semibold text-charcoal">{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {similarProperties.length > 0 && (
              <section>
                <h2 className="font-serif text-3xl font-bold text-charcoal mb-6">Similar Properties</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="sticky top-24 bg-white rounded-xl shadow-subtle border border-[#EAEAEA] p-6 space-y-4"
            >
              <button onClick={() => openLead('contact-owner')} className="w-full min-h-12 rounded-md bg-charcoal py-3 font-semibold text-gold shadow-subtle transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-medium">
                Contact Owner
              </button>
              <button onClick={() => openLead('schedule-visit')} className="w-full min-h-11 py-3 border border-gold/60 text-gold rounded-md font-semibold hover:bg-gold/10 transition-colors flex items-center justify-center gap-2">
                <Calendar size={18} />
                Schedule Visit
              </button>
              {property.brochure && (
                <button onClick={() => openLead('request-info')} className="w-full min-h-11 py-3 border border-black/10 text-charcoal/70 rounded-md font-semibold hover:bg-cream transition-colors flex items-center justify-center gap-2">
                  <Download size={18} />
                  Download Brochure
                </button>
              )}

              <div className="border-t border-black/10 mt-5 pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full p-1 border border-gold/60">
                    <div className="w-full h-full rounded-full bg-gold flex items-center justify-center text-white shadow-inner">
                      <User size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-lg font-bold text-charcoal">Premium Agent</div>
                    <div className="text-xs text-muted-foreground">Verified Seller</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button className="min-h-11 bg-white border border-charcoal/30 text-charcoal rounded-md font-semibold hover:bg-charcoal hover:text-gold transition-colors flex items-center justify-center gap-2">
                    <Phone size={18} />
                    Call Agent
                  </button>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="min-h-11 bg-white border border-charcoal/30 text-charcoal rounded-md font-semibold hover:bg-charcoal hover:text-gold transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}
                    className="mt-2 min-h-11 w-full bg-white border border-black/10 text-charcoal rounded-md font-semibold hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center gap-2"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLeadModal(false)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-md p-6 max-w-md w-full shadow-strong">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-2xl font-bold text-charcoal">
                    {leadType === 'schedule-visit' ? 'Schedule a Visit' : leadType === 'request-info' ? 'Request Brochure' : 'Contact Owner'}
                  </h2>
                  <button onClick={() => setShowLeadModal(false)} className="p-1 hover:bg-cream rounded-md transition-colors">
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
                      <span className="block text-sm font-semibold text-charcoal mb-2">{label} *</span>
                      <input
                        type={type}
                        required
                        value={leadForm[field as keyof LeadFormData]}
                        onChange={(e) => setLeadForm({ ...leadForm, [field]: e.target.value })}
                        className="w-full px-4 py-3 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
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
