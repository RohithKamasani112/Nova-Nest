import React from 'react';
import { CategoryPill } from '../CategoryPill';
import { DocumentFooter } from '../DocumentFooter';
import { DocumentHeader } from '../DocumentHeader';
import { DocumentPage } from '../DocumentPage';
import { MUTED_LABEL, MUTED_TEXT } from '../designTokens';
import { LineItemsTable } from '../LineItemsTable';
import { TOKEN_RECEIPT_CONFIG } from '../../../../utils/tokenReceiptConfig';
import { formatDateDDMMYYYY } from '../../../../utils/tokenReceiptCalculations';
import { buildReceiptRows } from '../../../../utils/tokenReceiptRows';
import { TokenReceiptDraft } from '../../../../utils/tokenReceiptTypes';

interface TokenReceiptTemplateProps {
  draft: TokenReceiptDraft;
}

// Same letterhead and building blocks as SaleBookingTemplate / CommissionInvoiceTemplate /
// ServiceInvoiceTemplate — DocumentHeader, CategoryPill, LineItemsTable, DocumentFooter —
// not a new visual design, just Token Receipt's own content in that same shape.
export const TokenReceiptTemplate: React.FC<TokenReceiptTemplateProps> = ({ draft }) => {
  const rows = buildReceiptRows(draft);
  const isSale = draft.type === 'sale';
  const clientLabel = isSale ? 'Buyer' : 'Tenant';
  const displayDate = draft.date ? formatDateDDMMYYYY(draft.date) : '—';

  return (
    <DocumentPage>
      <DocumentHeader docTypeLabel="TOKEN RECEIPT" docNumber={draft.receiptCode} date={displayDate} gstApplicable={false} />

      <div style={{ padding: '24px 40px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CategoryPill label={isSale ? 'PROPERTY SALE · TOKEN' : 'RENTAL · TOKEN'} variant={isSale ? 'sale' : 'rental'} />
          <span style={{ fontSize: 12, color: MUTED_TEXT }}>Serial No: {draft.serialNo || '—'}</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>{clientLabel.toUpperCase()}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{draft.clientName || '—'}</div>
        </div>

        <LineItemsTable
          columns={[
            { key: 'no', label: draft.receiptCode || '—', align: 'left', width: '50px' },
            { key: 'label', label: 'Particulars', align: 'left', width: '38%' },
            { key: 'value', label: 'Details', align: 'left' },
          ]}
          rows={rows.map((row, index) => ({
            no: index + 1,
            label: row.label,
            value: row.value || '—',
          }))}
        />

        <div style={{ marginTop: 16, marginBottom: 16, fontSize: 12, color: MUTED_TEXT, background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
          <strong>Note:</strong> {TOKEN_RECEIPT_CONFIG.footerNote(clientLabel)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 'auto', paddingTop: 56 }}>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: MUTED_TEXT }}>
            {clientLabel} Signature
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: MUTED_TEXT }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#1f2430' }}>For {TOKEN_RECEIPT_CONFIG.companyName}</div>
            {TOKEN_RECEIPT_CONFIG.stampImage && (
              <img src={TOKEN_RECEIPT_CONFIG.stampImage} alt="Company stamp" style={{ height: 60, margin: '4px auto' }} />
            )}
            <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, marginTop: TOKEN_RECEIPT_CONFIG.stampImage ? 0 : 44 }}>
              Authorized Proprietor
            </div>
          </div>
        </div>
      </div>
      <DocumentFooter pageNumber={1} totalPages={1} />
    </DocumentPage>
  );
};
