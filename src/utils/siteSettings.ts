// Central business-identity fields for printed/exported documents (currently
// just the bill/receipt letterhead) — sourced from the same VITE_ env vars
// the rest of the site already reads (e.g. Footer.tsx's business name), with
// matching fallback values, so nothing is hardcoded independently here.
export const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || 'Nova Nest Property Management';

export const BUSINESS_ADDRESS =
  import.meta.env.VITE_BUSINESS_ADDRESS ||
  'Ground Floor, Site No-29&30, Meshwarama Temple, 1st Main Rd, Maheswari Nagar, B Narayanapura, Mahadevapura, Bengaluru, Karnataka 560048';

export const BUSINESS_PHONE = import.meta.env.VITE_BUSINESS_PHONE || '096637 95675';
