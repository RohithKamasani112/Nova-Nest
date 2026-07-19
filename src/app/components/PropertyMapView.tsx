import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapLibraries } from '../../utils/googleMaps';

export interface PropertyMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

interface PropertyMapViewProps {
  center: { lat: number; lng: number };
  markers: PropertyMapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

// Interactive map with a pin per property + a distinct marker for the user's
// own location, click-to-select synced with the results list. The property
// detail page's map is a static <iframe> embed (no markers/click handlers
// possible), so this is a fresh integration — same API key, new 'maps' +
// 'marker' libraries loaded via the existing bootstrap loader.
export const PropertyMapView: React.FC<PropertyMapViewProps> = ({
  center,
  markers,
  selectedId = null,
  onSelect,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerCtorRef = useRef<typeof google.maps.Marker | null>(null);
  const markerObjsRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the map + user-location marker once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapLibraries()
      .then(({ maps, marker }) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        markerCtorRef.current = marker.Marker;

        new marker.Marker({
          map,
          position: center,
          title: 'Your location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: 999,
        });

        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load map';
        console.error('[PropertyMapView]', message);
        setError(message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep property markers in sync with the current result list.
  useEffect(() => {
    if (!ready || !mapRef.current || !markerCtorRef.current) return;
    const map = mapRef.current;
    const Marker = markerCtorRef.current;

    for (const [id, obj] of markerObjsRef.current) {
      if (!markers.some((m) => m.id === id)) {
        obj.setMap(null);
        markerObjsRef.current.delete(id);
      }
    }

    for (const m of markers) {
      if (markerObjsRef.current.has(m.id)) continue;
      const obj = new Marker({ map, position: { lat: m.lat, lng: m.lng }, title: m.title });
      obj.addListener('click', () => onSelect?.(m.id));
      markerObjsRef.current.set(m.id, obj);
    }
  }, [markers, ready, onSelect]);

  // Pan to + briefly bounce whichever marker is selected (card hover/click).
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const obj = markerObjsRef.current.get(selectedId);
    const position = obj?.getPosition();
    if (!obj || !position) return;
    mapRef.current.panTo(position);
    obj.setAnimation(google.maps.Animation.BOUNCE);
    const timeout = window.setTimeout(() => obj.setAnimation(null), 700);
    return () => window.clearTimeout(timeout);
  }, [selectedId, ready]);

  useEffect(
    () => () => {
      markerObjsRef.current.forEach((obj) => obj.setMap(null));
      markerObjsRef.current.clear();
    },
    []
  );

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
          Map unavailable — you can still browse the list below.
        </div>
      )}
    </div>
  );
};
