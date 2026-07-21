import React from 'react';
import { CommissionDoc } from '../../../../types';
import { formatINR } from '../../../../utils/billingCalculations';
import { AmountInWordsBox } from '../AmountInWordsBox';
import { CategoryPill } from '../CategoryPill';
import { DocumentFooter } from '../DocumentFooter';
import { DocumentHeader } from '../DocumentHeader';
import { DocumentPage } from '../DocumentPage';
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

  return (
    <DocumentPage>
      <DocumentHeader
        docTypeLabel={isRental ? 'TAX INVOICE – RENTAL BROKERAGE' : 'TAX INVOICE – COMMISSION'}
        docNumber={doc.docNumber}
        date={displayDate}
      />
      <div style={{ padding: '24px 40px', flex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <CategoryPill
            label={isRental ? 'RENTAL BROKERAGE · GST INVOICE' : 'SALE BROKERAGE · GST INVOICE'}
            variant={isRental ? 'rental' : 'commission'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: '#8b8f9e', letterSpacing: 1.5, marginBottom: 6 }}>{partyLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.clientName || '—'}</div>
            <div style={{ fontSize: 13, color: '#5a5f70', whiteSpace: 'pre-line' }}>{doc.clientAddress || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8b8f9e', letterSpacing: 1.5, marginBottom: 6 }}>PROPERTY</div>
            <div style={{ fontSize: 13, color: '#5a5f70', whiteSpace: 'pre-line' }}>{doc.propertyAddress || '—'}</div>
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
          />
          <TotalsBlock
            rows={[
              { label: 'Taxable Amount', value: formatINR(doc.taxableAmount) },
              { label: `CGST @ ${doc.cgstPct}%`, value: formatINR(computed.cgstAmount) },
              { label: `SGST @ ${doc.sgstPct}%`, value: formatINR(computed.sgstAmount) },
              { label: 'Total Payable', value: formatINR(computed.totalPayable) },
            ]}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <AmountInWordsBox>{computed.amountInWords}</AmountInWordsBox>
        </div>

        {doc.paymentTerms.trim() && (
          <div style={{ fontSize: 12, color: '#5a5f70', background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
            <strong>Payment terms:</strong> {doc.paymentTerms}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: '#5a5f70' }}>
            {isRental ? 'Tenant Signature' : 'Client Signature'}
          </div>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, textAlign: 'center', fontSize: 13, color: '#5a5f70' }}>
            For Nova Nest Property Management
          </div>
        </div>
      </div>
      <DocumentFooter pageNumber={1} totalPages={1} />
    </DocumentPage>
  );
};
