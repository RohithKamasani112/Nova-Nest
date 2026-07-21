import React from 'react';
import { CATEGORY_COLORS, CategoryVariant, printColorAdjust } from './designTokens';

interface CategoryPillProps {
  label: string;
  variant: CategoryVariant;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ label, variant }) => {
  const colors = CATEGORY_COLORS[variant];
  return (
    <span
      style={{
        ...printColorAdjust,
        display: 'inline-block',
        background: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        padding: '5px 14px',
        borderRadius: 999,
      }}
    >
      {label}
    </span>
  );
};
