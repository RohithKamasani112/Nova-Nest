import React from 'react';
import { ServiceDoc } from '../../../../types';
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

  const title = doc.gstApplicable ? DOC_TITLES.service.withGst : DOC_TITLES.service.withoutGst;

  return (
    <DocumentPage>
      <DocumentHeader docTypeLabel={title} docNumber={doc.docNumber} date={displayDate} gstApplicable={doc.gstApplicable} />
      <div style={{ padding: '24px 40px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <CategoryPill label="HOME MAINTENANCE & REPAIR" variant="service" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>BILLED TO</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.customerName || '—'}</div>
          <div style={{ fontSize: 13, color: MUTED_TEXT, whiteSpace: 'pre-line' }}>{doc.customerAddress || '—'}</div>
          <ContactLines email={doc.customerEmail} mobile={doc.customerMobile} />
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
            totalRow={
              doc.gstApplicable
                ? { label: 'Subtotal', value: formatINR(computed.subtotal) }
                : { label: 'Total', value: formatINR(computed.total) }
            }
          />
          {doc.gstApplicable && (
            <TotalsBlock
              rows={[
                { label: `CGST @ ${doc.cgstPct}%`, value: formatINR(computed.cgstAmount) },
                { label: `SGST @ ${doc.sgstPct}%`, value: formatINR(computed.sgstAmount) },
                { label: 'Total Payable (incl. GST)', value: formatINR(computed.total) },
              ]}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <AmountInWordsBox>{computed.amountInWords}</AmountInWordsBox>
        </div>

        <div style={{ fontSize: 12, color: MUTED_TEXT, background: '#f7f7f9', padding: '12px 16px', borderRadius: 6 }}>
          <strong>Note:</strong> Charges cover materials and labour for the listed maintenance work carried out at
          the property. Please retain this invoice for your records.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: MUTED_TEXT }}>
            Received By (Client)
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
