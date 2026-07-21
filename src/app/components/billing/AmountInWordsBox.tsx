import React from 'react';
import { CREAM, GOLD, printColorAdjust } from './designTokens';

interface AmountInWordsBoxProps {
  children: React.ReactNode;
}

export const AmountInWordsBox: React.FC<AmountInWordsBoxProps> = ({ children }) => (
  <div
    style={{
      ...printColorAdjust,
      background: CREAM,
      borderLeft: `4px solid ${GOLD}`,
      padding: '12px 16px',
      fontSize: 13,
      fontStyle: 'italic',
      color: '#3a3f52',
    }}
  >
    {children}
  </div>
);
