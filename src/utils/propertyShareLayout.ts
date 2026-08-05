// Single source of truth for page/row dimensions, shared by the React
// rendering components (PropertyShareDocument, PropertyRow, ...) AND the
// pagination engine (propertySharePaginate.ts). Both sides MUST agree on
// these numbers — if the paginator budgets a different row height than what
// actually renders, rows silently clip at the bottom of a page.

// 210mm / 297mm at 96dpi — same convention DocumentPreview.tsx already
// established for the billing generator's live preview.
export const A4_PORTRAIT_WIDTH_PX = 794;
export const A4_PORTRAIT_HEIGHT_PX = 1123;
export const A4_LANDSCAPE_WIDTH_PX = 1123;
export const A4_LANDSCAPE_HEIGHT_PX = 794;

export const HEADER_HEIGHT_PX = 56;
export const FOOTER_HEIGHT_PX = 46;
export const COVER_BLOCK_HEIGHT_PX = 88; // page 1 only
export const TABLE_HEADER_HEIGHT_PX = 24;
export const GROUP_HEADER_HEIGHT_PX = 24;
export const PAGE_PADDING_X_PX = 28;

// A row is two lines (main line + small grey detail line) in portrait, one
// taller line in landscape (everything is a real column, no wrap needed
// except the name itself). A long apartment name adds a second line to the
// name specifically, which is why NAME_LINE_HEIGHT_PX is tracked
// separately from the row's other fixed lines. Line-heights are generous
// relative to the raw 9pt/7.5pt font sizes (spec: readable on a phone, not
// a bare-minimum pack) — this is a first-pass estimate; exact density
// (spec targets ~10 comfortable / ~12 at a squeeze in portrait) is the one
// piece of this feature best confirmed visually rather than computed blind.
export const NAME_LINE_HEIGHT_PX = 16;
export const DETAIL_LINE_HEIGHT_PX = 14;
export const ROW_VERTICAL_PADDING_PX = 22; // top+bottom combined
export const ROW_DIVIDER_PX = 1;

export const PORTRAIT_ROW_HEIGHT_1LINE_PX =
  NAME_LINE_HEIGHT_PX + DETAIL_LINE_HEIGHT_PX + ROW_VERTICAL_PADDING_PX + ROW_DIVIDER_PX; // ~33
export const PORTRAIT_ROW_HEIGHT_2LINE_PX = PORTRAIT_ROW_HEIGHT_1LINE_PX + NAME_LINE_HEIGHT_PX; // ~46

// Landscape: no second grey line (everything's a column), but the name
// column is narrower relative to the extra columns competing for width, so
// wrapping is still possible on very long names.
export const LANDSCAPE_ROW_HEIGHT_1LINE_PX = NAME_LINE_HEIGHT_PX + ROW_VERTICAL_PADDING_PX + ROW_DIVIDER_PX; // ~22
export const LANDSCAPE_ROW_HEIGHT_2LINE_PX = LANDSCAPE_ROW_HEIGHT_1LINE_PX + NAME_LINE_HEIGHT_PX; // ~35

export interface ColumnDef {
  key: string;
  label: string;
  widthPct: number; // of the table's own width (100% = full content width)
}

// Portrait: exactly the 10 columns from spec, in order. Bathrooms/facing/
// gated/tenant-pref/availability/contact move to the row's second line.
export const PORTRAIT_COLUMNS: ColumnDef[] = [
  { key: 'index', label: '#', widthPct: 4 },
  { key: 'name', label: 'Apartment Name', widthPct: 20 },
  { key: 'bhk', label: 'BHK', widthPct: 7 },
  { key: 'price', label: 'Rent (or Price)', widthPct: 11 },
  { key: 'deposit', label: 'Deposit', widthPct: 10 },
  { key: 'maintenance', label: 'Maint.', widthPct: 8 },
  { key: 'sqft', label: 'Sqft', widthPct: 7 },
  { key: 'furnishing', label: 'Furnishing', widthPct: 12 },
  { key: 'location', label: 'Location', widthPct: 13 },
  { key: 'floor', label: 'Floor', widthPct: 8 },
];

// Landscape: same core 10 plus every field that portrait pushed to the
// second line, all as real columns, per spec.
export const LANDSCAPE_COLUMNS: ColumnDef[] = [
  { key: 'index', label: '#', widthPct: 3 },
  { key: 'name', label: 'Apartment Name', widthPct: 15 },
  { key: 'bhk', label: 'BHK', widthPct: 5 },
  { key: 'bathrooms', label: 'Bath', widthPct: 5 },
  { key: 'price', label: 'Rent (or Price)', widthPct: 9 },
  { key: 'deposit', label: 'Deposit', widthPct: 8 },
  { key: 'maintenance', label: 'Maint.', widthPct: 7 },
  { key: 'sqft', label: 'Sqft', widthPct: 6 },
  { key: 'furnishing', label: 'Furnishing', widthPct: 9 },
  { key: 'location', label: 'Location', widthPct: 10 },
  { key: 'floor', label: 'Floor', widthPct: 6 },
  { key: 'facing', label: 'Facing', widthPct: 6 },
  { key: 'gated', label: 'Gated', widthPct: 5 },
  { key: 'tenantPref', label: 'Tenant', widthPct: 6 },
  { key: 'availability', label: 'Available', widthPct: 10 },
];
