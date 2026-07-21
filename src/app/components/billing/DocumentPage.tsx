import React from 'react';
import { printColorAdjust } from './designTokens';

interface DocumentPageProps {
  children: React.ReactNode;
}

// A single true-A4 (210mm x 297mm) page. Marked `data-pdf-page` so
// src/utils/pdfExport.ts can rasterize each page of a multi-page document
// (e.g. the 2-page Sale Booking Confirmation) independently and assemble
// them into one real multi-page PDF. flex-column + the footer's
// marginTop:auto keeps the footer pinned to the bottom of the page
// regardless of how much body content there is.
export const DocumentPage: React.FC<DocumentPageProps> = ({ children }) => (
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
    {children}
  </div>
);
