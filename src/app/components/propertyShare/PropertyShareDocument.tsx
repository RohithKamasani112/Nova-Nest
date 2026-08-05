import React from 'react';
import { FlowItem } from '../../../utils/propertySharePaginate';
import { PropertyShareWatermark } from './PropertyShareWatermark';
import { PropertyShareHeader } from './PropertyShareHeader';
import { PropertyShareFooter } from './PropertyShareFooter';
import { PropertyRow } from './PropertyRow';
import {
  A4_PORTRAIT_WIDTH_PX,
  A4_PORTRAIT_HEIGHT_PX,
  A4_LANDSCAPE_WIDTH_PX,
  A4_LANDSCAPE_HEIGHT_PX,
  PORTRAIT_COLUMNS,
  LANDSCAPE_COLUMNS,
  PAGE_PADDING_X_PX,
  GROUP_HEADER_HEIGHT_PX,
} from '../../../utils/propertyShareLayout';
import { GOLD, printColorAdjust } from '../billing/designTokens';

export interface PropertyShareCover {
  clientName?: string;
  customMessage?: string;
  propertyCount: number;
}

export interface PropertyShareDocumentProps {
  pages: FlowItem[][];
  layout: 'portrait' | 'landscape';
  title: string;
  date: string;
  cover: PropertyShareCover;
  showContactNumber: boolean;
  showPrices: boolean;
  footerPhone: string;
}

const tableHeaderCellStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#454a56',
  padding: '4px 8px',
  borderBottom: '1.5px solid #d8dce4',
};

const GroupHeaderRow: React.FC<{ label: string; colCount: number }> = ({ label, colCount }) => (
  <tr>
    <td
      colSpan={colCount}
      style={{
        height: GROUP_HEADER_HEIGHT_PX,
        fontSize: 11,
        fontWeight: 700,
        color: '#1f2430',
        padding: '4px 8px',
        borderBottom: `1px solid ${GOLD}`,
      }}
    >
      {label}
    </td>
  </tr>
);

export const PropertyShareDocument: React.FC<PropertyShareDocumentProps> = ({
  pages,
  layout,
  title,
  date,
  cover,
  showContactNumber,
  showPrices,
  footerPhone,
}) => {
  const widthPx = layout === 'portrait' ? A4_PORTRAIT_WIDTH_PX : A4_LANDSCAPE_WIDTH_PX;
  const heightPx = layout === 'portrait' ? A4_PORTRAIT_HEIGHT_PX : A4_LANDSCAPE_HEIGHT_PX;
  const columns = layout === 'portrait' ? PORTRAIT_COLUMNS : LANDSCAPE_COLUMNS;

  let runningIndex = 0;

  return (
    <div>
      {pages.map((page, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        return (
          <React.Fragment key={pageIndex}>
            <div
              data-pdf-page
              style={{
                ...printColorAdjust,
                width: widthPx,
                height: heightPx,
                position: 'relative',
                overflow: 'hidden',
                background: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                color: '#1f2430',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <PropertyShareWatermark />

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <PropertyShareHeader title={title} date={date} />

                {isFirstPage && (
                  <div style={{ padding: `12px ${PAGE_PADDING_X_PX}px 4px` }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                    {cover.clientName && (
                      <div style={{ fontSize: 11, marginTop: 2 }}>For {cover.clientName}</div>
                    )}
                    {cover.customMessage && (
                      <div style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic', color: '#454a56' }}>
                        {cover.customMessage}
                      </div>
                    )}
                    <div style={{ fontSize: 10, marginTop: 4, color: '#454a56' }}>
                      {cover.propertyCount} propert{cover.propertyCount === 1 ? 'y' : 'ies'} &middot; {date}
                    </div>
                  </div>
                )}

                <div style={{ padding: `0 ${PAGE_PADDING_X_PX}px`, flex: 1 }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <colgroup>
                      {columns.map((c) => (
                        <col key={c.key} style={{ width: `${c.widthPct}%` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        {columns.map((c) => (
                          <th key={c.key} style={{ ...tableHeaderCellStyle, textAlign: c.key === 'index' ? 'left' : 'left' }}>
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {page.map((item, itemIndex) => {
                        if (item.type === 'groupHeader') {
                          return <GroupHeaderRow key={`gh-${itemIndex}`} label={item.label} colCount={columns.length} />;
                        }
                        runningIndex += 1;
                        return (
                          <PropertyRow
                            key={item.row.id}
                            index={runningIndex}
                            row={item.row}
                            layout={layout}
                            showContactNumber={showContactNumber}
                            showPrices={showPrices}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <PropertyShareFooter phone={footerPhone} pageNumber={pageIndex + 1} totalPages={pages.length} />
              </div>
            </div>
            {/* Screen-only visual gap between pages — pdfExport.ts captures each
                data-pdf-page node independently, so this has no effect on the PDF. */}
            {pageIndex < pages.length - 1 && (
              <div style={{ height: 20, borderBottom: '1px dashed #d1d5db', marginBottom: 20 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
