import React from 'react';
import { NAVY_DARK } from './designTokens';

export interface TotalsBlockRow {
  label: string;
  value: string;
}

interface TotalsBlockProps {
  rows: TotalsBlockRow[];
}

// Right-aligned stacked totals (Taxable Amount / CGST / SGST / Total
// Payable) — the last row is always the grand total, rendered bold with a
// bold navy top-rule per the design system.
export const TotalsBlock: React.FC<TotalsBlockProps> = ({ rows }) => (
  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
    <div style={{ width: 300 }}>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        return (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontSize: isLast ? 15 : 13,
              fontWeight: isLast ? 700 : 400,
              color: isLast ? NAVY_DARK : '#3a3f52',
              borderTop: isLast ? `2px solid ${NAVY_DARK}` : 'none',
              marginTop: isLast ? 4 : 0,
            }}
          >
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        );
      })}
    </div>
  </div>
);
