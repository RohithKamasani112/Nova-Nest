import React from 'react';
import { CREAM, NAVY_DARK, printColorAdjust } from './designTokens';

export interface LineItemsColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export interface LineItemsTotalRow {
  label: string;
  value: string;
}

interface LineItemsTableProps {
  columns: LineItemsColumn[];
  rows: Array<Record<string, React.ReactNode>>;
  totalRow?: LineItemsTotalRow;
}

// Generic invoice-line table — cream header row / navy text, used for every
// tabular section across the 3 billing templates (Payment Details, Govt
// Charges, Commission Details, Charges, Home Expenses). An optional bold,
// navy-top-ruled total row covers the "Total Government Charges" /
// "Total Commission Payable" / "Total Home Expenses" style footers.
export const LineItemsTable: React.FC<LineItemsTableProps> = ({ columns, rows, totalRow }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
    <thead>
      <tr style={{ ...printColorAdjust, background: CREAM }}>
        {columns.map((col) => (
          <th
            key={col.key}
            style={{
              textAlign: col.align || 'left',
              color: NAVY_DARK,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '10px 12px',
              width: col.width,
            }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, index) => (
        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
          {columns.map((col) => (
            <td
              key={col.key}
              style={{
                textAlign: col.align || 'left',
                padding: '10px 12px',
                color: '#1f2430',
                verticalAlign: 'top',
              }}
            >
              {row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
    {totalRow && (
      <tfoot>
        <tr>
          <td
            colSpan={Math.max(columns.length - 1, 1)}
            style={{
              textAlign: 'right',
              padding: '12px',
              fontWeight: 700,
              color: NAVY_DARK,
              borderTop: `2px solid ${NAVY_DARK}`,
            }}
          >
            {totalRow.label}
          </td>
          <td
            style={{
              textAlign: columns[columns.length - 1]?.align || 'right',
              padding: '12px',
              fontWeight: 700,
              color: NAVY_DARK,
              borderTop: `2px solid ${NAVY_DARK}`,
            }}
          >
            {totalRow.value}
          </td>
        </tr>
      </tfoot>
    )}
  </table>
);
