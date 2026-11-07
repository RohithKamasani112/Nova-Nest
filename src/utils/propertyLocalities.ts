import { ADMIN_LOCALITY_OPTIONS } from '../data/localities';
import { Property } from '../types';

export const localityKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
export function canonicalLocality(value?: string) {
  if (!value?.trim()) return '';
  const key = localityKey(value);
  return ADMIN_LOCALITY_OPTIONS.find(name => localityKey(name) === key) || value.trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
export function resolveLocality(property: Pick<Property, 'locality' | 'location'>) {
  if (property.locality?.trim()) return canonicalLocality(property.locality);
  const address = localityKey(property.location || '');
  // Only infer a known neighborhood actually present in the address.
  return ADMIN_LOCALITY_OPTIONS.find(name => address.includes(localityKey(name))) || '';
}

export interface LocalityGroup {
  name: string;
  count: number;
  coverImage: string;
}

// Distinct locality list derived from whatever admins have actually saved on
// properties (the "Mapped Locality" field set via the admin form's Google
// Places integration) — deliberately not a hardcoded list, so it reflects
// real data as it grows. Powers both the homepage's Top Localities carousel
// and the listings page's Locality/Area filter.
export const getDistinctLocalities = (properties: Property[]): LocalityGroup[] => {
  const groups = new Map<string, { count: number; coverImage: string }>();

  for (const property of properties) {
    if (property.archivedAt || property.isActive === false) continue;
    const name = resolveLocality(property);
    if (!name) continue;

    const existing = groups.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(name, { count: 1, coverImage: property.images?.[0] || '' });
    }
  }

  return Array.from(groups.entries())
    .map(([name, { count, coverImage }]) => ({ name, count, coverImage }))
    .sort((a, b) => b.count - a.count);
};
