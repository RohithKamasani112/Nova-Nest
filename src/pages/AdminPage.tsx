import React, { useEffect, useRef, useState } from 'react';
import { NearbyPlace, Property } from '../types';
import {
  createProperty,
  updateProperty,
  uploadImage,
} from '../services/storageService';
import { Check, CheckCircle, Star, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import {
  EASE_ELEGANT,
  fadeUp as fadeUpVariant,
  stepVariants as stepVariantsBlur,
  staggerContainer,
} from '../lib/animation';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { NearbyPlacesScanner } from '../app/components/NearbyPlacesScanner';
import { ADMIN_LOCALITY_OPTIONS } from '../data/localities';
import { getAmenityIcon } from '../data/amenityIcons';

interface AdminPageProps {
  onNavigate: (page: string) => void;
  editingProperty?: Property | null;
}

type FormData = {
  title: string;
  category: string;
  listingType: string;
  streetAddress: string;
  locality: string;
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
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
};

const initialFormData: FormData = {
  title: '',
  category: 'Apartment',
  listingType: 'For Sale',
  streetAddress: '',
  locality: '',
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
  commissionType: 'percentage',
  commissionValue: '',
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
const priceIncludesOptions = ['Car Parking', 'Club Membership', 'Modular Kitchen', 'Water Charges', 'Electricity Charges'];
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

const stepTitles: Record<number, string> = {
  1: 'List Type',
  2: 'Basic Info',
  3: 'Pricing',
  4: 'Property Details',
  5: 'Amenities, Media & Commission',
  6: 'Flags & Publish',
};

const inputClass =
  'w-full min-w-0 border rounded-xl bg-white px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm';
const selectClass = inputClass;
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
// Plain control (no validation state) used by the many optional fields.
const plainControlClass =
  'w-full border border-gray-200 rounded-xl bg-white px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm';

const formatINR = (value: number): string => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

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

// Animated number that springs up to `value` and formats each frame (spec #19).
// Honors reduced-motion by snapping straight to the final value.
const CountUp: React.FC<{ value: number; format: (n: number) => string }> = ({ value, format }) => {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    mv.set(value);
    const unsubscribe = spring.on('change', (latest) => setDisplay(format(latest)));
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return <>{display}</>;
};

// Text input with a floating label (spec #18). The label lifts and shrinks to
// the field's top edge when focused or filled, tinting gold on focus.
const FloatingInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  maxLength?: number;
  className?: string;
}> = ({ label, value, onChange, type = 'text', textarea = false, maxLength, className }) => {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  const fieldClass =
    'peer w-full rounded-xl border border-gray-200 bg-white px-4 pt-5 pb-2 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm';

  return (
    <div className={`relative ${className ?? ''}`}>
      {textarea ? (
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${fieldClass} h-28 resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={fieldClass}
        />
      )}
      <motion.label
        initial={false}
        animate={
          reduce
            ? { color: focused ? '#2E4636' : '#5C5C72' }
            : {
                y: floated ? -10 : 0,
                scale: floated ? 0.82 : 1,
                color: focused ? '#2E4636' : '#5C5C72',
              }
        }
        transition={{ duration: 0.2, ease: EASE_ELEGANT }}
        className="pointer-events-none absolute left-4 top-3.5 origin-left text-sm font-medium"
      >
        {label}
      </motion.label>
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigate,
  editingProperty,
}) => {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  // Lat/lng from the selected Google Place — not a visible field, carried
  // separately from FormData so an unrelated edit doesn't need to re-select
  // the address to keep coordinates around.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  // Tracks which pricing field the user last touched so the reactive
  // price <-> price-per-sqft sync respects manual overrides (Section 2).
  const lastPricingEdit = useRef<'price' | 'pricePerSqft'>('price');

  // Single source of truth for listing type. Every step reads this to decide
  // whether to show "Sale" or "Rent" wording and which fields are relevant.
  const isRent = formData.status === 'rent';
  const priceLabel = isRent ? 'Monthly Rent' : 'Sale Price';
  // For rentals the possession field is a simple binary: either the unit is
  // ready now, or the owner wants to pin an available-from date (revealed as a
  // date picker right under the dropdown). Sales keep the original options.
  const possessionOptionsForType = isRent
    ? ['Ready to Move', 'Select Date']
    : possessionOptions;
  const showRentDatePicker = isRent && formData.possessionStatus === 'Select Date';

  // ----- Commission (Section 1) derived values -----
  const listingPrice = Number(formData.price) || 0;
  const commissionInput = Number(formData.commissionValue) || 0;
  const commissionPercent =
    formData.commissionType === 'percentage'
      ? commissionInput
      : listingPrice > 0
      ? (commissionInput / listingPrice) * 100
      : 0;
  const commissionAmount =
    formData.commissionType === 'percentage'
      ? (listingPrice * commissionInput) / 100
      : commissionInput;

  useEffect(() => {
    if (!editingProperty) {
      setFormData(initialFormData);
      setCoords(null);
      setNearbyPlaces([]);
      setStep(1);
      return;
    }
    const locationParts = splitLocation(editingProperty.location || '');
    setCoords(
      editingProperty.latitude !== undefined && editingProperty.longitude !== undefined
        ? { lat: editingProperty.latitude, lng: editingProperty.longitude }
        : null
    );
    setNearbyPlaces(editingProperty.nearbyPlaces || []);

    setFormData((prev) => ({
      ...prev,
      title: editingProperty.title || '',
      category: toFormCategory(editingProperty.category),
      listingType: editingProperty.status === 'rent' ? 'For Rent' : 'For Sale',
      price: editingProperty.price ? String(editingProperty.price) : '',
      pricePerSqft: editingProperty.pricePerSqft ? String(editingProperty.pricePerSqft) : '',
      location: editingProperty.location || '',
      streetAddress: locationParts.streetAddress,
      locality: editingProperty.locality || '',
      city: locationParts.city,
      pincode: locationParts.pincode,
      description: editingProperty.description || '',
      bedrooms: editingProperty.bedrooms ? String(editingProperty.bedrooms) : '',
      bathrooms: editingProperty.bathrooms ? String(editingProperty.bathrooms) : '',
      areaSqft: editingProperty.areaSqft ? String(editingProperty.areaSqft) : '',
      featured: Boolean(editingProperty.featured),
      verified: Boolean(editingProperty.verified),
      urgent: Boolean(editingProperty.urgent),
      isActive: editingProperty.isActive !== false,
      yearBuilt: editingProperty.yearBuilt ? String(editingProperty.yearBuilt) : '',
      totalFloors: editingProperty.floors ? String(editingProperty.floors) : '',
      images: editingProperty.images || [],
      amenities: editingProperty.amenities || [],
      videoUrl: editingProperty.videoUrl || '',
      status: editingProperty.status,
      commissionType: editingProperty.commissionType || 'percentage',
      commissionValue: editingProperty.commissionValue ? String(editingProperty.commissionValue) : '',
      contactNumber: editingProperty.agentPhone || '',
    }));
    setStep(2);
  }, [editingProperty]);

  // Reactive price <-> price-per-sqft sync for sell listings (Section 2).
  useEffect(() => {
    if (isRent) return;
    const area = Number(formData.areaSqft);
    if (!area) return;

    if (lastPricingEdit.current === 'pricePerSqft') {
      const ppsf = Number(formData.pricePerSqft);
      if (ppsf > 0) {
        const nextPrice = String(Math.round(ppsf * area));
        if (nextPrice !== formData.price) {
          setFormData((prev) => ({ ...prev, price: nextPrice }));
        }
      }
    } else {
      const price = Number(formData.price);
      if (price > 0) {
        const nextPpsf = String(Math.round((price / area) * 100) / 100);
        if (nextPpsf !== formData.pricePerSqft) {
          setFormData((prev) => ({ ...prev, pricePerSqft: nextPpsf }));
        }
      }
    }
  }, [formData.price, formData.pricePerSqft, formData.areaSqft, isRent]);

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

  // Every field is optional (FIX 2.2) — no per-step validation gating.
  const goNext = () => {
    setDirection(1);
    setStep((current) => Math.min(current + 1, 6));
  };
  const goBack = () => {
    setDirection(-1);
    setStep((current) => Math.max(current - 1, 1));
  };
  const goToStep = (target: number) => {
    setDirection(target >= step ? 1 : -1);
    setStep(target);
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
    maxFiles: 30,
    onDrop: async (files) => {
      const availableSlots = 30 - formData.images.length;
      const filesToUpload = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        toast.error('You can upload up to 30 images');
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

  // Property cards/dashboard/etc. all render images[0] as the thumbnail, so
  // "setting" a thumbnail just means moving that image to the front of the
  // array — nothing downstream needs to know a thumbnail was ever chosen.
  const setThumbnail = (index: number) => {
    if (index === 0) return;
    const images = [...formData.images];
    const [chosen] = images.splice(index, 1);
    images.unshift(chosen);
    setField('images', images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only the explicit "Publish/Update" button on the final step may submit.
    // This blocks an accidental publish from pressing Enter inside a field on an
    // earlier step (the browser auto-submits the form on Enter otherwise) and
    // from the Next→Publish button reconciliation on step 5.
    if (step !== 6) return;

    // Require the submit to originate from the actual Publish button, not a
    // stray form submission triggered while advancing to the final step.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter && submitter.type !== 'submit') return;

    // Mandatory fields — a listing can't be published without at least a title,
    // a description, and a price. Jump the user back to the step holding the
    // first missing field, flag it, and stop the publish.
    const requiredChecks = [
      { field: 'title', step: 2, ok: !!formData.title.trim(), message: 'Please enter a property title' },
      { field: 'streetAddress', step: 2, ok: !!formData.streetAddress.trim(), message: 'Please enter the property address' },
      { field: 'locality', step: 2, ok: !!formData.locality.trim(), message: 'Please select or enter the locality / area' },
      { field: 'description', step: 2, ok: !!formData.description.trim(), message: 'Please add a property description' },
      { field: 'price', step: 3, ok: Number(formData.price) > 0, message: 'Please enter a price' },
    ];
    const missing = requiredChecks.find((check) => !check.ok);
    if (missing) {
      setStep(missing.step);
      setError({ field: missing.field, message: missing.message });
      toast.error(missing.message);
      return;
    }

    // The available-from date is required only when the rental owner explicitly
    // chose "Select Date"; "Ready to Move" needs no date and clears it above.
    if (isRent && formData.possessionStatus === 'Select Date' && !formData.availableFrom) {
      toast.error('Please pick the available-from date, or set Possession Status to "Ready to Move".');
      return;
    }

    const fullLocation = [formData.streetAddress.trim(), 'Bangalore']
      .filter(Boolean)
      .join(', ');

    const hasCommission = commissionInput > 0;
    const commissionCalculated =
      formData.commissionType === 'percentage'
        ? Math.round(commissionAmount)
        : Math.round(commissionPercent * 100) / 100;

    const propertyData: Omit<Property, 'id' | 'createdAt'> = {
      title: formData.title.trim() || 'Untitled Property',
      price: Number(formData.price) || 0,
      location: fullLocation,
      locality: formData.locality.trim() || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
      nearbyPlaces: nearbyPlaces.length > 0 ? nearbyPlaces : undefined,
      description: formData.description.trim(),
      category: normalizeCategory(formData.category),
      status: isRent ? 'rent' : 'buy',
      bedrooms: parseCount(formData.bedrooms),
      bathrooms: parseCount(formData.bathrooms),
      areaSqft: Number(formData.areaSqft) || 0,
      images: formData.images,
      videos: formData.videoUrl ? [formData.videoUrl] : [],
      amenities: formData.amenities,
      featured: formData.featured,
      verified: formData.verified,
      urgent: formData.urgent,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : undefined,
      parking: formData.carParking && formData.carParking !== 'None' ? parseInt(formData.carParking, 10) || undefined : undefined,
      floors: formData.totalFloors ? parseInt(formData.totalFloors, 10) : undefined,
      furnished: formData.furnishingStatus === 'Fully Furnished',
      videoUrl: formData.videoUrl,
      isActive: formData.isActive,
      pricePerSqft: !isRent && Number(formData.pricePerSqft) > 0 ? Number(formData.pricePerSqft) : undefined,
      commissionType: hasCommission ? formData.commissionType : undefined,
      commissionValue: hasCommission ? commissionInput : undefined,
      commissionCalculated: hasCommission ? commissionCalculated : undefined,
      agentPhone: formData.contactNumber.trim() || undefined,
    };

    setLoading(true);
    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, propertyData);
        toast.success('Property updated successfully');
      } else {
        await createProperty(propertyData);
        toast.success('Property published successfully');
      }

      // Show the success overlay, then redirect to the listings after 3.2s
      // (spec #21) so the check-draw + progress bar can fully play.
      setShowSuccess(true);
      window.setTimeout(() => onNavigate('manage-properties'), 3200);
    } catch (submitError) {
      console.error('Failed to publish property:', submitError, { propertyData });
      toast.error(
        submitError instanceof Error
          ? `Failed to publish property: ${submitError.message}`
          : 'Failed to publish property. Please try again.'
      );
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
  }: {
    field: 'price' | 'maintenanceCharges' | 'securityDeposit' | 'bookingAmount';
    label: string;
    placeholder?: string;
  }) => (
    <div data-field={field}>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
        <input
          type="number"
          placeholder={placeholder}
          value={formData[field]}
          onChange={(e) => {
            if (field === 'price') lastPricingEdit.current = 'price';
            setField(field, e.target.value);
          }}
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
        <label key={option} className="flex min-h-[44px] items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={formData[field].includes(option)}
            onChange={() => toggleArrayValue(field, option)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="font-medium text-gray-800">{label}</span>
      </span>
      <span className="ml-6 block text-sm text-gray-500">{description}</span>
    </label>
  );

  // Step content transition (spec #15): blur + slide + scale centrepiece.
  // Collapses to a plain crossfade when the user prefers reduced motion.
  const reducedStep = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };
  const stepVariants = reduce ? reducedStep : stepVariantsBlur;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-5 font-['Playfair_Display'] text-2xl font-bold text-text-primary sm:mb-8 sm:text-3xl">
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      {/* Mobile step indicator (text) */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 sm:hidden">
        <span className="text-sm font-bold text-text-primary">Step {step} of 6</span>
        <span className="text-sm font-semibold text-primary">{stepTitles[step]}</span>
      </div>

      {/* Desktop step indicator (circles) */}
      <div className="mb-8 hidden gap-2 overflow-x-auto pb-1 sm:flex">
        {[1, 2, 3, 4, 5, 6].map((s) => {
          const completed = step > s;
          const current = step === s;
          return (
            <motion.button
              key={s}
              type="button"
              onClick={() => goToStep(s)}
              animate={!reduce && completed ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, duration: 0.3 }}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold transition-colors ${
                completed
                  ? 'bg-primary text-white'
                  : current
                  ? 'border-2 border-primary bg-white text-primary'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {completed ? <Check size={24} /> : s}
            </motion.button>
          );
        })}
      </div>

      {/* Step progress line fill (spec #16) */}
      <div className="mb-8 hidden h-1 w-full overflow-hidden rounded-full bg-gray-200 sm:block">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${((step - 1) / 5) * 100}%` }}
          transition={{ duration: 0.4, ease: EASE_ELEGANT }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {step === 1 && (
                <motion.div
                  className="space-y-4"
                  variants={reduce ? undefined : staggerContainer}
                  initial={reduce ? undefined : 'hidden'}
                  animate={reduce ? undefined : 'visible'}
                >
                  <motion.h2 variants={reduce ? undefined : fadeUpVariant} className="text-xl font-bold text-text-primary">List Type</motion.h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(['buy', 'rent'] as const).map((type) => (
                      <motion.button
                        key={type}
                        type="button"
                        variants={reduce ? undefined : fadeUpVariant}
                        onClick={() => {
                          setField('status', type);
                          setField('listingType', type === 'buy' ? 'For Sale' : 'For Rent');
                        }}
                        className={`rounded-xl border-2 p-6 text-left transition-all ${
                          formData.status === type
                            ? 'border-primary bg-primary-light shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary/50'
                        }`}
                      >
                        <div className="mb-2 text-lg font-bold capitalize text-text-primary">
                          {type === 'buy' ? 'List for Sale' : 'List for Rent'}
                        </div>
                        <p className="text-sm text-gray-600">
                          {type === 'buy' ? 'Sell your property to buyers' : 'Rent your property to tenants'}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-text-primary">Basic Info</h2>
                  <div data-field="title">
                    <FloatingInput label="Property Title" value={formData.title} onChange={(v) => setField('title', v)} />
                    <ErrorText field="title" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div data-field="category">
                      <label className={labelClass}>Property Type</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setField('category', e.target.value)}
                        className={selectFieldClass('category')}
                      >
                        {propertyTypeOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div data-field="listingType">
                      <label className={labelClass}>Listing Type</label>
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
                    </div>
                  </div>
                  <div data-field="streetAddress">
                    <label className={labelClass}>Street Address / Locality</label>
                    <GooglePlacesAutocomplete
                      value={formData.streetAddress}
                      onChange={(v) => setField('streetAddress', v)}
                      invalid={error?.field === 'streetAddress'}
                      onPlaceSelect={(place) => {
                        setField('streetAddress', place.address);
                        setField('locality', place.locality);
                        setCoords({ lat: place.lat, lng: place.lng });
                        // A new address invalidates any places scanned around the old one.
                        setNearbyPlaces([]);
                      }}
                    />
                    <ErrorText field="streetAddress" />
                    <p className="mt-1 text-sm text-gray-500">Start typing a building name or area — we'll auto-detect the locality.</p>
                  </div>
                  <div data-field="locality">
                    <label className={labelClass}>Locality / Area</label>
                    <LocationAutocomplete
                      value={formData.locality}
                      onChange={(v) => setField('locality', v)}
                      onSelect={(v) => setField('locality', v)}
                      locations={ADMIN_LOCALITY_OPTIONS}
                      placeholder="e.g. Whitefield, Marathahalli..."
                      inputClassName={`w-full rounded-xl border bg-white pl-11 pr-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm ${
                        error?.field === 'locality' ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    <ErrorText field="locality" />
                    <p className="mt-1 text-sm text-gray-500">
                      Auto-filled from the address above — correct it if Google's detected area is wrong or too specific.
                    </p>
                    <NearbyPlacesScanner
                      lat={coords?.lat ?? null}
                      lng={coords?.lng ?? null}
                      address={formData.streetAddress || formData.location}
                      selected={nearbyPlaces}
                      onChange={setNearbyPlaces}
                      onCoordsResolved={(lat, lng) => setCoords({ lat, lng })}
                    />
                  </div>
                  <div data-field="description">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Description</label>
                      <span className="text-sm text-gray-500">{formData.description.length} / 500</span>
                    </div>
                    <textarea
                      placeholder="Describe the property in detail - layout, ventilation, surroundings, nearby landmarks"
                      maxLength={500}
                      value={formData.description}
                      onChange={(e) => setField('description', e.target.value)}
                      className={`${fieldClass('description')} h-28`}
                    />
                    <p className="mt-1 text-sm text-gray-500">Tip: mention nearby metro, schools, hospitals, or malls to attract more leads</p>
                  </div>
                  <div data-field="contactNumber">
                    <label className={labelClass}>Agent Mobile Number (optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9845418570 — leave blank to use the default number"
                      value={formData.contactNumber}
                      onChange={(e) => setField('contactNumber', e.target.value)}
                      className={plainControlClass}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      WhatsApp chats and calls for this property go to this number. Leave blank to use the default company number.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Property Age</label>
                    <select value={formData.propertyAge} onChange={(e) => setField('propertyAge', e.target.value)} className={plainControlClass}>
                      <option value="">Select Property Age</option>
                      {propertyAgeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-text-primary">Pricing</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderCurrencyInput({
                      field: 'price',
                      label: priceLabel,
                      placeholder: isRent ? 'Monthly rent amount' : 'Total sale price',
                    })}
                    {/* Price per sqft — sell listings only (Section 2) */}
                    {!isRent && (
                      <div data-field="pricePerSqft">
                        <label className={labelClass}>Price per sqft</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            placeholder="Auto-calculates from price & area"
                            value={formData.pricePerSqft}
                            onChange={(e) => {
                              lastPricingEdit.current = 'pricePerSqft';
                              setField('pricePerSqft', e.target.value);
                            }}
                            className={`${inputClass} border-gray-200 pl-12`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Syncs with Sale Price ÷ Total Area (Step 4).</p>
                      </div>
                    )}
                    {/* Sell listings collect a booking/token amount; rent collects a deposit. */}
                    {!isRent &&
                      renderCurrencyInput({
                        field: 'bookingAmount',
                        label: 'Booking Amount',
                        placeholder: 'Token amount to confirm booking',
                      })}
                    {isRent &&
                      renderCurrencyInput({
                        field: 'securityDeposit',
                        label: 'Security Deposit',
                        placeholder: 'Refundable deposit amount',
                      })}
                    {renderCurrencyInput({ field: 'maintenanceCharges', label: 'Maintenance Charges', placeholder: 'Monthly amount' })}
                    <div>
                      <label className={labelClass}>Price Negotiable?</label>
                      <select value={formData.priceNegotiable} onChange={(e) => setField('priceNegotiable', e.target.value)} className={plainControlClass}>
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
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-text-primary">Property Details</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div data-field="bedrooms">
                      <label className={labelClass}>Bedrooms</label>
                      <select value={formData.bedrooms} onChange={(e) => setField('bedrooms', e.target.value)} className={selectFieldClass('bedrooms')}>
                        <option value="">Select</option>
                        {bedroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div data-field="bathrooms">
                      <label className={labelClass}>Bathrooms</label>
                      <select value={formData.bathrooms} onChange={(e) => setField('bathrooms', e.target.value)} className={selectFieldClass('bathrooms')}>
                        <option value="">Select</option>
                        {bathroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Balconies</label>
                      <select value={formData.balconies} onChange={(e) => setField('balconies', e.target.value)} className={plainControlClass}>
                        <option value="">Select</option>
                        {balconyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div data-field="areaSqft">
                      <label className={labelClass}>Total Area (sqft)</label>
                      <input type="number" placeholder="0" value={formData.areaSqft} onChange={(e) => setField('areaSqft', e.target.value)} className={fieldClass('areaSqft')} />
                    </div>
                    <div>
                      <label className={labelClass}>Carpet Area (sqft)</label>
                      <input type="number" placeholder="0" value={formData.carpetArea} onChange={(e) => setField('carpetArea', e.target.value)} className={plainControlClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Built-up Area (sqft)</label>
                      <input type="number" placeholder="0" value={formData.builtUpArea} onChange={(e) => setField('builtUpArea', e.target.value)} className={plainControlClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Year Built</label>
                      <input type="number" placeholder="e.g. 2018" value={formData.yearBuilt} onChange={(e) => setField('yearBuilt', e.target.value)} className={plainControlClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Total Floors in Building</label>
                      <input type="number" placeholder="e.g. 12" value={formData.totalFloors} onChange={(e) => setField('totalFloors', e.target.value)} className={plainControlClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Property on Floor No.</label>
                      <input type="number" placeholder="e.g. 7" value={formData.floorNumber} onChange={(e) => setField('floorNumber', e.target.value)} className={plainControlClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Facing Direction</label>
                      <select value={formData.facingDirection} onChange={(e) => setField('facingDirection', e.target.value)} className={plainControlClass}>
                        <option value="">Select</option>
                        {facingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Car Parking</label>
                      <select value={formData.carParking} onChange={(e) => setField('carParking', e.target.value)} className={plainControlClass}>
                        <option value="">Select</option>
                        {carParkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Furnishing Status</label>
                      <select value={formData.furnishingStatus} onChange={(e) => setField('furnishingStatus', e.target.value)} className={plainControlClass}>
                        <option value="">Select</option>
                        {furnishingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Possession Status</label>
                      <select
                        value={formData.possessionStatus}
                        onChange={(e) => {
                          const value = e.target.value;
                          setField('possessionStatus', value);
                          // "Ready to Move" (or a reset) means no date is needed —
                          // drop any previously picked date so it isn't submitted.
                          if (value !== 'Select Date') setField('availableFrom', '');
                        }}
                        className={plainControlClass}
                      >
                        <option value="">Select</option>
                        {possessionOptionsForType.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      {showRentDatePicker && (
                        <input
                          type="date"
                          value={formData.availableFrom}
                          onChange={(e) => setField('availableFrom', e.target.value)}
                          className={`${plainControlClass} mt-2`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {!isRent && (
                      <div>
                        <label className={labelClass}>Available From</label>
                        <input type="date" value={formData.availableFrom} onChange={(e) => setField('availableFrom', e.target.value)} className={plainControlClass} />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Ownership Type</label>
                      <select value={formData.ownershipType} onChange={(e) => setField('ownershipType', e.target.value)} className={plainControlClass}>
                        <option value="">Select</option>
                        {ownershipOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Additional Rooms</label>
                    <CheckboxGroup options={additionalRoomOptions} field="additionalRooms" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-text-primary">Amenities, Media & Commission</h2>

                  {/* ---- Commission module (Section 1) ---- */}
                  <section className="rounded-2xl border border-border bg-primary-light/40 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-text-primary">Agent Commission</h3>
                    <p className="mb-4 text-sm text-text-muted">Optional — record the brokerage for this listing.</p>

                    <div className="mb-4 inline-flex rounded-xl bg-white p-1 shadow-sm">
                      {(['percentage', 'fixed'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setField('commissionType', type)}
                          className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                            formData.commissionType === type ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                        </button>
                      ))}
                    </div>

                    {formData.commissionType === 'percentage' && listingPrice <= 0 && (
                      <p className="mb-3 rounded-lg bg-accent-light px-4 py-2 text-xs font-medium text-[#92400E]">
                        Enter the price in Step 3 to auto-calculate the ₹ amount — you can still record the % here.
                      </p>
                    )}
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {formData.commissionType === 'percentage' ? (
                            <>
                              <div>
                                <label className={labelClass}>Commission %</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={formData.commissionValue}
                                    onChange={(e) => setField('commissionValue', e.target.value)}
                                    className={`${inputClass} border-gray-200 pr-9`}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Commission Amount</label>
                                <motion.div
                                  key={Math.round(commissionAmount)}
                                  initial={reduce ? false : { backgroundColor: '#F0E2C0' }}
                                  animate={{ backgroundColor: '#FFFFFF' }}
                                  transition={{ duration: 0.6 }}
                                  className="flex h-[50px] items-center rounded-xl border border-border px-4 text-base font-bold text-primary md:h-[46px]"
                                >
                                  <CountUp value={commissionAmount} format={formatINR} />
                                </motion.div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className={labelClass}>Commission Amount (₹)</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={formData.commissionValue}
                                    onChange={(e) => setField('commissionValue', e.target.value)}
                                    className={`${inputClass} border-gray-200 pl-12`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Commission %</label>
                                <motion.div
                                  key={commissionPercent.toFixed(2)}
                                  initial={reduce ? false : { backgroundColor: '#F0E2C0' }}
                                  animate={{ backgroundColor: '#FFFFFF' }}
                                  transition={{ duration: 0.6 }}
                                  className="flex h-[50px] items-center rounded-xl border border-border px-4 text-base font-bold text-primary md:h-[46px]"
                                >
                                  <CountUp value={commissionPercent} format={(n) => `${n.toFixed(2)}%`} />
                                </motion.div>
                              </div>
                            </>
                          )}
                        </div>

                        {commissionInput > 0 && listingPrice > 0 && (
                          <div className="mt-4 rounded-xl border border-primary/20 bg-white p-4 text-sm text-text-primary">
                            On a <span className="font-bold">{formatINR(listingPrice)}</span>{' '}
                            {isRent ? 'rental' : 'property'}, agent earns{' '}
                            <span className="font-bold text-primary">{formatINR(commissionAmount)}</span>{' '}
                            ({commissionPercent.toFixed(2)}%)
                          </div>
                        )}
                      </>
                  </section>

                  {/* ---- Amenities ---- */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Amenities</label>
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            'amenities',
                            formData.amenities.length === amenityOptions.length ? [] : [...amenityOptions]
                          )
                        }
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {formData.amenities.length === amenityOptions.length ? 'Clear All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {amenityOptions.map((amenity) => {
                        const Icon = getAmenityIcon(amenity);
                        const selected = formData.amenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleArrayValue('amenities', amenity)}
                            className={`flex min-h-[44px] items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all ${
                              selected
                                ? 'border-primary bg-primary-light text-primary'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50'
                            }`}
                          >
                            <Icon size={18} />
                            <span>{amenity}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Upload Images</label>
                    <div
                      {...getRootProps()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-primary"
                    >
                      <input {...getInputProps()} />
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">{uploadingImages ? 'Uploading images...' : 'Drag images here or click to select'}</p>
                      <p className="mt-2 text-sm text-gray-500">Supported formats: JPG, PNG, WEBP - Max size: 10MB per image - Up to 30 images</p>
                    </div>

                    {formData.images.length > 0 && (
                      <>
                        <p className="mt-4 text-sm text-gray-500">
                          Click the star to set an image as the thumbnail shown on property cards. Leave unset and the first image is used automatically.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {formData.images.map((img, i) => {
                            const isThumbnail = i === 0;
                            return (
                              <div key={`${img}-${i}`} className="relative">
                                <img
                                  src={img}
                                  alt={`Preview ${i + 1}`}
                                  className={`h-24 w-full rounded-lg object-cover ${isThumbnail ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                />
                                {isThumbnail && (
                                  <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                                    <Star size={11} fill="currentColor" />
                                    Thumbnail
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setThumbnail(i)}
                                  disabled={isThumbnail}
                                  className={`absolute right-1 top-1 rounded-full p-1 transition-colors ${
                                    isThumbnail
                                      ? 'cursor-default bg-primary text-white'
                                      : 'bg-white/90 text-gray-500 hover:bg-primary hover:text-white'
                                  }`}
                                  aria-label={isThumbnail ? 'Current thumbnail' : 'Set as thumbnail'}
                                  title={isThumbnail ? 'Current thumbnail' : 'Set as thumbnail'}
                                >
                                  <Star size={14} fill={isThumbnail ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setField('images', formData.images.filter((_, idx) => idx !== i))}
                                  className="absolute right-1 top-9 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                  aria-label="Remove image"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>YouTube / Video Tour URL (optional)</label>
                    <input type="url" value={formData.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} className={plainControlClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Google Maps Location Link (optional)</label>
                    <input
                      type="url"
                      placeholder="Paste Google Maps share link here"
                      value={formData.googleMapsLink}
                      onChange={(e) => setField('googleMapsLink', e.target.value)}
                      className={plainControlClass}
                    />
                    <p className="mt-1 text-sm text-gray-500">Go to Google Maps - search your property - click Share - Copy link</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-text-primary">Flags & Publish</h2>
                  <FlagCheckbox field="isActive" label="Active Listing" description="Show this property on the public home and properties pages" />
                  <FlagCheckbox field="featured" label="Featured" description="Highlighted at the top of search results and homepage" />
                  <FlagCheckbox field="verified" label="Verified" description="Displays a verified badge - only check if you have physically verified this property" />
                  <FlagCheckbox field="urgent" label={isRent ? 'Urgent Rent' : 'Urgent Sale'} description="Displays an urgent tag on the listing card to attract faster inquiries" />
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
                        className={plainControlClass}
                      />
                    </div>
                  )}
                  <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
                    <h3 className="mb-2 font-semibold text-text-primary">Review before publishing</h3>
                    <p>Title: {formData.title || '-'}</p>
                    <p>Type: {formData.category || '-'}</p>
                    <p>Listing: {isRent ? 'For Rent' : 'For Sale'}</p>
                    <p>Location: {[formData.streetAddress, 'Bangalore'].filter(Boolean).join(', ')}</p>
                    <p>{priceLabel}: {formData.price ? `${formatINR(listingPrice)}${isRent ? '/mo' : ''}` : '-'}</p>
                    {!isRent && Number(formData.pricePerSqft) > 0 && (
                      <p>Price per sqft: {formatINR(Number(formData.pricePerSqft))}</p>
                    )}
                    <p>Bedrooms: {formData.bedrooms || '-'}</p>
                    <p>Bathrooms: {formData.bathrooms || '-'}</p>
                    <p>Area: {formData.areaSqft ? `${formData.areaSqft} sqft` : '-'}</p>
                    {commissionInput > 0 && (
                      <p>Commission: {formatINR(commissionAmount)} ({commissionPercent.toFixed(2)}%)</p>
                    )}
                    <p>Visibility: {formData.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Shared navigation — sticky bottom bar on mobile (Section 3B) */}
        <div className="sticky bottom-0 z-20 -mx-3 flex gap-3 border-t border-border bg-surface/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="min-h-[44px] flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-text-primary transition-colors hover:bg-gray-50 md:flex-none md:px-8"
            >
              Back
            </button>
          )}
          {step < 6 ? (
            <button
              key="wizard-next"
              type="button"
              onClick={goNext}
              className="min-h-[44px] flex-1 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {step === 1 ? 'Continue' : 'Next'}
            </button>
          ) : (
            <button
              key="wizard-publish"
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-400"
            >
              <CheckCircle size={18} />
              {loading ? 'Publishing...' : editingProperty ? 'Update Property' : 'Publish Property'}
            </button>
          )}
        </div>
      </form>

      {/* Publish success overlay (Section 3C) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#15211A]/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex w-[320px] max-w-full flex-col items-center gap-4 overflow-hidden rounded-2xl bg-white px-10 py-10 text-center shadow-2xl"
            >
              <svg width="72" height="72" viewBox="0 0 52 52" aria-hidden="true">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M15 27 L23 35 L38 18"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
                />
              </svg>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.9, ease: EASE_ELEGANT }}
                className="text-xl font-bold text-text-primary"
              >
                {editingProperty ? 'Property Updated' : 'Property Published'}
              </motion.div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : 1.1, ease: EASE_ELEGANT }}
                className="text-sm text-text-muted"
              >
                Redirecting to your listings…
              </motion.div>
              {!reduce && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 2, delay: 1.2, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
