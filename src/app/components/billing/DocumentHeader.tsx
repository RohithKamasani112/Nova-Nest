import React from 'react';
import companyLogo from '../../../assets/companyLogo.png';
import {
  BUSINESS_ADDRESS,
  BUSINESS_EMAIL,
  BUSINESS_GSTIN,
  BUSINESS_PHONE,
} from '../../../utils/siteSettings';
import { GOLD, GOLD_ACCENT, NAVY_HEADER_GRADIENT, printColorAdjust } from './designTokens';

interface DocumentHeaderProps {
  docTypeLabel: string; // e.g. "SALE CONFIRMATION", "TAX INVOICE – COMMISSION"
  docNumber: string;
  date: string; // already display-formatted, e.g. "14 Mar 2026"
  gstApplicable: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ docTypeLabel, docNumber, date, gstApplicable }) => (
  <div
    style={{
      ...printColorAdjust,
      background: NAVY_HEADER_GRADIENT,
      padding: '28px 40px',
      borderBottom: `3px solid ${GOLD}`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            ...printColorAdjust,
            background: GOLD_ACCENT,
            borderRadius: 10,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img src={companyLogo} alt="Nova Nest" style={{ height: 52, width: 'auto', display: 'block' }} />
        </div>
        <div>
          <div style={{ color: '#ffffff', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22 }}>
            NOVA NEST
          </div>
          <div style={{ color: '#ffffff', fontSize: 11, letterSpacing: 2 }}>PROPERTY MANAGEMENT</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            color: GOLD_ACCENT,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          {docTypeLabel}
        </div>
        <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 700 }}>{docNumber}</div>
        <div style={{ color: '#ffffff', fontSize: 12, marginTop: 2 }}>Date: {date}</div>
      </div>
    </div>
    <div
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '0.5px solid rgba(255,255,255,0.25)',
        color: '#ffffff',
        fontSize: 11,
        lineHeight: 1.6,
      }}
    >
      {BUSINESS_ADDRESS}
      {gstApplicable && (
        <>
          &nbsp;|&nbsp; GSTIN: {BUSINESS_GSTIN}
        </>
      )}
      <br />
      Phone: {BUSINESS_PHONE} &nbsp;|&nbsp; {BUSINESS_EMAIL}
    </div>
  </div>
);
