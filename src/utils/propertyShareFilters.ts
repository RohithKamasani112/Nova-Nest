import { Property, PropertyFilters } from '../types';

// "Available" has no dedicated field on Property — `isActive` (already used
// by ManagePropertiesPage's own active/inactive filter) is the existing
// signal admins already use to take a listing down once it's rented/sold,
// so it doubles as "available" here rather than inventing a new field.
export function matchesShareFilters(p: Property, f: PropertyFilters): boolean {
  if (f.status && p.status !== f.status) return false;
  if (f.bedrooms?.length && !f.bedrooms.includes(p.bedrooms)) return false;
  if (f.bathrooms?.length && !f.bathrooms.includes(p.bathrooms)) return false;
  if (f.priceMin !== undefined && p.price < f.priceMin) return false;
  if (f.priceMax !== undefined && p.price > f.priceMax) return false;
  if (f.areaMin !== undefined && p.areaSqft < f.areaMin) return false;
  if (f.areaMax !== undefined && p.areaSqft > f.areaMax) return false;

  if (f.furnishingStatus?.length) {
    const fs = p.furnishingStatus ?? (p.furnished ? 'Fully Furnished' : undefined);
    if (!fs || !f.furnishingStatus.includes(fs)) return false;
  }
  if (f.facingDirection?.length) {
    if (!p.facingDirection || !f.facingDirection.includes(p.facingDirection)) return false;
  }
  if (f.tenantPreference?.length) {
    if (!p.tenantPreference || !f.tenantPreference.includes(p.tenantPreference)) return false;
  }
  if (f.gated !== undefined) {
    const isGated = p.amenities.includes('Gated Community');
    if (isGated !== f.gated) return false;
  }
  if (f.availableOnly && p.isActive === false) return false;

  if (f.location) {
    const q = f.location.toLowerCase();
    const haystack = `${p.locality ?? ''} ${p.location}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!p.title.toLowerCase().includes(q)) return false;
  }
  return true;
}

export function filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
  return properties.filter((p) => matchesShareFilters(p, filters));
}
