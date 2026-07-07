// Google Analytics 4 (GA4) helper.
//
// The base gtag.js snippet is loaded once from index.html (see the <head> there),
// which reads the measurement ID from the single VITE_GA_MEASUREMENT_ID env var.
// This module is the ONE place the rest of the app talks to GA — always call
// `trackEvent(...)` (or one of the named wrappers below) instead of touching
// `window.gtag` directly, so event names/params stay consistent and every call
// is null-safe if the script is blocked (ad-blockers) or not yet loaded.

// The measurement ID is only needed here for page_view calls and for the
// "is GA configured" guard; the base config lives in index.html. Kept in sync
// with index.html via the same env var so there is a single source of truth.
export const GA_MEASUREMENT_ID: string =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-B7PPPMGMFL';

// gtag pushes its arguments onto window.dataLayer. Declare both so TypeScript is
// happy and other modules get autocomplete.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, unknown>;

/** True once the gtag.js snippet from index.html has defined window.gtag. */
const isReady = (): boolean =>
  typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Fire a GA4 custom event. Safe to call anywhere — no-ops (with a dev warning)
 * if gtag hasn't loaded, so tracking never breaks the UI.
 *
 * @example trackEvent('whatsapp_click', { location: 'floating_button' })
 */
export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (!isReady()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics] gtag not ready, skipped event:', eventName, params);
    }
    return;
  }
  window.gtag!('event', eventName, params);
}

/**
 * Record a virtual page view for SPA navigation. GA sends the first page_view
 * automatically from the index.html config call; call this on every subsequent
 * in-app route change so client-side navigations are still counted.
 */
export function trackPageView(path: string, title?: string): void {
  if (!isReady()) return;
  window.gtag!('event', 'page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : path,
    page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
  });
}

// ── Named wrappers ─────────────────────────────────────────────────────────
// Thin, self-documenting helpers over trackEvent so call sites read cleanly and
// the event schema (names + params) stays defined in exactly one file.

/** Property card click / property detail view. */
export function trackPropertyView(property: {
  id: string;
  title?: string;
  location?: string;
  status?: string;
}): void {
  trackEvent('property_view', {
    property_id: property.id,
    property_name: property.title,
    property_location: property.location,
    property_status: property.status,
  });
}

/** Successful contact / enquiry form submission. */
export function trackContactSubmit(formName: string, params: EventParams = {}): void {
  trackEvent('contact_form_submit', { form_name: formName, ...params });
}

/** Any WhatsApp button / link click. `location` describes where it was clicked. */
export function trackWhatsAppClick(location: string, params: EventParams = {}): void {
  trackEvent('whatsapp_click', { location, ...params });
}

/** Phone number / "Call Now" click. */
export function trackPhoneClick(location: string, params: EventParams = {}): void {
  trackEvent('phone_click', { location, ...params });
}

/** Outbound click to an external / social link. */
export function trackSocialClick(network: string, url?: string): void {
  trackEvent('social_click', { network, link_url: url });
}
