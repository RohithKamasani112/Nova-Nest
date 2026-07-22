// A single admin-selected point of interest near a property, surfaced
// publicly on the listing as a "What's Nearby" section.
export interface NearbyPlace {
  name: string;
  category: string; // NearbyPlaceCategory['key'] from src/data/nearbyPlaceCategories.ts, e.g. "school"
  distance: string; // human-readable, e.g. "1.2 km away"
  lat: number;
  lng: number;
  rating?: number;
}

// LEGACY — superseded by BillingDoc below. Kept only so already-generated
// receipts (stored in S3's invoices/bills.json) still list in the admin's
// "Past Documents" history and their PDFs stay downloadable. No new Bill
// records are created by the app anymore.
export interface Bill {
  id: string; // same value as receiptNo, used as the S3 filename too
  receiptNo: string; // e.g. "NN-2026-0001"
  clientName: string;
  clientContact: string;
  propertyTitle: string;
  propertyLocation: string;
  transactionType: 'sale' | 'rent';
  totalAmount: number;
  amountPaid: number;
  paymentMode: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  paymentDate: string;
  moveInDate?: string;
  finalPaymentDueDate?: string;
  pdfUrl: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Billing Generator — 3 document types, matching the reference PDFs in
// Billing_inspiration/. All numeric fields are user-editable case-by-case
// (never locked constants); `computed` is a frozen snapshot of the calculated
// totals at generation time, taken from src/utils/billingCalculations.ts, so a
// historical document never silently changes if a default rate changes later.
// ---------------------------------------------------------------------------

export type BillingDocType = 'sale_booking' | 'commission' | 'service';

interface BillingDocBase {
  id: string; // same value as docNumber, used as the S3 filename too
  docNumber: string; // e.g. "NN-SALE-2026-014"
  docType: BillingDocType;
  pdfUrl: string;
  createdAt: string;
}

export interface SaleBookingComputed {
  balanceAfterToken: number;
  milestoneAmount: number;
  balanceAfterMilestone: number;
  tdsAmount: number;
  commissionAmount: number;
  commissionGstAmount: number;
  totalCommissionPayable: number;
  stampDutyAmount: number;
  saleAgreementChargesAmount: number;
  registrationChargesAmount: number;
  totalGovtCharges: number;
}

export interface SaleBookingDoc extends BillingDocBase {
  docType: 'sale_booking';
  purchaserName: string;
  purchaserAddress: string;
  projectName: string;
  unitNo: string;
  totalSalePrice: number;
  tokenAmount: number;
  saleAgreementAmount: number;
  milestonePct: number;
  tdsEnabled: boolean;
  tdsPct: number;
  commissionPct: number;
  commissionGstPct: number;
  stampDutyPct: number;
  saleAgreementChargesPct: number;
  additionalFee: number;
  registrationChargesPct: number;
  registrationIncidentCharges: number;
  termsAndConditions: string[];
  docDate: string;
  place: string;
  computed: SaleBookingComputed;
}

export interface CommissionComputed {
  cgstAmount: number;
  sgstAmount: number;
  totalPayable: number;
  amountInWords: string;
}

export interface CommissionDoc extends BillingDocBase {
  docType: 'commission';
  transactionType: 'sale' | 'rental';
  clientName: string;
  clientAddress: string;
  propertyAddress: string;
  taxableAmount: number;
  cgstPct: number;
  sgstPct: number;
  paymentTerms: string;
  docDate: string;
  computed: CommissionComputed;
}

export interface ServiceLineItem {
  description: string;
  amount: number;
}

export interface ServiceComputed {
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  total: number;
  amountInWords: string;
}

export interface ServiceDoc extends BillingDocBase {
  docType: 'service';
  customerName: string;
  customerAddress: string;
  lineItems: ServiceLineItem[];
  gstEnabled: boolean;
  cgstPct: number;
  sgstPct: number;
  docDate: string;
  computed: ServiceComputed;
}

export type BillingDoc = SaleBookingDoc | CommissionDoc | ServiceDoc;

// Property Types
export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  locality?: string; // Structured area/neighborhood name (e.g. "Whitefield"), separate from the free-text address
  description: string;
  images: string[];
  videos: string[];
  brochure?: string;
  category: 'apartment' | 'house' | 'villa' | 'condo' | 'townhouse' | 'land';
  status: 'buy' | 'rent';
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  amenities: string[];
  featured: boolean;
  verified: boolean;
  urgent?: boolean; // Admin-flagged "urgent sale/rent" — pins to the top of default listings and shows a pulsing badge
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  yearBuilt?: number;
  parking?: number;
  floors?: number;
  furnished?: boolean;
  latitude?: number;
  longitude?: number;
  videoUrl?: string; // YouTube URL
  isDummy?: boolean; // Flag for dummy data visibility control
  isActive?: boolean; // Admin visibility control for public pages
  pricePerSqft?: number; // Sell listings: price per square foot
  commissionType?: 'percentage' | 'fixed'; // Agent commission model
  commissionValue?: number; // Raw entered value (% or ₹ depending on type)
  commissionCalculated?: number; // Auto-calculated counterpart (₹ amount or %)
  agentPhone?: string; // Per-property agent mobile for WhatsApp/calls; falls back to env default
  nearbyPlaces?: NearbyPlace[]; // Admin-curated points of interest, shown as "What's Nearby" on the listing
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  favorites: string[]; // Property IDs
  createdAt: string;
  verified: boolean;
}

// Filter Types
export interface PropertyFilters {
  status?: 'buy' | 'rent';
  category?: Property['category'][];
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  areaMin?: number;
  areaMax?: number;
  amenities?: string[];
  location?: string;
  locality?: string[]; // exact-match multi-select, distinct from the free-text `location` substring search
  featured?: boolean;
  verified?: boolean;
  search?: string;
  // One-shot UI hint consumed on mount by PropertiesPage to auto-trigger the
  // "Properties Near Me" geolocation flow — not a literal filter predicate.
  nearMe?: boolean;
}

// Sort Options
export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'oldest'
  | 'area-asc'
  | 'area-desc';

// Inquiry Types
export interface Inquiry {
  id: string;
  propertyId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  type: 'schedule-visit' | 'contact-owner' | 'request-info';
  createdAt: string;
  status: 'pending' | 'contacted' | 'closed';
}

// Storage Types
export interface StorageConfig {
  isProduction: boolean;
  s3Config?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
    folderName: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
