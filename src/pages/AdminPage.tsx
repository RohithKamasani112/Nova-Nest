import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import {
  createProperty,
  updateProperty,
  uploadImage,
} from '../services/storageService';
import {
  Baby,
  Building2,
  Car,
  Check,
  CheckCircle,
  Cctv,
  Dumbbell,
  Flame,
  Home,
  Landmark,
  Phone,
  ShieldCheck,
  Trees,
  Upload,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface AdminPageProps {
  onNavigate: (page: string) => void;
  editingProperty?: Property | null;
}

type FormData = {
  title: string;
  category: string;
  listingType: string;
  streetAddress: string;
  city: string;
  pincode: string;
  location: string;
  description: string;
  propertyAge: string;
  price: string;
  pricePerSqft: string;
  maintenanceCharges: string;
  securityDeposit: string;
  bookingAmount: string;
  priceNegotiable: string;
  priceIncludes: string[];
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  areaSqft: string;
  carpetArea: string;
  builtUpArea: string;
  yearBuilt: string;
  totalFloors: string;
  floorNumber: string;
  facingDirection: string;
  carParking: string;
  furnishingStatus: string;
  possessionStatus: string;
  availableFrom: string;
  ownershipType: string;
  additionalRooms: string[];
  amenities: string[];
  images: string[];
  videoUrl: string;
  googleMapsLink: string;
  featured: boolean;
  verified: boolean;
  urgent: boolean;
  reraRegistered: boolean;
  bankLoanAvailable: boolean;
  zeroBrokerage: boolean;
  isActive: boolean;
  reraRegistrationNumber: string;
  contactNumber: string;
  status: Property['status'];
};

const initialFormData: FormData = {
  title: '',
  category: 'Apartment',
  listingType: 'For Sale',
  streetAddress: '',
  city: '',
  pincode: '',
  location: '',
  description: '',
  propertyAge: '',
  price: '',
  pricePerSqft: '',
  maintenanceCharges: '',
  securityDeposit: '',
  bookingAmount: '',
  priceNegotiable: 'Yes',
  priceIncludes: [],
  bedrooms: '',
  bathrooms: '',
  balconies: '',
  areaSqft: '',
  carpetArea: '',
  builtUpArea: '',
  yearBuilt: '',
  totalFloors: '',
  floorNumber: '',
  facingDirection: '',
  carParking: '',
  furnishingStatus: '',
  possessionStatus: '',
  availableFrom: '',
  ownershipType: '',
  additionalRooms: [],
  amenities: [],
  images: [],
  videoUrl: '',
  googleMapsLink: '',
  featured: false,
  verified: false,
  urgent: false,
  reraRegistered: false,
  bankLoanAvailable: false,
  zeroBrokerage: false,
  isActive: true,
  reraRegistrationNumber: '',
  contactNumber: '',
  status: 'buy',
};

const propertyTypeOptions = [
  'Apartment',
  'Villa',
  'Independent House',
  'Plot / Land',
  'Commercial Office',
  'Shop / Showroom',
  'Warehouse',
  'PG / Hostel',
];

const listingTypeOptions = ['For Sale', 'For Rent', 'For Lease', 'PG / Co-living'];
const propertyAgeOptions = ['Under Construction', 'Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
const priceIncludesOptions = ['Car Parking', 'Club Membership', 'Modular Kitchen', 'Water Connection', 'Electricity Connection'];
const bedroomOptions = ['Studio', '1', '2', '3', '4', '5', '6+'];
const bathroomOptions = ['1', '2', '3', '4', '5+'];
const balconyOptions = ['0', '1', '2', '3+'];
const facingOptions = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
const carParkingOptions = ['None', '1 Open', '1 Covered', '2 Open', '2 Covered', '2 (1 Open + 1 Covered)'];
const furnishingOptions = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'];
const possessionOptions = ['Ready to Move', 'Under Construction'];
const ownershipOptions = ['Freehold', 'Leasehold', 'Co-operative Society', 'Power of Attorney'];
const additionalRoomOptions = ['Servant Room', 'Study Room', 'Pooja Room', 'Store Room', 'Guest Room'];
const amenityOptions = [
  'Swimming Pool',
  'Gym',
  'Covered Parking',
  'Garden / Lawn',
  '24/7 Security',
  'Elevator / Lift',
  'Power Backup',
  'Clubhouse',
  "Children's Play Area",
  'Jogging Track',
  'CCTV Surveillance',
  'Gated Community',
  'Vastu Compliant',
  'Fire Safety System',
  'High-Speed Internet',
  '24/7 Water Supply',
  'Rainwater Harvesting',
  'Intercom Facility',
  'Visitor Parking',
  'Maintenance Staff',
];

const inputClass =
  'w-full min-w-0 border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20 md:text-sm';
const selectClass = inputClass;
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

const amenityIcons: Record<string, React.ElementType> = {
  'Swimming Pool': Home,
  Gym: Dumbbell,
  'Covered Parking': Car,
  'Garden / Lawn': Trees,
  '24/7 Security': ShieldCheck,
  'Elevator / Lift': Building2,
  'Power Backup': Zap,
  Clubhouse: Users,
  "Children's Play Area": Baby,
  'Jogging Track': Users,
  'CCTV Surveillance': Cctv,
  'Gated Community': ShieldCheck,
  'Vastu Compliant': Landmark,
  'Fire Safety System': Flame,
  'High-Speed Internet': Wifi,
  '24/7 Water Supply': Home,
  'Rainwater Harvesting': Home,
  'Intercom Facility': Phone,
  'Visitor Parking': Car,
  'Maintenance Staff': Users,
};

const toFormCategory = (category: Property['category']): string => {
  const categoryMap: Record<Property['category'], string> = {
    apartment: 'Apartment',
    villa: 'Villa',
    house: 'Independent House',
    land: 'Plot / Land',
    condo: 'Apartment',
    townhouse: 'Independent House',
  };

  return categoryMap[category];
};

const splitLocation = (location: string) => {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  const pincodeMatch = location.match(/\b\d{6}\b/);

  return {
    streetAddress: parts[0] || location,
    city: parts.length > 1 ? parts[parts.length - 2] : '',
    pincode: pincodeMatch?.[0] || '',
  };
};

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigate,
  editingProperty,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (!editingProperty) {
      setFormData(initialFormData);
      setStep(1);
      return;
    }
    const locationParts = splitLocation(editingProperty.location || '');

    setFormData((prev) => ({
      ...prev,
      title: editingProperty.title || '',
      category: toFormCategory(editingProperty.category),
      listingType: editingProperty.status === 'rent' ? 'For Rent' : 'For Sale',
      price: editingProperty.price ? String(editingProperty.price) : '',
      location: editingProperty.location || '',
      streetAddress: locationParts.streetAddress,
      city: locationParts.city,
      pincode: locationParts.pincode,
      description: editingProperty.description || '',
      bedrooms: editingProperty.bedrooms ? String(editingProperty.bedrooms) : '',
      bathrooms: editingProperty.bathrooms ? String(editingProperty.bathrooms) : '',
      areaSqft: editingProperty.areaSqft ? String(editingProperty.areaSqft) : '',
      featured: Boolean(editingProperty.featured),
      verified: Boolean(editingProperty.verified),
      isActive: editingProperty.isActive !== false,
      yearBuilt: editingProperty.yearBuilt ? String(editingProperty.yearBuilt) : '',
      totalFloors: editingProperty.floors ? String(editingProperty.floors) : '',
      images: editingProperty.images || [],
      amenities: editingProperty.amenities || [],
      videoUrl: editingProperty.videoUrl || '',
      status: editingProperty.status,
    }));
    setStep(2);
  }, [editingProperty]);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error?.field === field) setError(null);
  };

  const toggleArrayValue = (field: 'priceIncludes' | 'additionalRooms' | 'amenities', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const showError = (field: string, message: string) => {
    setError({ field, message });
    setTimeout(() => {
      document.querySelector(`[data-field="${field}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  };

  const validateStep = (targetStep = step) => {
    if (targetStep === 2) {
      if (!formData.title.trim()) return showError('title', 'Property Title is required'), false;
      if (!formData.category) return showError('category', 'Property Type is required'), false;
      if (!formData.listingType) return showError('listingType', 'Listing Type is required'), false;
      if (!formData.streetAddress.trim()) return showError('streetAddress', 'Street Address / Locality is required'), false;
      if (!formData.city.trim()) return showError('city', 'City is required'), false;
      if (!/^\d{6}$/.test(formData.pincode)) return showError('pincode', 'Pincode must be exactly 6 digits'), false;
      if (formData.description.trim().length < 100) return showError('description', 'Description must be at least 100 characters'), false;
    }

    if (targetStep === 3) {
      if (!formData.price || Number(formData.price) <= 0) return showError('price', 'Sale / Rent Price is required'), false;
    }

    if (targetStep === 4) {
      if (!formData.bedrooms) return showError('bedrooms', 'Bedrooms is required'), false;
      if (!formData.bathrooms) return showError('bathrooms', 'Bathrooms is required'), false;
      if (!formData.areaSqft || Number(formData.areaSqft) <= 0) return showError('areaSqft', 'Total Area (sqft) is required'), false;
    }

    setError(null);
    return true;
  };

  const goNext = () => {
    if (validateStep()) setStep((current) => current + 1);
  };

  const normalizeCategory = (category: string): Property['category'] => {
    if (category === 'Villa') return 'villa';
    if (category === 'Independent House') return 'house';
    if (category === 'Plot / Land') return 'land';
    return 'apartment';
  };

  const parseCount = (value: string) => {
    if (value === 'Studio') return 0;
    if (value.includes('+')) return parseInt(value, 10);
    return value ? parseInt(value, 10) : 0;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20,
    onDrop: async (files) => {
      const availableSlots = 20 - formData.images.length;
      const filesToUpload = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        toast.error('You can upload up to 20 images');
      }

      setUploadingImages(true);
      try {
        const urls: string[] = [];
        for (const file of filesToUpload) {
          const url = await uploadImage(file, formData.title);
          urls.push(url);
        }
        setField('images', [...formData.images, ...urls]);
        if (urls.length > 0) toast.success(`${urls.length} image(s) uploaded`);
      } catch (uploadError) {
        toast.error('Failed to upload images');
      } finally {
        setUploadingImages(false);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const stepToValidate of [2, 3, 4]) {
      if (!validateStep(stepToValidate)) {
        setStep(stepToValidate);
        return;
      }
    }

    const fullLocation = [formData.streetAddress, formData.city, formData.pincode]
      .filter(Boolean)
      .join(', ');
    const fullState = { ...formData, location: fullLocation };
    console.log('Property form state:', fullState);

    setLoading(true);
    try {
      const propertyData: Omit<Property, 'id' | 'createdAt'> = {
        title: formData.title,
        price: parseInt(formData.price, 10),
        location: fullLocation,
        description: formData.description,
        category: normalizeCategory(formData.category),
        status: formData.listingType === 'For Rent' || formData.listingType === 'For Lease' || formData.listingType === 'PG / Co-living' ? 'rent' : 'buy',
        bedrooms: parseCount(formData.bedrooms),
        bathrooms: parseCount(formData.bathrooms),
        areaSqft: parseInt(formData.areaSqft, 10),
        images: formData.images,
        videos: formData.videoUrl ? [formData.videoUrl] : [],
        amenities: formData.amenities,
        featured: formData.featured,
        verified: formData.verified,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : undefined,
        parking: formData.carParking && formData.carParking !== 'None' ? parseInt(formData.carParking, 10) || undefined : undefined,
        floors: formData.totalFloors ? parseInt(formData.totalFloors, 10) : undefined,
        furnished: formData.furnishingStatus === 'Fully Furnished',
        videoUrl: formData.videoUrl,
        isActive: formData.isActive,
      };

      if (editingProperty) {
        await updateProperty(editingProperty.id, propertyData);
        toast.success('Property updated successfully');
      } else {
        await createProperty(propertyData);
        toast.success('Property created successfully');
      }

      onNavigate('dashboard');
    } catch (submitError) {
      toast.error('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `${inputClass} ${error?.field === field ? 'border-red-500' : 'border-gray-200'}`;

  const selectFieldClass = (field: string) =>
    `${selectClass} ${error?.field === field ? 'border-red-500' : 'border-gray-200'}`;

  const ErrorText = ({ field }: { field: string }) =>
    error?.field === field ? <p className="mt-1 text-sm text-red-600">{error.message}</p> : null;

  const renderCurrencyInput = ({
    field,
    label,
    placeholder,
    required,
  }: {
    field: 'price' | 'pricePerSqft' | 'maintenanceCharges' | 'securityDeposit' | 'bookingAmount';
    label: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div data-field={field}>
      <label className={labelClass}>
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
        <input
          type="number"
          placeholder={placeholder}
          value={formData[field]}
          onChange={(e) => setField(field, e.target.value)}
          className={`${fieldClass(field)} pl-12`}
        />
      </div>
      <ErrorText field={field} />
    </div>
  );

  const CheckboxGroup = ({
    options,
    field,
  }: {
    options: string[];
    field: 'priceIncludes' | 'additionalRooms';
  }) => (
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={formData[field].includes(option)}
            onChange={() => toggleArrayValue(field, option)}
            className="rounded border-gray-300 text-[#C9922A] focus:ring-[#C9922A]"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );

  const FlagCheckbox = ({
    field,
    label,
    description,
  }: {
    field: 'featured' | 'verified' | 'urgent' | 'reraRegistered' | 'bankLoanAvailable' | 'zeroBrokerage' | 'isActive';
    label: string;
    description: string;
  }) => (
    <label className="block">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData[field]}
          onChange={(e) => setField(field, e.target.checked)}
          className="rounded border-gray-300 text-[#C9922A] focus:ring-[#C9922A]"
        />
        <span className="font-medium text-gray-800">{label}</span>
      </span>
      <span className="ml-6 block text-sm text-gray-500">{description}</span>
    </label>
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-5 font-['Playfair_Display'] text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 sm:mb-8">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              if (s <= step || validateStep()) setStep(s);
            }}
            className={`h-10 w-10 flex-shrink-0 rounded-full text-sm font-bold transition-all sm:h-12 sm:w-12 sm:text-base ${
              step > s
                ? 'bg-[#C9922A] text-white'
                : step === s
                ? 'border-2 border-[#C9922A] text-[#C9922A] bg-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step > s ? <Check size={24} /> : s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">List Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['buy', 'rent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setField('status', type);
                    setField('listingType', type === 'buy' ? 'For Sale' : 'For Rent');
                    setStep(2);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.status === type
                      ? 'border-[#C9922A] bg-[#FBF3E3] shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#C9922A]/50'
                  }`}
                >
                  <div className="font-bold text-lg mb-2 capitalize text-gray-900">
                    {type === 'buy' ? 'List for Sale' : 'List for Rent'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {type === 'buy'
                      ? 'Sell your property to buyers'
                      : 'Rent your property to tenants'}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 px-6 py-3 bg-[#C9922A] hover:bg-[#b07d20] text-white font-semibold rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Basic Info</h2>
            <div data-field="title">
              <label className={labelClass}>Property Title *</label>
              <input
                type="text"
                placeholder="Property Title"
                value={formData.title}
                onChange={(e) => setField('title', e.target.value)}
                className={fieldClass('title')}
              />
              <ErrorText field="title" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-field="category">
                <label className={labelClass}>Property Type *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className={selectFieldClass('category')}
                >
                  {propertyTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ErrorText field="category" />
              </div>
              <div data-field="listingType">
                <label className={labelClass}>Listing Type *</label>
                <select
                  value={formData.listingType}
                  onChange={(e) => {
                    setField('listingType', e.target.value);
                    setField('status', e.target.value === 'For Sale' ? 'buy' : 'rent');
                  }}
                  className={selectFieldClass('listingType')}
                >
                  {listingTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ErrorText field="listingType" />
              </div>
            </div>
            <div data-field="streetAddress">
              <label className={labelClass}>Street Address / Locality *</label>
              <input
                type="text"
                placeholder="e.g. Flat 4B, Prestige Tower, Banjara Hills"
                value={formData.streetAddress}
                onChange={(e) => setField('streetAddress', e.target.value)}
                className={fieldClass('streetAddress')}
              />
              <ErrorText field="streetAddress" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-field="city">
                <label className={labelClass}>City *</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad"
                  value={formData.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className={fieldClass('city')}
                />
                <ErrorText field="city" />
              </div>
              <div data-field="pincode">
                <label className={labelClass}>Pincode *</label>
                <input
                  type="number"
                  placeholder="e.g. 500034"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setField('pincode', e.target.value.slice(0, 6))}
                  className={fieldClass('pincode')}
                />
                <ErrorText field="pincode" />
              </div>
            </div>
            <div data-field="description">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Description *</label>
                <span className="text-sm text-gray-500">{formData.description.length} / 500</span>
              </div>
              <textarea
                placeholder="Describe the property in detail - layout, ventilation, surroundings, nearby landmarks (minimum 100 characters)"
                maxLength={500}
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                className={`${fieldClass('description')} h-28`}
              />
              <ErrorText field="description" />
              <p className="mt-1 text-sm text-gray-500">Tip: mention nearby metro, schools, hospitals, or malls to attract more leads</p>
            </div>
            <div>
              <label className={labelClass}>Property Age</label>
              <select value={formData.propertyAge} onChange={(e) => setField('propertyAge', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                <option value="">Select Property Age</option>
                {propertyAgeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button type="button" onClick={goNext} className="flex-1 px-6 py-3 bg-[#C9922A] hover:bg-[#b07d20] text-white font-semibold rounded-xl transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderCurrencyInput({ field: 'price', label: 'Sale / Rent Price', required: true })}
              {renderCurrencyInput({ field: 'pricePerSqft', label: 'Price per sqft', placeholder: 'Leave blank to auto-calculate' })}
              {renderCurrencyInput({ field: 'maintenanceCharges', label: 'Maintenance Charges', placeholder: 'Monthly amount' })}
              {renderCurrencyInput({ field: 'securityDeposit', label: 'Security Deposit', placeholder: 'Applicable for rent/lease' })}
              {renderCurrencyInput({ field: 'bookingAmount', label: 'Booking Amount', placeholder: 'Token amount to confirm booking' })}
              <div>
                <label className={labelClass}>Price Negotiable?</label>
                <select value={formData.priceNegotiable} onChange={(e) => setField('priceNegotiable', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  {['Yes', 'No', 'Slightly Negotiable'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Price Includes</label>
              <CheckboxGroup options={priceIncludesOptions} field="priceIncludes" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button type="button" onClick={goNext} className="flex-1 px-6 py-3 bg-[#C9922A] hover:bg-[#b07d20] text-white font-semibold rounded-xl transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div data-field="bedrooms">
                <label className={labelClass}>Bedrooms *</label>
                <select value={formData.bedrooms} onChange={(e) => setField('bedrooms', e.target.value)} className={selectFieldClass('bedrooms')}>
                  <option value="">Select</option>
                  {bedroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ErrorText field="bedrooms" />
              </div>
              <div data-field="bathrooms">
                <label className={labelClass}>Bathrooms *</label>
                <select value={formData.bathrooms} onChange={(e) => setField('bathrooms', e.target.value)} className={selectFieldClass('bathrooms')}>
                  <option value="">Select</option>
                  {bathroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ErrorText field="bathrooms" />
              </div>
              <div>
                <label className={labelClass}>Balconies</label>
                <select value={formData.balconies} onChange={(e) => setField('balconies', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {balconyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div data-field="areaSqft">
                <label className={labelClass}>Total Area (sqft) *</label>
                <input type="number" placeholder="0" value={formData.areaSqft} onChange={(e) => setField('areaSqft', e.target.value)} className={fieldClass('areaSqft')} />
                <ErrorText field="areaSqft" />
              </div>
              <div>
                <label className={labelClass}>Carpet Area (sqft)</label>
                <input type="number" placeholder="0" value={formData.carpetArea} onChange={(e) => setField('carpetArea', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
              <div>
                <label className={labelClass}>Built-up Area (sqft)</label>
                <input type="number" placeholder="0" value={formData.builtUpArea} onChange={(e) => setField('builtUpArea', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Year Built</label>
                <input type="number" placeholder="e.g. 2018" value={formData.yearBuilt} onChange={(e) => setField('yearBuilt', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
              <div>
                <label className={labelClass}>Total Floors in Building</label>
                <input type="number" placeholder="e.g. 12" value={formData.totalFloors} onChange={(e) => setField('totalFloors', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
              <div>
                <label className={labelClass}>Property on Floor No.</label>
                <input type="number" placeholder="e.g. 7" value={formData.floorNumber} onChange={(e) => setField('floorNumber', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Facing Direction</label>
                <select value={formData.facingDirection} onChange={(e) => setField('facingDirection', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {facingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Car Parking</label>
                <select value={formData.carParking} onChange={(e) => setField('carParking', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {carParkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Furnishing Status</label>
                <select value={formData.furnishingStatus} onChange={(e) => setField('furnishingStatus', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {furnishingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Possession Status</label>
                <select value={formData.possessionStatus} onChange={(e) => setField('possessionStatus', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {possessionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Available From</label>
                <input type="date" value={formData.availableFrom} onChange={(e) => setField('availableFrom', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
              </div>
              <div>
                <label className={labelClass}>Ownership Type</label>
                <select value={formData.ownershipType} onChange={(e) => setField('ownershipType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20">
                  <option value="">Select</option>
                  {ownershipOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Additional Rooms</label>
              <CheckboxGroup options={additionalRoomOptions} field="additionalRooms" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={() => setStep(3)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button type="button" onClick={goNext} className="flex-1 px-6 py-3 bg-[#C9922A] hover:bg-[#b07d20] text-white font-semibold rounded-xl transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Amenities & Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenityOptions.map((amenity) => {
                const Icon = amenityIcons[amenity] || Home;
                const selected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleArrayValue('amenities', amenity)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all ${
                      selected
                        ? 'border-[#b07d20] bg-[#fdf3d8] text-[#b07d20]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#C9922A]/50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images *
              </label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9922A] transition-colors"
              >
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">{uploadingImages ? 'Uploading images...' : 'Drag images here or click to select'}</p>
                <p className="mt-2 text-sm text-gray-500">Supported formats: JPG, PNG, WEBP - Max size: 10MB per image - Up to 20 images</p>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {formData.images.map((img, i) => (
                    <div key={`${img}-${i}`} className="relative">
                      <img src={img} alt={`Preview ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setField('images', formData.images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        aria-label="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>YouTube / Video Tour URL (optional)</label>
              <input type="url" value={formData.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20" />
            </div>
            <div>
              <label className={labelClass}>Google Maps Location Link (optional)</label>
              <input
                type="url"
                placeholder="Paste Google Maps share link here"
                value={formData.googleMapsLink}
                onChange={(e) => setField('googleMapsLink', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20"
              />
              <p className="mt-1 text-sm text-gray-500">Go to Google Maps - search your property - click Share - Copy link</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={() => setStep(4)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button type="button" onClick={() => setStep(6)} className="flex-1 px-6 py-3 bg-[#C9922A] hover:bg-[#b07d20] text-white font-semibold rounded-xl transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Flags & Publish</h2>
            <FlagCheckbox field="isActive" label="Active Listing" description="Show this property on the public home and properties pages" />
            <FlagCheckbox field="featured" label="Featured" description="Highlighted at the top of search results and homepage" />
            <FlagCheckbox field="verified" label="Verified" description="Displays a verified badge - only check if you have physically verified this property" />
            <FlagCheckbox field="urgent" label="Urgent Sale / Rent" description="Displays an urgent tag on the listing card to attract faster inquiries" />
            <FlagCheckbox field="reraRegistered" label="RERA Registered" description="Required by law for projects above a certain size. Check if applicable" />
            <FlagCheckbox field="bankLoanAvailable" label="Bank Loan Available" description="Helps buyers know financing is possible for this property" />
            <FlagCheckbox field="zeroBrokerage" label="Zero Brokerage" description="Marks listing as direct owner - no broker fee for buyer/tenant" />

            {formData.reraRegistered && (
              <div>
                <label className={labelClass}>RERA Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. P52100012345"
                  value={formData.reraRegistrationNumber}
                  onChange={(e) => setField('reraRegistrationNumber', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Contact Number for Leads (optional)</label>
              <input
                type="tel"
                placeholder="Leave blank to use your profile number"
                value={formData.contactNumber}
                onChange={(e) => setField('contactNumber', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9922A] focus:ring-2 focus:ring-[#C9922A]/20"
              />
              <p className="mt-1 text-sm text-gray-500">This number will be shown to interested buyers/tenants</p>
            </div>

            <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
              <h3 className="font-semibold text-gray-900 mb-2">Review before publishing</h3>
              <p>Title: {formData.title || '-'}</p>
              <p>Type: {formData.category || '-'}</p>
              <p>Location: {[formData.streetAddress, formData.city, formData.pincode].filter(Boolean).join(', ') || '-'}</p>
              <p>Price: {formData.price ? `₹${formData.price}` : '-'}</p>
              <p>Bedrooms: {formData.bedrooms || '-'}</p>
              <p>Bathrooms: {formData.bathrooms || '-'}</p>
              <p>Area: {formData.areaSqft ? `${formData.areaSqft} sqft` : '-'}</p>
              <p>Visibility: {formData.isActive ? 'Active' : 'Inactive'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button type="button" onClick={() => setStep(5)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-[#2d7a3a] hover:bg-[#256931] text-white font-semibold rounded-xl transition-colors disabled:bg-gray-400 inline-flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                {loading ? 'Publishing...' : editingProperty ? 'Update Property' : 'Publish Property'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
