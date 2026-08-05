import React from 'react';
import companyLogo from '../../../assets/companyLogo.png';
import { GOLD } from '../billing/designTokens';
import { HEADER_HEIGHT_PX, PAGE_PADDING_X_PX } from '../../../utils/propertyShareLayout';

interface PropertyShareHeaderProps {
  title: string; // e.g. "1BHK Properties — Whitefield"
  date: string; // already display-formatted
}

// Small logo left, title center, date right, thin accent rule beneath — so
// branding reads even in a thumbnail preview, per spec. Deliberately much
// lighter than the billing generator's DocumentHeader (that one is a full
// navy letterhead block for financial documents); this is a compact client
// handout header repeated on every page, not a one-time letterhead.
export const PropertyShareHeader: React.FC<PropertyShareHeaderProps> = ({ title, date }) => (
  <div
    style={{
      height: HEADER_HEIGHT_PX,
      padding: `10px ${PAGE_PADDING_X_PX}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `2px solid ${GOLD}`,
    }}
  >
    <img src={companyLogo} alt="Nova Nest" style={{ height: 28, width: 'auto', display: 'block' }} />
    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: '#1f2430' }}>
      {title}
    </div>
    <div style={{ fontSize: 11, color: '#454a56' }}>{date}</div>
  </div>
);
