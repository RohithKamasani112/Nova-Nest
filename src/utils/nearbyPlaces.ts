// Scans the area around a property's lat/lng for notable nearby places
// (schools, hospitals, malls) using Nearby Search (New) —
// google.maps.places.Place.searchNearby(). One request per category, run in
// parallel, so a failure in one category (e.g. a place-type quota issue)
// doesn't take down the rest.
//
// Each category over-fetches a candidate pool ranked by Google's own
// popularity signal, then keeps only the most *prominent* ones (by review
// count) before capping to the final display count — the goal is "the big
// hospital everyone knows", not "the nearest clinic", since that's what
// actually helps sell/rent a property.

import { NEARBY_PLACE_CATEGORIES, type NearbyPlaceCategory } from '../data/nearbyPlaceCategories';
import { loadGooglePlacesLibrary } from './googleMaps';

const EARTH_RADIUS_METERS = 6371000;
const RESULTS_PER_CATEGORY = 3;
const CANDIDATE_POOL_SIZE = 15;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export const haversineDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;

// Straight-line-distance estimate, not a routed ETA (no Directions/Routes API
// call is made) — good enough for "roughly how far is this" on a listing
// page. 25 km/h is a reasonable average for mixed city/arterial-road driving
// in Bangalore traffic.
const AVERAGE_URBAN_SPEED_KMPH = 25;

export const estimateTravelMinutes = (meters: number): number =>
  Math.max(1, Math.round((meters / 1000 / AVERAGE_URBAN_SPEED_KMPH) * 60));

// Resolves a free-text address to lat/lng via Nearby Search (New)'s text
// search — used to backfill coordinates for properties saved before the
// Google Places integration existed, so "Scan Property" still works on them.
export const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const placesLib = await loadGooglePlacesLibrary();
  const { places } = await placesLib.Place.searchByText({
    textQuery: trimmed,
    fields: ['location'],
    maxResultCount: 1,
  });

  const location = places[0]?.location;
  return location ? { lat: location.lat(), lng: location.lng() } : null;
};

// Superset of the saved NearbyPlace shape (types/index.ts) — `id`,
// `distanceMeters` and `userRatingCount` are scan-time-only (fame ranking /
// React keys / selection matching) and dropped before saving to the property record.
export interface ScannedPlace {
  id: string;
  name: string;
  category: string;
  distanceMeters: number;
  distance: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
}

const scanCategory = async (
  placesLib: google.maps.PlacesLibrary,
  category: NearbyPlaceCategory,
  originLat: number,
  originLng: number,
  radiusMeters: number
): Promise<ScannedPlace[]> => {
  const { places } = await placesLib.Place.searchNearby({
    fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount'],
    locationRestriction: { center: { lat: originLat, lng: originLng }, radius: radiusMeters },
    includedTypes: category.includedTypes,
    maxResultCount: CANDIDATE_POOL_SIZE,
    // POPULARITY (Google's own ranking of how well-known/visited a place is)
    // rather than DISTANCE — the nearest match is often a small shop; the
    // most popular one within range is the landmark buyers actually recognize.
    rankPreference: 'POPULARITY',
  });

  const candidates = places
    .filter((place) => place.location)
    .map((place) => {
      const lat = place.location!.lat();
      const lng = place.location!.lng();
      const distanceMeters = haversineDistanceMeters(originLat, originLng, lat, lng);
      return {
        id: place.id,
        name: place.displayName || 'Unnamed place',
        category: category.key,
        distanceMeters,
        distance: formatDistance(distanceMeters),
        lat,
        lng,
        rating: place.rating ?? undefined,
        userRatingCount: place.userRatingCount ?? undefined,
      };
    });

  // Review count is a strong, simple proxy for "big and well-known" — a
  // major hospital or mall accumulates thousands of Google ratings, a small
  // shop or clinic accumulates a handful. Shortlist the most-reviewed
  // candidates first, then present that shortlist nearest-first.
  return candidates
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, RESULTS_PER_CATEGORY)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
};

// Returns only categories that found at least one result — callers should
// simply render whatever keys are present and skip the rest (spec: hide
// empty categories rather than showing "0 results").
export const scanNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusMeters = 10000
): Promise<Record<string, ScannedPlace[]>> => {
  const placesLib = await loadGooglePlacesLibrary();

  const results = await Promise.allSettled(
    NEARBY_PLACE_CATEGORIES.map((category) => scanCategory(placesLib, category, lat, lng, radiusMeters))
  );

  const grouped: Record<string, ScannedPlace[]> = {};
  results.forEach((result, index) => {
    const category = NEARBY_PLACE_CATEGORIES[index];
    if (result.status === 'fulfilled') {
      if (result.value.length > 0) grouped[category.key] = result.value;
    } else {
      console.error(
        `[NearbyPlaces] searchNearby failed for category "${category.key}":`,
        result.reason instanceof Error ? result.reason.message : result.reason,
        '— check that "Places API (New)" is enabled and billing is active; this category will be omitted from results.'
      );
    }
  });

  return grouped;
};
