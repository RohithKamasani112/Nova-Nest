import { Hospital, School, ShoppingBag, type LucideIcon } from 'lucide-react';

// Drives both the "Scan Property" nearby-places search (admin form) and the
// public "What's Nearby" display — one Nearby Search (New) call is made per
// category below, using `includedTypes` from Google's place-type table:
// https://developers.google.com/maps/documentation/places/web-service/place-types
//
// Deliberately kept to the 3 categories that actually move a buyer/renter's
// decision (schools, hospitals, malls) rather than every possible POI type —
// each is filtered down to well-known, high-footfall places (see
// src/utils/nearbyPlaces.ts's fame ranking), not every small shop in range.
export interface NearbyPlaceCategory {
  key: string;
  label: string;
  includedTypes: string[];
  icon: LucideIcon;
}

export const NEARBY_PLACE_CATEGORIES: NearbyPlaceCategory[] = [
  { key: 'hospital', label: 'Hospitals', includedTypes: ['hospital'], icon: Hospital },
  { key: 'school', label: 'Schools & Colleges', includedTypes: ['school'], icon: School },
  { key: 'shopping_mall', label: 'Malls & Shops', includedTypes: ['shopping_mall'], icon: ShoppingBag },
];

export const getNearbyPlaceCategory = (key: string): NearbyPlaceCategory | undefined =>
  NEARBY_PLACE_CATEGORIES.find((category) => category.key === key);
