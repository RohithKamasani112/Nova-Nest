import { Property } from '../types';

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
    const name = property.locality?.trim();
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
