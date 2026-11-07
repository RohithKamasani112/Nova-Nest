import { ADMIN_LOCALITY_OPTIONS } from '../data/localities';
import type { Property } from '../types';

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
  coverImages: string[];
}

// One source for locality cards and area filters: only currently active listings.
// Placeholder thumbnails do not prevent a later listing from supplying the cover.
export function isLocalityPhoto(value: string): boolean {
  return Boolean(value?.trim()) && !/(?:no[-_]?image|placeholder)(?:[.-]|\b)/i.test(value);
}
export const getDistinctLocalities = (properties: Property[]): LocalityGroup[] => {
  const groups = new Map<string, LocalityGroup>();
  for (const property of properties) {
    if (property.archivedAt || property.isActive === false) continue;
    const name = resolveLocality(property);
    if (!name) continue;
    const group = groups.get(name) || { name, count: 0, coverImage: '', coverImages: [] };
    group.count += 1;
    for (const image of property.images || []) {
      if (isLocalityPhoto(image) && !group.coverImages.includes(image) && group.coverImages.length < 6) group.coverImages.push(image);
    }
    group.coverImage = group.coverImages[0] || '';
    groups.set(name, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
