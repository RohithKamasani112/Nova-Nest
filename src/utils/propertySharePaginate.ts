import { ClientFacingPropertyRow } from './propertyShareFields';
import { formatBhkLabel } from './propertyShareFormat';
import * as L from './propertyShareLayout';

export type ShareLayout = 'portrait' | 'landscape';

export interface FlowRowItem {
  type: 'row';
  row: ClientFacingPropertyRow;
  heightPx: number;
}
export interface FlowGroupHeaderItem {
  type: 'groupHeader';
  label: string;
  heightPx: number;
}
export type FlowItem = FlowRowItem | FlowGroupHeaderItem;

// Cheap, synchronous text-width estimate — no DOM layout pass needed. Uses
// canvas.measureText when available (accurate, matches real font metrics);
// falls back to a per-character average-width heuristic so this module
// stays pure-JS-testable outside a browser (Node verification scripts,
// this exact file's own test coverage).
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidthPx(text: string, fontSizePx: number, fontWeight: number | string = 400): number {
  if (typeof document !== 'undefined') {
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontWeight} ${fontSizePx}px Inter, sans-serif`;
      return ctx.measureText(text).width;
    }
  }
  // Heuristic fallback: ~0.52 * fontSize per average character for Inter.
  return text.length * fontSizePx * 0.52;
}

function nameLineCount(name: string, layout: ShareLayout, pageWidthPx: number): 1 | 2 {
  const columns = layout === 'portrait' ? L.PORTRAIT_COLUMNS : L.LANDSCAPE_COLUMNS;
  const nameCol = columns.find((c) => c.key === 'name')!;
  const contentWidthPx = pageWidthPx - 2 * L.PAGE_PADDING_X_PX;
  const nameColWidthPx = (nameCol.widthPct / 100) * contentWidthPx - 12; // minus cell padding
  const textWidthPx = measureTextWidthPx(name, 9, 500); // 9pt main-line, medium weight
  return textWidthPx > nameColWidthPx ? 2 : 1;
}

function rowHeight(row: ClientFacingPropertyRow, layout: ShareLayout, pageWidthPx: number): number {
  const lines = nameLineCount(row.title, layout, pageWidthPx);
  if (layout === 'portrait') {
    return lines === 2 ? L.PORTRAIT_ROW_HEIGHT_2LINE_PX : L.PORTRAIT_ROW_HEIGHT_1LINE_PX;
  }
  return lines === 2 ? L.LANDSCAPE_ROW_HEIGHT_2LINE_PX : L.LANDSCAPE_ROW_HEIGHT_1LINE_PX;
}

// BHK group ordering: Studio/RK first, then ascending bedroom count.
function bhkGroupLabel(bedrooms: number): string {
  return bedrooms === 0 ? '1 RK / Studio' : formatBhkLabel(bedrooms);
}

// Mixed rent + sale in one selection (edge case in spec): keep tray order
// within each type, but rent always flows before sale, each under its own
// "For Rent" / "For Sale" section header — that's what disambiguates the
// price column's meaning per row without needing two different table
// headers on the same continuous table.
function sortForSections(rows: ClientFacingPropertyRow[]): { rows: ClientFacingPropertyRow[]; mixed: boolean } {
  const hasRent = rows.some((r) => r.listingType === 'rent');
  const hasSale = rows.some((r) => r.listingType === 'sale');
  if (!hasRent || !hasSale) return { rows, mixed: false };
  const rent = rows.filter((r) => r.listingType === 'rent');
  const sale = rows.filter((r) => r.listingType === 'sale');
  return { rows: [...rent, ...sale], mixed: true };
}

export function buildFlowItems(
  rows: ClientFacingPropertyRow[],
  layout: ShareLayout,
  groupByBhk: boolean,
  pageWidthPx: number
): FlowItem[] {
  const groupHeaderHeight = L.GROUP_HEADER_HEIGHT_PX;
  const { rows: ordered, mixed } = sortForSections(rows);

  if (!groupByBhk && !mixed) {
    return ordered.map((row) => ({ type: 'row', row, heightPx: rowHeight(row, layout, pageWidthPx) }));
  }

  const items: FlowItem[] = [];
  let currentSection: 'rent' | 'sale' | null = null;
  let currentGroup: string | null = null;
  for (const row of ordered) {
    if (mixed && row.listingType !== currentSection) {
      currentSection = row.listingType;
      items.push({
        type: 'groupHeader',
        label: currentSection === 'rent' ? 'For Rent' : 'For Sale',
        heightPx: groupHeaderHeight,
      });
      currentGroup = null; // force the BHK sub-header to reprint under the new section
    }
    if (groupByBhk) {
      const label = bhkGroupLabel(row.bedrooms);
      if (label !== currentGroup) {
        items.push({ type: 'groupHeader', label, heightPx: groupHeaderHeight });
        currentGroup = label;
      }
    }
    items.push({ type: 'row', row, heightPx: rowHeight(row, layout, pageWidthPx) });
  }
  return items;
}

// Greedy bucketing: page 1 reserves header+cover+footer+table-header space;
// subsequent pages reserve header+footer+table-header (no cover block). A
// group header never forces a new page by itself — it's just another flow
// item — but we do avoid stranding a lone group header as the very last
// item on a page with none of its rows following it.
export function paginateFlowItems(
  items: FlowItem[],
  layout: ShareLayout,
  hasCover: boolean
): FlowItem[][] {
  const pageHeightPx = layout === 'portrait' ? L.A4_PORTRAIT_HEIGHT_PX : L.A4_LANDSCAPE_HEIGHT_PX;
  const pageWidthPx = layout === 'portrait' ? L.A4_PORTRAIT_WIDTH_PX : L.A4_LANDSCAPE_WIDTH_PX;
  void pageWidthPx;

  const pages: FlowItem[][] = [];
  let currentPage: FlowItem[] = [];
  let usedHeight = 0;

  const budgetForPage = (pageIndex: number) => {
    const chrome =
      L.HEADER_HEIGHT_PX +
      L.FOOTER_HEIGHT_PX +
      L.TABLE_HEADER_HEIGHT_PX +
      (pageIndex === 0 && hasCover ? L.COVER_BLOCK_HEIGHT_PX : 0);
    return pageHeightPx - chrome;
  };

  let budget = budgetForPage(0);

  const flushPage = () => {
    if (currentPage.length === 0) return;
    // Don't strand trailing group header(s) with none of their rows — a
    // mixed rent/sale + BHK-grouped page can end with a section header
    // immediately followed by a BHK header, so this must strip ALL
    // trailing headers, not just one.
    while (currentPage.length > 0 && currentPage[currentPage.length - 1].type === 'groupHeader') {
      currentPage.pop();
    }
    if (currentPage.length > 0) pages.push(currentPage);
    currentPage = [];
    usedHeight = 0;
    budget = budgetForPage(pages.length);
  };

  for (const item of items) {
    if (usedHeight + item.heightPx > budget) {
      flushPage();
    }
    currentPage.push(item);
    usedHeight += item.heightPx;
  }
  if (currentPage.length > 0) pages.push(currentPage);

  return pages.length > 0 ? pages : [[]];
}

// Row count per page — used for "N properties on page M" style summaries
// and by tests; never used to reconstruct render order (that must stay the
// raw FlowItem[] so consecutive group headers, e.g. a "For Rent" section
// header immediately followed by a "1 BHK" sub-header, are never collapsed
// into a single label and silently lose one of them).
export function countRowsPerPage(pages: FlowItem[][]): number[] {
  return pages.map((page) => page.filter((item) => item.type === 'row').length);
}
