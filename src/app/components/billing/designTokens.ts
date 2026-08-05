import React from 'react';

// Shared design-system constants for the billing generator, matching the
// reference PDFs in Billing_inspiration/. Plain hex values (not Tailwind
// CSS-variable classes) throughout every billing component — html2canvas
// (src/utils/pdfExport.ts) reproduces inline hex/rgb styles far more reliably
// than computed CSS-variable-driven utility classes when rasterizing to PDF.

export const NAVY_DARK = '#0b1330';
export const NAVY_LIGHT = '#131c40';
export const NAVY_HEADER_GRADIENT = `linear-gradient(135deg, ${NAVY_DARK} 0%, ${NAVY_LIGHT} 100%)`;
export const GOLD = '#c9a227';
export const GOLD_ACCENT = '#f5cf4d';
export const CREAM = '#f4f2ea';

// Print-contrast pass, round 2: round 1's #52565f/#454a56 (7.4:1 / 8.9:1)
// still read as too light against paper/screen brightness in practice.
// Pushed near-black — 13:1+ / 15:1+ against white — dark, not bold, per the
// explicit ask. Labels stay a half-step lighter than body text for
// hierarchy, but both are now close enough to NAVY_DARK/#1f2430 that
// nothing on the page reads as washed-out gray anymore.
export const MUTED_LABEL = '#2b2f38'; // eyebrow/field labels (was #52565f, before that #8b8f9e)
export const MUTED_TEXT = '#20232b'; // secondary body text, footer captions (was #454a56, before that #5a5f70/#9ba0ac)

// Shared across every generated document (Sale Booking, Commission Invoice,
// Service Invoice, Token Receipt) — rendered once by DocumentPage itself.
export const WATERMARK_TEXT = 'NOVA NEST';

export type CategoryVariant = 'sale' | 'rental' | 'commission' | 'service';

export const CATEGORY_COLORS: Record<CategoryVariant, { bg: string; text: string }> = {
  sale: { bg: '#dcf5e3', text: '#1b7f3f' },
  rental: { bg: '#dce9fb', text: '#1c5cb8' },
  commission: { bg: '#faf0d7', text: '#8a6a12' },
  service: { bg: '#f0e4fa', text: '#7233a8' },
};

// Browsers strip background colors/images in print by default; this makes
// the navy header, cream table rows, and gold accents survive an actual
// print/PDF export.
export const printColorAdjust: React.CSSProperties = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
} as React.CSSProperties;
