import { useEffect, useRef } from 'react';
import { Property } from '../types';
import { getAllProperties } from '../services/storageService';
import {
  AppPage,
  parsePath,
  pathForState,
  findPropertyForSlug,
} from '../utils/seo';

// Bridges the existing App.tsx state machine to real browser URLs using the
// History API only — no router library, no provider, no change to how pages
// render. Purely additive:
//
//   state  -> URL : pushState whenever the current page / selected property
//                   changes, so the address bar, shareable links and canonical
//                   tags all reflect what the user is looking at.
//   URL    -> state: on first load and on back/forward (popstate), the path is
//                   parsed and the matching page/property is applied. Deep-links
//                   to /property/<slug> resolve the property from S3.
//
// A `suppress` ref prevents the two directions from fighting each other.

interface UrlSyncArgs {
  currentPage: AppPage;
  selectedProperty: Property | null;
  // Apply a route parsed from the URL back into App state.
  applyRoute: (route: { page: AppPage; property: Property | null }) => void;
}

export function useUrlSync({ currentPage, selectedProperty, applyRoute }: UrlSyncArgs): void {
  const suppress = useRef(false);
  const selectedId = selectedProperty?.id;

  // state -> URL
  useEffect(() => {
    if (suppress.current) return;
    if (typeof window === 'undefined') return;
    const desired = pathForState(currentPage, selectedProperty);
    if (desired && desired !== window.location.pathname) {
      window.history.pushState(
        { page: currentPage, propId: selectedId },
        '',
        desired
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedId]);

  // URL -> state (initial load + back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const applyFromUrl = async () => {
      const route = parsePath(window.location.pathname);
      suppress.current = true;

      if (route.type === 'property') {
        try {
          const all = await getAllProperties();
          const prop = findPropertyForSlug(all, route.slug);
          if (!cancelled) {
            applyRoute(
              prop
                ? { page: 'property-details', property: prop }
                : { page: 'properties', property: null }
            );
          }
        } catch {
          if (!cancelled) applyRoute({ page: 'properties', property: null });
        }
      } else if (!cancelled) {
        applyRoute({ page: route.page, property: null });
      }

      // Release suppression on the next tick, once the state update above has
      // been committed, so the state->URL effect doesn't immediately re-push.
      window.setTimeout(() => {
        suppress.current = false;
      }, 0);
    };

    applyFromUrl();
    const onPop = () => applyFromUrl();
    window.addEventListener('popstate', onPop);
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
