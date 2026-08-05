import React from 'react';
import { printColorAdjust, NAVY_DARK } from '../billing/designTokens';
import { BUSINESS_EMAIL } from '../../../utils/siteSettings';
import { FOOTER_HEIGHT_PX, PAGE_PADDING_X_PX } from '../../../utils/propertyShareLayout';

interface PropertyShareFooterProps {
  phone: string; // resolved per Phase 7/8 footer logic — single shared number or office default
  pageNumber: number;
  totalPages: number;
}

export const PropertyShareFooter: React.FC<PropertyShareFooterProps> = ({ phone, pageNumber, totalPages }) => (
  <div
    style={{
      ...printColorAdjust,
      height: FOOTER_HEIGHT_PX,
      marginTop: 'auto',
      background: NAVY_DARK,
      color: '#ffffff',
      fontSize: 10,
      padding: `6px ${PAGE_PADDING_X_PX}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 2,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>
        Nova Nest &middot; {phone} &middot; {BUSINESS_EMAIL}
      </span>
      <span>
        Page {pageNumber} of {totalPages}
      </span>
    </div>
    <div style={{ opacity: 0.75, fontSize: 9 }}>Prices and availability subject to change.</div>
  </div>
);
