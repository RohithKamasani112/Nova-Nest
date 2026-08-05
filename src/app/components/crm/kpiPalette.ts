// Validated categorical palette (see dataviz skill reference/palette.md) —
// fixed hue order, never cycled/reassigned per-render.
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

// Single-hue sequential ramp (blue) for magnitude bar charts — bar length
// already encodes magnitude, so one consistent shade throughout is correct
// here (varying shade-per-bar is for heatmaps, not ranked bar charts).
export const SEQUENTIAL = '#2a78d6';

// Fixed status roles — never reused for a categorical series.
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

export const SOURCE_COLOR: Record<string, string> = {
  housing: CATEGORICAL[0],
  magicbricks: CATEGORICAL[1],
  '99acres': CATEGORICAL[2],
  personal: CATEGORICAL[3],
};
