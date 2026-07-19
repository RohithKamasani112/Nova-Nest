/// <reference types="vite/client" />
/// <reference types="google.maps" />

// @types/google.maps declares the `google.maps` ambient namespace but doesn't
// augment `Window` — the script loader in src/utils/googleMaps.ts attaches
// the API there once maps.googleapis.com/maps/api/js finishes loading.
declare global {
  interface Window {
    google: typeof google;
    // Google's documented global hook, invoked on auth/billing/referrer
    // failures (e.g. InvalidKeyMapError, RefererNotAllowedMapError).
    gm_authFailure?: () => void;
  }
}
