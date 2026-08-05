import React from 'react';
import { CommissionDoc } from '../../../../types';
import { formatINR } from '../../../../utils/billingCalculations';
import { DOC_TITLES } from '../../../../utils/billingDefaults';
import { AmountInWordsBox } from '../AmountInWordsBox';
import { CategoryPill } from '../CategoryPill';
import { DocumentFooter } from '../DocumentFooter';
import { DocumentHeader } from '../DocumentHeader';
import { DocumentPage } from '../DocumentPage';
import { ContactLines } from '../ContactLines';
import { MUTED_LABEL, MUTED_TEXT } from '../designTokens';
import { LineItemsTable } from '../LineItemsTable';
import { SectionHeading } from '../SectionHeading';
import { TotalsBlock } from '../TotalsBlock';

export type CommissionTemplateData = Omit<CommissionDoc, 'id' | 'createdAt' | 'pdfUrl'>;

interface CommissionInvoiceTemplateProps {
  doc: CommissionTemplateData;
}

const formatDisplayDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Single-page GST tax invoice, shared by both the Sale Commission and Rental
// Commission picker tiles — same layout and math, only labels/pill color
// change with `transactionType`.
export const CommissionInvoiceTemplate: React.FC<CommissionInvoiceTemplateProps> = ({ doc }) => {
  const { computed } = doc;
  const isRental = doc.transactionType === 'rental';
  const displayDate = formatDisplayDate(doc.docDate);
  const partyLabel = isRental ? 'TENANT' : 'BILLED TO';
  const chargeDescription = isRental
    ? 'Brokerage – rental agreement facilitation'
    : 'Real estate brokerage / agent commission – sale transaction';
  const titles = isRental ? DOC_TITLES.commission_rental : DOC_TITLES.commission_sale;
  const title = doc.gstApplicable ? titles.withGst : titles.withoutGst;
  const pillBase = isRental ? 'RENTAL BROKERAGE' : 'SALE BROKERAGE';

  return (
    <DocumentPage>
      <DocumentHeader docTypeLabel={title} docNumber={doc.docNumber} date={displayDate} gstApplicable={doc.gstApplicable} />
      <div style={{ padding: '24px 40px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <CategoryPill
            label={doc.gstApplicable ? `${pillBase} · GST INVOICE` : pillBase}
            variant={isRental ? 'rental' : 'commission'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>{partyLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.clientName || '—'}</div>
            <div style={{ fontSize: 13, color: MUTED_TEXT, whiteSpace: 'pre-line' }}>{doc.clientAddress || '—'}</div>
            <ContactLines email={doc.clientEmail} mobile={doc.clientMobile} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>PROPERTY</div>
            <div style={{ fontSize: 13, color: MUTED_TEXT, whiteSpace: 'pre-line' }}>{doc.propertyAddress || '—'}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <SectionHeading>Charges</SectionHeading>
          <LineItemsTable
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'amount', label: 'Amount (₹)', align: 'right', width: '160px' },
            ]}
            rows={[{ description: chargeDescription, amount: formatINR(doc.taxableAmount) }]}
            totalRow={doc.gstApplicable ? undefined : { label: 'Total', value: formatINR(doc.taxableAmount) }}
          />
          {doc.gstApplicable && (
            <TotalsBlock
              rows={[
                { label: 'Taxable Amount', value: formatINR(doc.taxableAmount) },
                { label: `CGST @ ${doc.cgstPct}%`, value: formatINR(computed.cgstAmount) },
                { label: `SGST @ ${doc.sgstPct}%`, value: formatINR(computed.sgstAmount) },
                { label: 'Total Payable (incl. GST)', value: formatINR(computed.totalPayable) },
              ]}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <AmountInWordsBox>{computed.amountInWords}</AmountInWordsBox>
        </div>

        {doc.paymentTerms.trim() && (
          <div style={{ fontSize: 12, color: MUTED_TEXT, background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
            <strong>Payment terms:</strong> {doc.paymentTerms}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: MUTED_TEXT }}>
            {isRental ? 'Tenant Signature' : 'Client Signature'}
          </div>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, textAlign: 'center', fontSize: 13, color: MUTED_TEXT }}>
            For Nova Nest Property Management
          </div>
        </div>
      </div>
      <DocumentFooter pageNumber={1} totalPages={1} />
    </DocumentPage>
  );
};
