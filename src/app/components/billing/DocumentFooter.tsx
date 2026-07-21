import React from 'react';
import { BUSINESS_TAGLINE } from '../../../utils/siteSettings';
import { NAVY_DARK, printColorAdjust } from './designTokens';

interface DocumentFooterProps {
  pageNumber: number;
  totalPages: number;
}

// Slim navy bar pinned to the bottom of every page (the parent DocumentPage
// is a flex column, so marginTop:auto here pushes this to the bottom
// regardless of body content height).
export const DocumentFooter: React.FC<DocumentFooterProps> = ({ pageNumber, totalPages }) => (
  <div
    style={{
      ...printColorAdjust,
      marginTop: 'auto',
      background: NAVY_DARK,
      color: '#ffffff',
      fontSize: 11,
      padding: '10px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <span>Nova Nest Property Management &middot; {BUSINESS_TAGLINE}</span>
    <span>
      Page {pageNumber} of {totalPages}
    </span>
  </div>
);
