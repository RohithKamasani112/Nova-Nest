import React from 'react';
import { SaleBookingDoc } from '../../../../types';
import { formatINR, numberToIndianWords } from '../../../../utils/billingCalculations';
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

export type SaleBookingTemplateData = Omit<SaleBookingDoc, 'id' | 'createdAt' | 'pdfUrl'>;

interface SaleBookingTemplateProps {
  doc: SaleBookingTemplateData;
}

const formatDisplayDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// 2-page Property Sale Booking Confirmation. Page 1 = parties + Payment
// Details / Govt Charges / Commission tables; page 2 = Terms & Conditions,
// Declaration, signatures. Both pages are DocumentPage instances (each
// data-pdf-page-marked), so pdfExport.ts renders this as a real 2-page PDF.
export const SaleBookingTemplate: React.FC<SaleBookingTemplateProps> = ({ doc }) => {
  const { computed } = doc;
  const displayDate = formatDisplayDate(doc.docDate);
  const title = doc.gstApplicable ? DOC_TITLES.sale_booking.withGst : DOC_TITLES.sale_booking.withoutGst;

  return (
    <div>
      {/* Page 1 */}
      <DocumentPage>
        <DocumentHeader docTypeLabel={title} docNumber={doc.docNumber} date={displayDate} gstApplicable={doc.gstApplicable} />
        <div style={{ padding: '24px 40px', flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <CategoryPill label="PROPERTY SALE" variant="sale" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>PURCHASER</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.purchaserName || '—'}</div>
              <div style={{ fontSize: 13, color: MUTED_TEXT, whiteSpace: 'pre-line' }}>
                {doc.purchaserAddress || '—'}
              </div>
              <ContactLines email={doc.purchaserEmail} mobile={doc.purchaserMobile} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED_LABEL, letterSpacing: 1.5, marginBottom: 6 }}>PROPERTY</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {doc.projectName || '—'}
                {doc.unitNo ? ` – Unit ${doc.unitNo}` : ''}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <SectionHeading number="4.">Payment Details</SectionHeading>
            <LineItemsTable
              columns={[
                { key: 'particular', label: 'Particular' },
                { key: 'amount', label: 'Amount (₹)', align: 'right', width: '160px' },
              ]}
              rows={[
                { particular: 'Token Advance (Received)', amount: formatINR(doc.tokenAmount) },
                { particular: 'Balance After Token', amount: formatINR(computed.balanceAfterToken) },
                { particular: 'Amount Payable at Sale Agreement', amount: formatINR(doc.saleAgreementAmount) },
                {
                  particular: `${doc.milestonePct}% Milestone Payment`,
                  amount: formatINR(computed.milestoneAmount),
                },
                { particular: 'Balance After Milestone Payment', amount: formatINR(computed.balanceAfterMilestone) },
                {
                  particular: doc.tdsEnabled ? `TDS Applicable (${doc.tdsPct}%)` : 'TDS Not Applicable',
                  amount: formatINR(computed.tdsAmount),
                },
              ]}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <SectionHeading number="5.">Government Charges &amp; Registration Details</SectionHeading>
            <LineItemsTable
              columns={[
                { key: 'particular', label: 'Particular' },
                { key: 'rate', label: 'Rate', align: 'right', width: '90px' },
                { key: 'amount', label: 'Amount (₹)', align: 'right', width: '150px' },
              ]}
              rows={[
                {
                  particular: 'Stamp Duty',
                  rate: `${doc.stampDutyPct}%`,
                  amount: formatINR(computed.stampDutyAmount),
                },
                {
                  particular: `Sale Agreement Charges (incl. additional fee ${formatINR(doc.additionalFee)})`,
                  rate: `${doc.saleAgreementChargesPct}%`,
                  amount: formatINR(computed.saleAgreementChargesAmount),
                },
                {
                  particular: 'Registration Charges',
                  rate: `${doc.registrationChargesPct}%`,
                  amount: formatINR(computed.registrationChargesAmount),
                },
                {
                  particular: 'Registration Incident Charges',
                  rate: '—',
                  amount: formatINR(doc.registrationIncidentCharges),
                },
              ]}
              totalRow={{ label: 'Total Government Charges', value: formatINR(computed.totalGovtCharges) }}
            />
          </div>

          <div>
            <SectionHeading number="6.">Commission Details</SectionHeading>
            <LineItemsTable
              columns={[
                { key: 'particular', label: 'Particular' },
                { key: 'rate', label: 'Rate', align: 'right', width: '90px' },
                { key: 'amount', label: 'Amount (₹)', align: 'right', width: '150px' },
              ]}
              rows={[
                {
                  particular: 'Brokerage / Commission Charges on Sale Price',
                  rate: `${doc.commissionPct}%`,
                  amount: formatINR(computed.commissionAmount),
                },
                ...(doc.gstApplicable
                  ? [
                      {
                        particular: 'GST on Commission',
                        rate: `${doc.commissionGstPct}%`,
                        amount: formatINR(computed.commissionGstAmount),
                      },
                    ]
                  : []),
              ]}
              totalRow={{
                label: doc.gstApplicable ? 'Total Commission Payable (incl. GST)' : 'Total Commission Payable',
                value: formatINR(computed.totalCommissionPayable),
              }}
            />
          </div>
        </div>
        <DocumentFooter pageNumber={1} totalPages={2} />
      </DocumentPage>

      {/* Visible gap + boundary between pages on screen only — each
          DocumentPage is captured independently by pdfExport.ts, so this
          spacer has no effect on the exported PDF. */}
      <div style={{ height: 24, borderBottom: '1px dashed #d1d5db', marginBottom: 24 }} />

      {/* Page 2 */}
      <DocumentPage>
        <div style={{ padding: '32px 40px', flex: 1, position: 'relative', zIndex: 1 }}>
          <SectionHeading number="7.">Terms &amp; Conditions</SectionHeading>
          <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: '#1f2430', marginBottom: 28 }}>
            {doc.termsAndConditions.map((clause, index) => (
              <li key={index} style={{ marginBottom: 8 }}>
                {clause}
              </li>
            ))}
          </ol>

          <SectionHeading>Declaration</SectionHeading>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#1f2430', marginBottom: 56 }}>
            We hereby acknowledge receipt of the token advance and confirm provisional allotment of the
            above-mentioned unit, subject to fulfillment of all terms and conditions stated herein.
          </p>

          <AmountInWordsBox>
            Token advance received: {numberToIndianWords(doc.tokenAmount)}.
          </AmountInWordsBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 64 }}>
            <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, fontSize: 13, color: MUTED_TEXT }}>
              Purchaser Signature
              <div style={{ marginTop: 4 }}>Name: {doc.purchaserName || '—'}</div>
            </div>
            <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, textAlign: 'center', fontSize: 13, color: MUTED_TEXT }}>
              Authorized Signatory – Nova Nest
            </div>
          </div>

          <div style={{ marginTop: 24, fontSize: 12, color: MUTED_TEXT }}>{doc.place}, {displayDate}</div>
        </div>
        <DocumentFooter pageNumber={2} totalPages={2} />
      </DocumentPage>
    </div>
  );
};
