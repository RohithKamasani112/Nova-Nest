import React from 'react';
import { printColorAdjust, WATERMARK_TEXT } from './designTokens';

interface DocumentPageProps {
  children: React.ReactNode;
  watermark?: boolean;
}

// A single true-A4 (210mm x 297mm) page. Marked `data-pdf-page` so
// src/utils/pdfExport.ts can rasterize each page of a multi-page document
// (e.g. the 2-page Sale Booking Confirmation) independently and assemble
// them into one real multi-page PDF. flex-column + the footer's
// marginTop:auto keeps the footer pinned to the bottom of the page
// regardless of how much body content there is.
//
// Watermark: on by default, one instance per page (so a 2-page document
// gets it on both pages). Large, extremely faint, centred, never competes
// with printed data — but it IS position:absolute, which stacking rules
// place above static in-flow content regardless of DOM order. Every
// template's own content wrapper must set position:'relative' (any
// z-index) so its text repaints above the watermark instead of under it.
export const DocumentPage: React.FC<DocumentPageProps> = ({ children, watermark = true }) => (
  <div
    data-pdf-page
    style={{
      ...printColorAdjust,
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      fontFamily: "'Inter', sans-serif",
      background: '#ffffff',
      color: '#1f2430',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {watermark && (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <span
          style={{
            ...printColorAdjust,
            fontFamily: "'Playfair Display', serif",
            fontSize: 90,
            fontWeight: 700,
            letterSpacing: 8,
            color: '#000000',
            opacity: 0.035,
            transform: 'rotate(-28deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {WATERMARK_TEXT}
        </span>
      </div>
    )}
    {children}
  </div>
);
