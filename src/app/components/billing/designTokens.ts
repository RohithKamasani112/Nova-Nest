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
