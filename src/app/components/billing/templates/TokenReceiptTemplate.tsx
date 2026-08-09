import React from 'react';
import { AmountInWordsBox } from '../AmountInWordsBox';
import { CategoryPill } from '../CategoryPill';
import { ContactLines } from '../ContactLines';
import { DocumentFooter } from '../DocumentFooter';
import { DocumentHeader } from '../DocumentHeader';
import { DocumentPage } from '../DocumentPage';
import { MUTED_LABEL, MUTED_TEXT } from '../designTokens';
import { LineItemsTable } from '../LineItemsTable';
import { SectionHeading } from '../SectionHeading';
import { TOKEN_RECEIPT_CONFIG } from '../../../../utils/tokenReceiptConfig';
import {
  formatDateDDMMYYYY,
  formatDateLongOrdinal,
  formatINRSlash,
  resolveBalanceDue,
  resolveBrokerageBalance,
  resolveDepositDue,
} from '../../../../utils/tokenReceiptCalculations';
import { amountInWords } from '../../../../utils/numberToWords';
import { MAINTENANCE_TERM_LABELS, PAYMENT_MODE_LABELS, TokenReceiptDraft } from '../../../../utils/tokenReceiptTypes';

interface TokenReceiptTemplateProps {
  draft: TokenReceiptDraft;
}

const eyebrowStyle: React.CSSProperties = { fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 };
const partyNameStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700 };

// Same letterhead and building blocks as SaleBookingTemplate / CommissionInvoiceTemplate /
// ServiceInvoiceTemplate — DocumentHeader, CategoryPill, LineItemsTable, DocumentFooter —
// laid out the same way those documents structure party info / financial tables /
// amount-in-words / signatures, rather than one flat "label, value" list of every
// field in document order (which read as an internal data dump, not a receipt).
export const TokenReceiptTemplate: React.FC<TokenReceiptTemplateProps> = ({ draft }) => {
  const isSale = draft.type === 'sale';
  const clientLabel = isSale ? 'Buyer' : 'Tenant';
  const ownerLabel = isSale ? 'Seller' : 'Owner';
  const displayDate = draft.date ? formatDateDDMMYYYY(draft.date) : '—';
  const hasBrokerage = draft.brokerageAmount > 0;

  const paymentRows = isSale
    ? [{ particular: 'Total Sale Consideration', amount: draft.saleConsideration ? formatINRSlash(draft.saleConsideration) : '—' }]
    : [
        { particular: 'Monthly Rent', amount: draft.monthlyRent ? formatINRSlash(draft.monthlyRent) : '—' },
        { particular: 'Security Deposit', amount: draft.deposit ? formatINRSlash(draft.deposit) : '—' },
        { particular: 'Maintenance', amount: MAINTENANCE_TERM_LABELS[draft.maintenanceTerm] },
      ];

  return (
    <DocumentPage>
      <DocumentHeader docTypeLabel="TOKEN RECEIPT" docNumber={draft.receiptCode} date={displayDate} gstApplicable={false} />

      <div style={{ padding: '24px 80px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CategoryPill label={isSale ? 'PROPERTY SALE · TOKEN' : 'RENTAL · TOKEN'} variant={isSale ? 'sale' : 'rental'} />
          <span style={{ fontSize: 12, color: MUTED_TEXT }}>Serial No: {draft.serialNo || '—'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
          <div>
            <div style={eyebrowStyle}>{clientLabel.toUpperCase()}</div>
            <div style={partyNameStyle}>{draft.clientName || '—'}</div>
            <ContactLines email={draft.email} mobile={draft.contactNumber} />
          </div>
          <div>
            <div style={eyebrowStyle}>PROPERTY</div>
            <div style={partyNameStyle}>
              {draft.propertyName || '—'}
              {draft.unitNo ? ` – Unit ${draft.unitNo}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
          <div>
            <div style={eyebrowStyle}>{ownerLabel.toUpperCase()}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{draft.ownerName || '—'}</div>
            <ContactLines mobile={draft.ownerContact} />
          </div>
          {(draft.executiveName || draft.executiveContact) && (
            <div>
              <div style={eyebrowStyle}>HANDLED BY</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{draft.executiveName || '—'}</div>
              <ContactLines mobile={draft.executiveContact} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <SectionHeading>Payment Details</SectionHeading>
          <LineItemsTable
            columns={[
              { key: 'particular', label: 'Particular' },
              { key: 'amount', label: 'Amount', align: 'right', width: '160px' },
            ]}
            rows={paymentRows}
            totalRow={{ label: 'Booking / Token Amount Received', value: draft.bookingAmount ? formatINRSlash(draft.bookingAmount) : '—' }}
          />
        </div>

        {draft.bookingAmount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <AmountInWordsBox>Booking amount received: {amountInWords(draft.bookingAmount)}.</AmountInWordsBox>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 16, fontSize: 12, color: MUTED_TEXT }}>
          {isSale ? (
            <>
              <div>Balance Due: <strong style={{ color: '#1f2430' }}>{formatINRSlash(resolveBalanceDue(draft))}</strong></div>
              {draft.agreementDate && <div>Agreement Date: {formatDateLongOrdinal(draft.agreementDate)}</div>}
              {draft.registrationDate && <div>Registration Date: {formatDateLongOrdinal(draft.registrationDate)}</div>}
            </>
          ) : (
            <>
              <div>Deposit Due: <strong style={{ color: '#1f2430' }}>{formatINRSlash(resolveDepositDue(draft))}</strong></div>
              {draft.possessionDate && <div>Possession Date: {formatDateLongOrdinal(draft.possessionDate)}</div>}
            </>
          )}
          <div>
            Payment Mode: {PAYMENT_MODE_LABELS[draft.paymentMode]}
            {draft.paymentMode !== 'cash' && draft.referenceNo ? ` (Ref: ${draft.referenceNo})` : ''}
          </div>
        </div>

        {hasBrokerage && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeading>Brokerage</SectionHeading>
            <LineItemsTable
              columns={[
                { key: 'particular', label: 'Particular' },
                { key: 'amount', label: 'Amount', align: 'right', width: '160px' },
              ]}
              rows={[
                { particular: 'Brokerage Amount', amount: formatINRSlash(draft.brokerageAmount) },
                { particular: 'Brokerage Received', amount: formatINRSlash(draft.brokerageReceived) },
              ]}
              totalRow={{ label: 'Brokerage Balance', value: formatINRSlash(resolveBrokerageBalance(draft)) }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16, fontSize: 12, color: MUTED_TEXT, background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
          <strong>Note:</strong> {TOKEN_RECEIPT_CONFIG.footerNote(clientLabel)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 'auto', paddingTop: 40, alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2430' }}>{clientLabel}</div>
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1f2430' }}>
            {TOKEN_RECEIPT_CONFIG.companyName}
            {TOKEN_RECEIPT_CONFIG.stampImage && (
              <img src={TOKEN_RECEIPT_CONFIG.stampImage} alt="Company stamp" style={{ height: 60, margin: '4px auto', display: 'block' }} />
            )}
          </div>
        </div>
      </div>
      <DocumentFooter pageNumber={1} totalPages={1} />
    </DocumentPage>
  );
};
