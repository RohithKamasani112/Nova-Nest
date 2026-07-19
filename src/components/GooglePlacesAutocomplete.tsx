import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { loadGooglePlacesLibrary } from '../utils/googleMaps';

// Greater Bangalore bounding box — biases (does not hard-restrict) results
// toward the city via AutocompleteRequest's `locationBias`.
const BANGALORE_BOUNDS: google.maps.places.LocationBias = {
  south: 12.7343,
  west: 77.3909,
  north: 13.1739,
  east: 77.8827,
};

const LOCALITY_TYPE_PRIORITY = ['sublocality_level_1', 'sublocality', 'neighborhood', 'locality'];

const extractLocality = (components: google.maps.places.AddressComponent[]): string => {
  for (const type of LOCALITY_TYPE_PRIORITY) {
    const match = components.find((component) => component.types.includes(type));
    if (match?.longText) return match.longText;
  }
  return '';
};

export interface PlaceSelection {
  address: string;
  locality: string;
  lat: number;
  lng: number;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceSelection) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

// Flattened view of an AutocompleteSuggestion's placePrediction — keeps the
// render/keyboard-nav code below from having to null-check `.placePrediction`
// (a suggestion with a null prediction is simply filtered out when fetched).
interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  toPlace: () => google.maps.places.Place;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing a building name or area — we'll auto-detect the locality",
  invalid = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const placesLibrary = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    loadGooglePlacesLibrary()
      .then((lib) => {
        placesLibrary.current = lib;
        sessionToken.current = new lib.AutocompleteSessionToken();
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load Google Maps';
        // loadGooglePlacesLibrary already console.errors the detailed cause —
        // this just ties it to the field that's visibly broken.
        console.error('[GooglePlacesAutocomplete] address field disabled:', message);
        setScriptError(message);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    },
    []
  );

  const fetchSuggestions = async (query: string) => {
    const lib = placesLibrary.current;
    if (!lib) return;
    const myRequestId = ++requestId.current;
    setLoading(true);

    try {
      const { suggestions: results } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedRegionCodes: ['in'],
        locationBias: BANGALORE_BOUNDS,
        sessionToken: sessionToken.current ?? undefined,
      });

      if (myRequestId !== requestId.current) return; // superseded by a newer keystroke

      const mapped: Suggestion[] = results
        .map((suggestion) => suggestion.placePrediction)
        .filter((prediction): prediction is google.maps.places.PlacePrediction => prediction !== null)
        .map((prediction) => ({
          placeId: prediction.placeId,
          mainText: prediction.mainText?.text ?? prediction.text.text,
          secondaryText: prediction.secondaryText?.text ?? '',
          description: prediction.text.text,
          toPlace: () => prediction.toPlace(),
        }));

      setSuggestions(mapped);
      setFocusedIndex(0);
    } catch (err) {
      if (myRequestId !== requestId.current) return;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[GooglePlacesAutocomplete] fetchAutocompleteSuggestions failed for query "${query}":`,
        message,
        '— check that "Places API (New)" is enabled for this key in Google Cloud Console, billing is active, and (if referrer-restricted) this origin is allowed.'
      );
      setSuggestions([]);
    } finally {
      if (myRequestId === requestId.current) setLoading(false);
    }
  };

  const handleInputChange = (raw: string) => {
    onChange(raw);
    setOpen(true);

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    const query = raw.trim();
    if (!query) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    debounceTimer.current = window.setTimeout(() => {
      void fetchSuggestions(query);
    }, 300);
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setOpen(false);
    setSuggestions([]);

    try {
      const { place } = await suggestion.toPlace().fetchFields({
        fields: ['formattedAddress', 'addressComponents', 'location', 'displayName'],
      });

      const lat = place.location?.lat() ?? 0;
      const lng = place.location?.lng() ?? 0;
      const locality = place.addressComponents ? extractLocality(place.addressComponents) : '';

      onPlaceSelect({ address: place.formattedAddress || suggestion.description, locality, lat, lng });

      // Fresh session token for the next search (Google's billing best practice).
      if (placesLibrary.current) {
        sessionToken.current = new placesLibrary.current.AutocompleteSessionToken();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[GooglePlacesAutocomplete] fetchFields failed for "${suggestion.description}":`,
        message,
        '— locality/lat/lng could not be auto-filled; the address text is still saved as typed.'
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && suggestions[focusedIndex]) {
      event.preventDefault();
      void selectSuggestion(suggestions[focusedIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full border rounded-xl bg-white pl-11 pr-9 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm ${
          invalid ? 'border-red-500' : 'border-gray-200'
        }`}
      />
      {loading && (
        <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
      )}

      {open && value.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {scriptError ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              <p>Location search unavailable — you can still type the address manually.</p>
              <p className="mt-1 text-xs text-gray-400">{scriptError} (see browser console for details)</p>
            </div>
          ) : loading ? (
            <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectSuggestion(suggestion)}
                className={`flex w-full cursor-pointer items-start gap-2 px-4 py-3 text-left text-sm transition-colors ${
                  focusedIndex === index
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                }`}
              >
                <MapPin size={15} className="mt-0.5 flex-shrink-0" />
                <span>
                  <span className="block font-medium">{suggestion.mainText}</span>
                  {suggestion.secondaryText && (
                    <span className="block text-xs text-gray-500">{suggestion.secondaryText}</span>
                  )}
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">No matching location found</p>
          )}
        </div>
      )}
    </div>
  );
};
