// Loads the Google Maps JavaScript API via the officially recommended
// "Dynamic Library Import" bootstrap (loading=async + importLibrary):
// https://developers.google.com/maps/documentation/javascript/load-maps-js-api#dynamic-library-import
//
// This is required for the new Places API classes (AutocompleteSuggestion,
// Place) used in src/components/GooglePlacesAutocomplete.tsx — those are
// only guaranteed attached once resolved via importLibrary(), not merely
// once a `<script src="...&libraries=places">` tag's `load` event fires.
// The legacy AutocompleteService/PlacesService classes this app used
// previously are not available on "Places API (New)"-only Cloud projects
// (ApiNotActivatedMapError), which is why this migration was needed.
//
// NOTE: Vite only reads .env at dev-server startup — after adding/editing
// VITE_GOOGLE_MAPS_API_KEY you must restart `npm run dev` for import.meta.env
// to pick up the new value. A hot-reloaded page will not see it.

type ImportLibraryFn = (name: string, ...rest: unknown[]) => Promise<unknown>;
type GoogleMapsNamespace = Record<string, unknown> & { importLibrary?: ImportLibraryFn };
type GoogleNamespace = { maps?: GoogleMapsNamespace };

export const getGoogleMapsApiKey = (): string | undefined =>
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Installs `google.maps.importLibrary` if it isn't already present — safe to
// call more than once (e.g. multiple components mounting); only the first
// call does anything. Once the real maps/api/js script finishes loading, it
// overwrites this shim with Google's own full implementation, so this only
// has to survive up until that point.
const installBootstrapLoader = (apiKey: string) => {
  const win = window as unknown as { google?: GoogleNamespace };
  const google = (win.google ??= {});
  const maps = (google.maps ??= {});

  if (maps.importLibrary) return; // already installed

  let scriptLoad: Promise<void> | null = null;
  const requestedLibraries = new Set<string>();

  const loadScript = (): Promise<void> => {
    if (scriptLoad) return scriptLoad;
    scriptLoad = new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        libraries: [...requestedLibraries].join(','),
        callback: '__googleMapsBootstrapCallback',
      });
      (window as Record<string, unknown>).__googleMapsBootstrapCallback = resolve;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      const nonce = document.querySelector('script[nonce]')?.getAttribute('nonce');
      if (nonce) script.nonce = nonce;
      script.onerror = () => {
        scriptLoad = null;
        const message = 'Failed to load the Google Maps script (network error or the request was blocked).';
        console.error('[GooglePlaces]', message);
        reject(new Error(message));
      };
      document.head.appendChild(script);
    });
    return scriptLoad;
  };

  maps.importLibrary = (name, ...rest) => {
    requestedLibraries.add(name);
    return loadScript().then(() => maps.importLibrary!(name, ...rest));
  };
};

// Shared setup for every library loader below: validates the API key, wires
// Google's auth-failure hook to the console, and installs the bootstrap
// loader. Throws (synchronously) on a missing key — callers wrap this in a
// try/catch and turn it into a rejected promise.
const ensureBootstrapReady = (): string => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    const message =
      'VITE_GOOGLE_MAPS_API_KEY is not set (or empty) in this build. ' +
      'If you just added it to .env, restart `npm run dev` — Vite only reads ' +
      '.env at server startup, not on hot reload.';
    console.error('[GooglePlaces]', message);
    throw new Error(message);
  }

  // Google calls this global hook on auth/billing/referrer-restriction
  // failures (e.g. ApiNotActivatedMapError, RefererNotAllowedMapError,
  // InvalidKeyMapError). Wire it to the console so those show up loudly
  // instead of only appearing as an unlabeled network 403 in the Network tab.
  const previousAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    console.error(
      '[GooglePlaces] Google Maps authentication failed — check that "Places API (New)" and ' +
        '"Maps JavaScript API" are enabled for this key in Google Cloud Console, billing is active ' +
        'on the project, and (if the key is HTTP-referrer restricted) that this origin/localhost is allowed.'
    );
    previousAuthFailure?.();
  };

  installBootstrapLoader(apiKey);
  return apiKey;
};

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

export const loadGooglePlacesLibrary = (): Promise<google.maps.PlacesLibrary> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in a browser environment'));
  }

  if (placesLibraryPromise) return placesLibraryPromise;

  try {
    ensureBootstrapReady();
  } catch (err) {
    return Promise.reject(err);
  }

  placesLibraryPromise = window.google.maps.importLibrary('places').catch((err: unknown) => {
    placesLibraryPromise = null;
    const message = err instanceof Error ? err.message : 'Failed to load the Google Maps Places library';
    console.error('[GooglePlaces]', message);
    throw err;
  });

  return placesLibraryPromise;
};

export interface GoogleMapLibraries {
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
}

// Loads the 'maps' + 'marker' libraries for a real interactive map with
// clickable pins (used by PropertyMapView) — the property detail page's map
// was previously just a static `<iframe>` embed, which can't host markers or
// click handlers, so this is a new (but same-API-key) integration.
let mapLibrariesPromise: Promise<GoogleMapLibraries> | null = null;

export const loadGoogleMapLibraries = (): Promise<GoogleMapLibraries> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in a browser environment'));
  }

  if (mapLibrariesPromise) return mapLibrariesPromise;

  try {
    ensureBootstrapReady();
  } catch (err) {
    return Promise.reject(err);
  }

  mapLibrariesPromise = Promise.all([window.google.maps.importLibrary('maps'), window.google.maps.importLibrary('marker')])
    .then(([maps, marker]) => ({ maps, marker }))
    .catch((err: unknown) => {
      mapLibrariesPromise = null;
      const message = err instanceof Error ? err.message : 'Failed to load the Google Maps map/marker libraries';
      console.error('[GooglePlaces]', message);
      throw err;
    });

  return mapLibrariesPromise;
};
