import { TokenReceiptDraft } from '../utils/tokenReceiptTypes';

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

export type BillingDocType = 'sale_booking' | 'commission' | 'service' | 'token_receipt';

interface BillingDocBase {
  id: string; // same value as docNumber, used as the S3 filename too
  docNumber: string; // e.g. "NN-SALE-2026-014"
  docType: BillingDocType;
  pdfUrl: string;
  createdAt: string;
}

// Rule 46 (CGST Rules) fields, shared by every billing document type. Only
// rendered when gstApplicable is true, but always persisted as part of the
// document snapshot so a reprint later renders identically regardless of
// what today's defaults are. recipientGstin is optional — when blank, the
// template falls back to rendering recipientStateName/Code instead, which
// is mandatory on a B2C document above ₹50,000.
export interface GstFields {
  gstApplicable: boolean;
  sacCode: string;
  placeOfSupplyState: string;
  placeOfSupplyCode: string;
  reverseCharge: boolean;
  recipientGstin: string;
  recipientStateName: string;
  recipientStateCode: string;
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

export interface SaleBookingDoc extends BillingDocBase, GstFields {
  docType: 'sale_booking';
  purchaserName: string;
  purchaserAddress: string;
  purchaserEmail: string;
  purchaserMobile: string;
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

export interface CommissionDoc extends BillingDocBase, GstFields {
  docType: 'commission';
  transactionType: 'sale' | 'rental';
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientMobile: string;
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

export interface ServiceDoc extends BillingDocBase, GstFields {
  docType: 'service';
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  customerMobile: string;
  lineItems: ServiceLineItem[];
  cgstPct: number;
  sgstPct: number;
  docDate: string;
  computed: ServiceComputed;
}

// Token Receipt's own draft shape (src/utils/tokenReceiptTypes.ts) already
// covers every field — `receiptCode` is the one renamed to `docNumber` here,
// matching every other BillingDoc's shared identity field. No GstFields:
// Token Receipt has no GST concept at all.
export interface TokenReceiptDoc extends BillingDocBase, Omit<TokenReceiptDraft, 'receiptCode'> {
  docType: 'token_receipt';
}

export type BillingDoc = SaleBookingDoc | CommissionDoc | ServiceDoc | TokenReceiptDoc;

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
  maintenanceCharges?: number; // Monthly maintenance/HOA amount
  securityDeposit?: number; // Rent listings: refundable deposit amount
  facingDirection?: 'East' | 'West' | 'North' | 'South' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
  floorNumber?: number; // The unit's own floor, distinct from `floors` (total floors in the building)
  availableFrom?: string; // ISO date; unset/blank means "Ready to Move"
  possessionStatus?: 'Ready to Move' | 'Under Construction' | 'Select Date';
  tenantPreference?: 'family' | 'bachelors' | 'family_bachelors' | 'any'; // Rent listings only
  furnishingStatus?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'; // Granular; `furnished` boolean above only distinguishes Fully Furnished vs. not
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
  furnishingStatus?: Property['furnishingStatus'][];
  facingDirection?: Property['facingDirection'][];
  tenantPreference?: Property['tenantPreference'][];
  gated?: boolean;
  availableOnly?: boolean; // Share Properties: hide occupied/inactive listings by default
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
