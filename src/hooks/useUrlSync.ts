import { useEffect, useRef } from 'react';
import { Property } from '../types';
import { getAllProperties } from '../services/storageService';
import {
  AppPage,
  parsePath,
  pathForState,
  findPropertyForSlug,
} from '../utils/seo';
import { trackPageView } from '../utils/analytics';

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
  // Content slug for locality / blog-post pages (null for everything else).
  activeSlug?: string | null;
  // Apply a route parsed from the URL back into App state.
  applyRoute: (route: {
    page: AppPage;
    property: Property | null;
    slug?: string | null;
  }) => void;
}

export function useUrlSync({
  currentPage,
  selectedProperty,
  activeSlug = null,
  applyRoute,
}: UrlSyncArgs): void {
  const suppress = useRef(false);
  const selectedId = selectedProperty?.id;
  // Skip the initial render: GA's config call in index.html already sends the
  // first page_view, so we only report subsequent client-side navigations.
  const firstPageView = useRef(true);

  // Report a GA4 page_view whenever the resolved path changes (covers in-app
  // navigation and back/forward), regardless of push/replace suppression.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (firstPageView.current) {
      firstPageView.current = false;
      return;
    }
    const path = pathForState(currentPage, selectedProperty, activeSlug) || window.location.pathname;
    trackPageView(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedId, activeSlug]);

  // state -> URL
  useEffect(() => {
    if (suppress.current) return;
    if (typeof window === 'undefined') return;
    const desired = pathForState(currentPage, selectedProperty, activeSlug);
    if (desired && desired !== window.location.pathname) {
      window.history.pushState(
        { page: currentPage, propId: selectedId, slug: activeSlug },
        '',
        desired
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedId, activeSlug]);

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
      } else if (route.type === 'locality') {
        if (!cancelled) applyRoute({ page: 'locality', property: null, slug: route.slug });
      } else if (route.type === 'blog-post') {
        if (!cancelled) applyRoute({ page: 'blog-post', property: null, slug: route.slug });
      } else if (!cancelled) {
        applyRoute({ page: route.page, property: null, slug: null });
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
