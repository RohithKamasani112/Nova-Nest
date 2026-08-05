import React from 'react';
import { CREAM, GOLD, MUTED_TEXT, printColorAdjust } from './designTokens';

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
      color: MUTED_TEXT,
    }}
  >
    {children}
  </div>
);
