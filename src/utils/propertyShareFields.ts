import { Property } from '../types';

// The Share Properties PDF (Generate Bill-adjacent admin feature — see
// SharePropertiesPage.tsx) sends a client a compact table of listings. Our
// internal Property record also carries fields that must NEVER reach a
// client: agent name (we only ever have a phone number on Property, never a
// name, so that risk doesn't exist structurally), owner contact, brokerage
// figures, cost price, internal IDs, portal status flags.
//
// This file is the single choke point: `toClientFacingRow` is the only
// function anywhere in the property-share feature allowed to read a raw
// `Property`. Every other module in src/app/components/propertyShare and
// src/pages/SharePropertiesPage.tsx consumes `ClientFacingPropertyRow`
// exclusively. A field added to `Property` later is excluded by default —
// it has to be deliberately added to this interface and this function to
// ever appear in a client PDF.
export interface ClientFacingPropertyRow {
  id: string; // React key only — never rendered
  title: string;
  bedrooms: number; // 0 = Studio
  bathrooms: number;
  listingType: 'rent' | 'sale';
  price: number;
  maintenanceCharges: number | null;
  securityDeposit: number | null;
  areaSqft: number;
  furnishingStatus: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | null;
  location: string;
  floorNumber: number | null;
  totalFloors: number | null;
  facingDirection: string | null;
  gated: boolean;
  tenantPreference: 'family' | 'bachelors' | 'family_bachelors' | 'any' | null;
  availableFrom: string | null; // ISO date
  possessionStatus: 'Ready to Move' | 'Under Construction' | 'Select Date' | null;
  contactNumber: string; // already resolved — see resolveContactNumber below
}

// Fallback order (spec): property's assigned agent has a valid 10-digit
// number -> use it. Anything wrong with it (missing, malformed, wrong
// length) -> silently fall back to the office default. Never print a
// partial/invalid number.
export function resolveContactNumber(agentPhone: string | undefined | null, officeDefault: string): string {
  const digits = (agentPhone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  return officeDefault.replace(/\D/g, '');
}

export function toClientFacingRow(property: Property, contactNumber: string): ClientFacingPropertyRow {
  return {
    id: property.id,
    title: property.title,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    listingType: property.status === 'rent' ? 'rent' : 'sale',
    price: property.price,
    maintenanceCharges: property.maintenanceCharges ?? null,
    securityDeposit: property.status === 'rent' ? property.securityDeposit ?? null : null,
    areaSqft: property.areaSqft,
    furnishingStatus: property.furnishingStatus ?? (property.furnished ? 'Fully Furnished' : null),
    location: property.locality || property.location,
    floorNumber: property.floorNumber ?? null,
    totalFloors: property.floors ?? null,
    facingDirection: property.facingDirection ?? null,
    gated: property.amenities.includes('Gated Community'),
    tenantPreference: property.status === 'rent' ? property.tenantPreference ?? null : null,
    availableFrom: property.availableFrom ?? null,
    possessionStatus: property.possessionStatus ?? null,
    contactNumber,
  };
}
