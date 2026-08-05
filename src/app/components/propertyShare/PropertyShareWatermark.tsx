import React from 'react';
import { printColorAdjust } from '../billing/designTokens';

// Diagonal NOVA NEST watermark, present on every page including the cover.
// ~8% opacity per spec (the billing generator's own watermark is 3.5% —
// deliberately different, tuned per document: this is a plain client
// handout meant to be glanced at on a phone, billing docs are printed
// financial records people read closely). Absolutely positioned + z-index
// 0, so every page's actual content wrapper must be position:'relative'
// (any z-index) to paint above it — same stacking-order requirement
// documented on the billing DocumentPage.
export const PropertyShareWatermark: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 0,
    }}
  >
    <span
      style={{
        ...printColorAdjust,
        fontFamily: "'Playfair Display', serif",
        fontSize: 88,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#000000',
        opacity: 0.08,
        transform: 'rotate(-45deg)',
        whiteSpace: 'nowrap',
      }}
    >
      NOVA NEST
    </span>
  </div>
);
