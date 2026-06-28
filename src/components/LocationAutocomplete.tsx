import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const fallbackLocations = [
  'Whitefield',
  'Marathahalli',
  'Bellandur',
  'Hoodi',
  'Mahadevapura',
  'Koramangala',
  'HSR Layout',
  'Indiranagar',
  'Sarjapur Road',
  'Electronic City',
  'Hebbal',
  'Yelahanka',
  'JP Nagar',
  'Jayanagar',
  'Doddanekundi',
  'Brookefield',
  'Varthur',
  'KR Puram',
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  locations?: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  locations = [],
  placeholder = 'Enter location...',
  className = '',
  inputClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const allLocations = useMemo(() => {
    const merged = [...locations, ...fallbackLocations]
      .filter(Boolean)
      .map((location) => location.trim());
    return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const filtered = query
      ? allLocations.filter((location) => location.toLowerCase().includes(query))
      : allLocations;
    return filtered.slice(0, 6);
  }, [allLocations, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLocation = (location: string) => {
    onChange(location);
    onSelect?.(location);
    setOpen(false);
    setFocusedIndex(0);
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
      selectLocation(suggestions[focusedIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setFocusedIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {suggestions.map((location, index) => (
            <button
              key={location}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectLocation(location)}
              className={`w-full px-4 py-3 text-sm cursor-pointer flex items-center gap-2 transition-colors text-left ${
                focusedIndex === index
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-700 hover:bg-primary-light hover:text-primary'
              }`}
            >
              <MapPin size={15} />
              {location}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
