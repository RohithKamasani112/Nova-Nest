import React from 'react';
import { ClientFacingPropertyRow } from '../../../utils/propertyShareFields';
import {
  formatBhkLabel,
  formatCurrencyOrDash,
  formatFloorLabel,
  formatFurnishing,
  formatGated,
  formatTenantPreference,
  formatAvailability,
  titleCase,
  MISSING,
} from '../../../utils/propertyShareFormat';
import { PORTRAIT_COLUMNS, LANDSCAPE_COLUMNS } from '../../../utils/propertyShareLayout';

// A genuinely lighter grey than the billing generator's MUTED_TEXT — that
// token was darkened for a print-contrast complaint on financial documents;
// this second line is deliberately secondary/grey by design (spec: "small
// grey text"), not a contrast problem to fix. Still clears WCAG AA (~4.6:1).
const DETAIL_GREY = '#6b7280';

interface PropertyRowProps {
  index: number; // 1-based, printed in the # column
  row: ClientFacingPropertyRow;
  layout: 'portrait' | 'landscape';
  showContactNumber: boolean; // false when every selected property shares one number (footer-only, per spec)
  showPrices: boolean; // config toggle — off hides price/deposit/maintenance figures
}

const cellStyle: React.CSSProperties = { padding: '6px 8px', fontSize: 9, verticalAlign: 'top' };
const dividerStyle: React.CSSProperties = { borderBottom: '1px solid #e5e7eb' };

function detailSegments(row: ClientFacingPropertyRow, showContactNumber: boolean): string[] {
  const segments: string[] = [];
  segments.push(`${row.bathrooms} Bath${row.bathrooms === 1 ? '' : 's'}`);
  if (row.facingDirection) segments.push(`${row.facingDirection} Facing`);
  segments.push(formatGated(row.gated));
  const tenantLabel = formatTenantPreference(row.tenantPreference);
  if (tenantLabel !== MISSING) segments.push(tenantLabel);
  segments.push(formatAvailability(row.availableFrom, row.possessionStatus));
  if (showContactNumber) segments.push(`📞 ${row.contactNumber}`);
  return segments;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({ index, row, layout, showContactNumber, showPrices }) => {
  const nameCell = (
    <td style={{ ...cellStyle, fontWeight: 500, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
      {titleCase(row.title)}
    </td>
  );
  const priceCell = showPrices ? formatCurrencyOrDash(row.price) : MISSING;
  const depositCell = showPrices ? formatCurrencyOrDash(row.securityDeposit) : MISSING;
  const maintenanceCell = showPrices ? formatCurrencyOrDash(row.maintenanceCharges) : MISSING;

  if (layout === 'landscape') {
    return (
      <tr style={dividerStyle}>
        <td style={{ ...cellStyle, fontVariantNumeric: 'tabular-nums' }}>{index}</td>
        {nameCell}
        <td style={cellStyle}>{formatBhkLabel(row.bedrooms)}</td>
        <td style={cellStyle}>{row.bathrooms}</td>
        <td style={cellStyle}>{priceCell}</td>
        <td style={cellStyle}>{depositCell}</td>
        <td style={cellStyle}>{maintenanceCell}</td>
        <td style={cellStyle}>{row.areaSqft || MISSING}</td>
        <td style={cellStyle}>{formatFurnishing(row.furnishingStatus)}</td>
        <td style={{ ...cellStyle, overflowWrap: 'break-word' }}>{titleCase(row.location)}</td>
        <td style={cellStyle}>{formatFloorLabel(row.floorNumber)}</td>
        <td style={cellStyle}>{row.facingDirection ?? MISSING}</td>
        <td style={cellStyle}>{formatGated(row.gated)}</td>
        <td style={cellStyle}>{formatTenantPreference(row.tenantPreference)}</td>
        <td style={cellStyle}>{formatAvailability(row.availableFrom, row.possessionStatus)}</td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td style={cellStyle}>{index}</td>
        {nameCell}
        <td style={cellStyle}>{formatBhkLabel(row.bedrooms)}</td>
        <td style={cellStyle}>{priceCell}</td>
        <td style={cellStyle}>{depositCell}</td>
        <td style={cellStyle}>{maintenanceCell}</td>
        <td style={cellStyle}>{row.areaSqft || MISSING}</td>
        <td style={cellStyle}>{formatFurnishing(row.furnishingStatus)}</td>
        <td style={{ ...cellStyle, overflowWrap: 'break-word' }}>{titleCase(row.location)}</td>
        <td style={cellStyle}>{formatFloorLabel(row.floorNumber)}</td>
      </tr>
      <tr style={dividerStyle}>
        <td />
        <td colSpan={PORTRAIT_COLUMNS.length - 1} style={{ padding: '0 8px 6px', fontSize: 7.5, color: DETAIL_GREY }}>
          {detailSegments(row, showContactNumber).join(' · ')}
        </td>
      </tr>
    </>
  );
};

export { PORTRAIT_COLUMNS, LANDSCAPE_COLUMNS };
