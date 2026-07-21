import React from 'react';
import { GOLD, NAVY_DARK } from './designTokens';

interface SectionHeadingProps {
  number?: string; // e.g. "4."
  children: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ number, children }) => (
  <div
    style={{
      color: NAVY_DARK,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      paddingBottom: 8,
      borderBottom: `2px solid ${GOLD}`,
      marginBottom: 14,
    }}
  >
    {number ? `${number} ` : ''}
    {children}
  </div>
);
