import React from 'react';
import { ServiceDoc } from '../../../../types';
import { formatINR } from '../../../../utils/billingCalculations';
import { AmountInWordsBox } from '../AmountInWordsBox';
import { CategoryPill } from '../CategoryPill';
import { DocumentFooter } from '../DocumentFooter';
import { DocumentHeader } from '../DocumentHeader';
import { DocumentPage } from '../DocumentPage';
import { LineItemsTable } from '../LineItemsTable';
import { SectionHeading } from '../SectionHeading';
import { TotalsBlock } from '../TotalsBlock';

export type ServiceTemplateData = Omit<ServiceDoc, 'id' | 'createdAt' | 'pdfUrl'>;

interface ServiceInvoiceTemplateProps {
  doc: ServiceTemplateData;
}

const formatDisplayDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Single-page home maintenance / repair service invoice with a dynamic,
// unlimited-length line-items table and optional GST.
export const ServiceInvoiceTemplate: React.FC<ServiceInvoiceTemplateProps> = ({ doc }) => {
  const { computed } = doc;
  const displayDate = formatDisplayDate(doc.docDate);

  return (
    <DocumentPage>
      <DocumentHeader docTypeLabel="SERVICE INVOICE" docNumber={doc.docNumber} date={displayDate} />
      <div style={{ padding: '24px 40px', flex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <CategoryPill label="HOME MAINTENANCE & REPAIR" variant="service" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#8b8f9e', letterSpacing: 1.5, marginBottom: 6 }}>BILLED TO</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.customerName || '—'}</div>
          <div style={{ fontSize: 13, color: '#5a5f70', whiteSpace: 'pre-line' }}>{doc.customerAddress || '—'}</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <SectionHeading>Home Expenses</SectionHeading>
          <LineItemsTable
            columns={[
              { key: 'description', label: 'Item' },
              { key: 'amount', label: 'Amount (₹)', align: 'right', width: '160px' },
            ]}
            rows={doc.lineItems.map((item) => ({
              description: item.description || '—',
              amount: formatINR(item.amount),
            }))}
            totalRow={{
              label: doc.gstEnabled ? 'Subtotal' : 'Total Home Expenses',
              value: formatINR(computed.subtotal),
            }}
          />
          {doc.gstEnabled && (
            <TotalsBlock
              rows={[
                { label: `CGST @ ${doc.cgstPct}%`, value: formatINR(computed.cgstAmount) },
                { label: `SGST @ ${doc.sgstPct}%`, value: formatINR(computed.sgstAmount) },
                { label: 'Total Payable', value: formatINR(computed.total) },
              ]}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <AmountInWordsBox>{computed.amountInWords}</AmountInWordsBox>
        </div>

        <div style={{ fontSize: 12, color: '#5a5f70', background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
          <strong>Note:</strong> Charges cover materials and labour for the listed maintenance work carried out at
          the property. Please retain this invoice for your records.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: '#5a5f70' }}>
            Received By (Client)
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
