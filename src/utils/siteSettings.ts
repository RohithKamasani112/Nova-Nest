// Central business-identity fields for printed/exported documents (currently
// just the bill/receipt letterhead) — sourced from the same VITE_ env vars
// the rest of the site already reads (e.g. Footer.tsx's business name), with
// matching fallback values, so nothing is hardcoded independently here.
export const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || 'Nova Nest Property Management';

export const BUSINESS_ADDRESS =
  import.meta.env.VITE_BUSINESS_ADDRESS ||
  'Ground Floor, Site No-29&30, Meshwarama Temple, 1st Main Rd, Maheswari Nagar, B Narayanapura, Mahadevapura, Bengaluru, Karnataka 560048';

export const BUSINESS_PHONE = import.meta.env.VITE_BUSINESS_PHONE || '096637 95675';

export const BUSINESS_GSTIN = import.meta.env.VITE_BUSINESS_GSTIN || '29DKVPR4628P1ZS';

export const BUSINESS_EMAIL =
  import.meta.env.VITE_BUSINESS_EMAIL || 'novanestpropertymanagement@gmail.com';

export const BUSINESS_PROPRIETOR = import.meta.env.VITE_BUSINESS_PROPRIETOR || 'Rajesh Naidu';

export const BUSINESS_TAGLINE = import.meta.env.VITE_BUSINESS_TAGLINE || 'Your trusted path to home';

// Digits-only, country-code-prefixed number used to build wa.me links (the
// floating contact button in App.tsx read this directly before; centralized
// here so the Services page can reuse the same source of truth).
export const BUSINESS_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
