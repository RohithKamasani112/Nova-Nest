import React, { useState } from 'react';
import { Loader2, MapPinned, Star, X } from 'lucide-react';
import { NearbyPlace } from '../../types';
import { NEARBY_PLACE_CATEGORIES } from '../../data/nearbyPlaceCategories';
import { geocodeAddress, scanNearbyPlaces, ScannedPlace } from '../../utils/nearbyPlaces';

interface NearbyPlacesScannerProps {
  lat: number | null;
  lng: number | null;
  // Current free-text address — used to geocode on demand when lat/lng
  // aren't set yet (e.g. a property saved before Places integration existed),
  // so Scan Property still works instead of just being hidden.
  address: string;
  selected: NearbyPlace[];
  onChange: (places: NearbyPlace[]) => void;
  // Bubbles up geocoded coordinates so the parent form can save them too,
  // backfilling the property record going forward.
  onCoordsResolved?: (lat: number, lng: number) => void;
}

const RADIUS_OPTIONS = [
  { label: '10 km', meters: 10000 },
  { label: '5 km', meters: 5000 },
  { label: '2 km', meters: 2000 },
];

const matchKey = (place: { name: string; category: string }) => `${place.category}::${place.name}`;

export const NearbyPlacesScanner: React.FC<NearbyPlacesScannerProps> = ({
  lat,
  lng,
  address,
  selected,
  onChange,
  onCoordsResolved,
}) => {
  const [radiusMeters, setRadiusMeters] = useState(10000);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ScannedPlace[]> | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  // Only truly hide when there's nothing at all to work with (a brand new,
  // still-empty form) — otherwise let the button through and geocode the
  // address on demand (see handleScan), so older properties saved before
  // lat/lng existed can still run a scan.
  if (lat === null && lng === null && !address.trim()) return null;

  const handleScan = async () => {
    if (scanning) return; // guards against repeated clicks firing overlapping scans
    setScanning(true);
    setScanError(null);
    try {
      let originLat = lat;
      let originLng = lng;
      if (originLat === null || originLng === null) {
        const geocoded = await geocodeAddress(address);
        if (!geocoded) {
          setScanError("Couldn't determine this property's location from its address — try re-selecting the address above.");
          setScanning(false);
          return;
        }
        originLat = geocoded.lat;
        originLng = geocoded.lng;
        onCoordsResolved?.(originLat, originLng);
      }

      const grouped = await scanNearbyPlaces(originLat, originLng, radiusMeters);
      setResults(grouped);
      // Pre-check whichever previously-selected places still show up in this scan.
      const selectedKeys = new Set(selected.map(matchKey));
      const nextChecked = new Set<string>();
      Object.values(grouped)
        .flat()
        .forEach((place) => {
          if (selectedKeys.has(matchKey(place))) nextChecked.add(place.id);
        });
      setCheckedKeys(nextChecked);
      setShowModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan nearby places';
      console.error('[NearbyPlacesScanner] scan failed:', message);
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

  const toggle = (id: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!results) return;
    const chosen = Object.values(results)
      .flat()
      .filter((place) => checkedKeys.has(place.id));
    const finalPlaces: NearbyPlace[] = chosen.map(({ id, distanceMeters, userRatingCount, ...rest }) => rest);
    onChange(finalPlaces);
    setShowModal(false);
  };

  const removeSelected = (index: number) => {
    onChange(selected.filter((_, i) => i !== index));
  };

  const allPlaceIds = results ? Object.values(results).flat().map((place) => place.id) : [];
  const allSelected = allPlaceIds.length > 0 && allPlaceIds.every((id) => checkedKeys.has(id));

  const toggleSelectAll = () => {
    setCheckedKeys(allSelected ? new Set() : new Set(allPlaceIds));
  };

  const totalFound = results ? Object.values(results).flat().length : 0;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleScan()}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <MapPinned size={16} />}
          {scanning ? 'Scanning nearby area…' : 'Scan Property'}
        </button>
        <select
          value={radiusMeters}
          onChange={(event) => setRadiusMeters(Number(event.target.value))}
          disabled={scanning}
          aria-label="Search radius"
          className="h-[42px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option.meters} value={option.meters}>
              within {option.label}
            </option>
          ))}
        </select>
      </div>

      {scanError && <p className="mt-1.5 text-sm text-red-600">{scanError} (see browser console for details)</p>}

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((place, index) => (
            <span
              key={`${place.category}-${place.name}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {place.name}
              <button
                type="button"
                onClick={() => removeSelected(index)}
                aria-label={`Remove ${place.name}`}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {showModal && results && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Nearby Places</h3>
                <p className="text-sm text-gray-500">
                  {totalFound > 0
                    ? `Found ${totalFound} place${totalFound === 1 ? '' : 's'} — pick the ones worth mentioning.`
                    : 'No notable places found in this radius.'}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {totalFound > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="whitespace-nowrap rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    {allSelected ? 'Clear All' : 'Select All'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {NEARBY_PLACE_CATEGORIES.filter((category) => (results[category.key]?.length ?? 0) > 0).map(
                (category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.key}>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                        <Icon size={15} />
                        {category.label}
                      </h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {results[category.key].map((place) => (
                          <label
                            key={place.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                              checkedKeys.has(place.id)
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-gray-200 hover:border-primary/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checkedKeys.has(place.id)}
                              onChange={() => toggle(place.id)}
                              className="h-4 w-4 flex-shrink-0 rounded accent-primary"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{place.name}</p>
                              <p className="flex items-center gap-1 text-xs text-gray-500">
                                {place.distance}
                                {place.rating !== undefined && (
                                  <span className="flex items-center gap-0.5">
                                    <span className="mx-1 text-gray-300">·</span>
                                    <Star size={11} className="fill-amber-400 text-amber-400" />
                                    {place.rating.toFixed(1)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Add Selected ({checkedKeys.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
