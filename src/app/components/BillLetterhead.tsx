import React from 'react';
import { Bill } from '../../types';
import { BUSINESS_ADDRESS, BUSINESS_PHONE } from '../../utils/siteSettings';
import companyLogo from '../../assets/companyLogo.png';

// Everything the letterhead needs to render — either a saved Bill or the
// in-progress draft from the form (same shape, minus id/createdAt/pdfUrl).
export type BillLetterheadData = Pick<
  Bill,
  | 'receiptNo'
  | 'clientName'
  | 'clientContact'
  | 'propertyTitle'
  | 'propertyLocation'
  | 'transactionType'
  | 'totalAmount'
  | 'amountPaid'
  | 'paymentMode'
  | 'paymentDate'
  | 'moveInDate'
  | 'finalPaymentDueDate'
>;

interface BillLetterheadProps {
  bill: BillLetterheadData;
}

const formatINR = (value: number): string => `Rs. ${Math.round(value || 0).toLocaleString('en-IN')}`;

const formatDisplayDate = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAYMENT_MODE_LABEL: Record<Bill['paymentMode'], string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
};

// Browsers strip background colors/images in print by default; this makes the
// navy header and the faint watermark survive an actual print/PDF export.
const printColorAdjust: React.CSSProperties = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
} as React.CSSProperties;

// Plain inline styles throughout (not Tailwind classes) — this is rasterized
// by html2canvas for the downloadable PDF, and hardcoded hex/rgb/mm values
// are reproduced far more reliably there than CSS-variable-driven utility
// classes. The container is sized to true A4 (210mm x 297mm) so the on-screen
// admin preview and the generated PDF are pixel-for-pixel the same page.
export const BillLetterhead = React.forwardRef<HTMLDivElement, BillLetterheadProps>(({ bill }, ref) => {
  const remaining = bill.totalAmount - bill.amountPaid;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const paymentRows: Array<[string, string]> = [
    ['Transaction Type', bill.transactionType === 'sale' ? 'Sale' : 'Rent'],
    ['Total Amount', formatINR(bill.totalAmount)],
    ['Amount Paid', formatINR(bill.amountPaid)],
    ['Payment Mode', PAYMENT_MODE_LABEL[bill.paymentMode]],
    ['Payment Date', formatDisplayDate(bill.paymentDate)],
    ['Remaining Balance', formatINR(remaining)],
  ];

  return (
    <div
      ref={ref}
      style={{
        ...printColorAdjust,
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif",
        background: '#ffffff',
        color: '#1f2430',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header / letterhead */}
      <div style={{ ...printColorAdjust, background: '#0a0e27', padding: '36px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: '#f5e6c8',
                borderRadius: 10,
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img src={companyLogo} alt="Nova Nest" style={{ height: 62, width: 'auto', display: 'block' }} />
            </div>
            <div>
              <div style={{ color: '#f5e6c8', fontFamily: "'Playfair Display', serif", fontSize: 24, letterSpacing: 0.5 }}>
                Nova Nest
              </div>
              <div style={{ color: '#c9a04a', fontSize: 11, letterSpacing: 2 }}>PROPERTY MANAGEMENT</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#cfd3e6', fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ color: '#f5e6c8', fontSize: 15, marginBottom: 4 }}>PAYMENT RECEIPT</div>
            <div>Receipt No: {bill.receiptNo}</div>
            <div>Date: {today}</div>
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            borderTop: '0.5px solid rgba(245,230,200,0.25)',
            paddingTop: 14,
            color: '#9ba0c0',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {BUSINESS_ADDRESS}
          <br />
          Phone: {BUSINESS_PHONE}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', padding: '18mm 16mm', minHeight: 'calc(297mm - 170px)' }}>
        {/* Watermark — kept clear of the signature zone at the bottom */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'calc(100% - 170px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 88,
              color: 'rgba(10, 14, 39, 0.05)',
              whiteSpace: 'nowrap',
              transform: 'rotate(-35deg)',
              letterSpacing: 4,
            }}
          >
            NOVA NEST
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8b8f9e', letterSpacing: 1, marginBottom: 6 }}>BILLED TO</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{bill.clientName || '—'}</div>
              <div style={{ fontSize: 15, color: '#5a5f70' }}>{bill.clientContact || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8b8f9e', letterSpacing: 1, marginBottom: 6 }}>PROPERTY</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{bill.propertyTitle || '—'}</div>
              <div style={{ fontSize: 15, color: '#5a5f70' }}>{bill.propertyLocation || '—'}</div>
            </div>
          </div>

          {/* Payment details table */}
          <div style={{ marginTop: 36, borderTop: '1px solid #e5e7eb', paddingTop: 4 }}>
            {paymentRows.map(([label, value], index) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '13px 0',
                  borderBottom: index < paymentRows.length - 1 ? '1px solid #f0f1f4' : 'none',
                  fontSize: 15,
                }}
              >
                <span style={{ color: '#5a5f70' }}>{label}</span>
                <span
                  style={{
                    fontWeight: label === 'Remaining Balance' ? 700 : 500,
                    color: label === 'Remaining Balance' ? '#0a0e27' : '#1f2430',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Key dates */}
          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, color: '#8b8f9e', letterSpacing: 1, marginBottom: 6 }}>
                MOVE-IN / POSSESSION DATE
              </div>
              <div style={{ fontSize: 15 }}>{formatDisplayDate(bill.moveInDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8b8f9e', letterSpacing: 1, marginBottom: 6 }}>
                FINAL PAYMENT DUE DATE
              </div>
              <div style={{ fontSize: 15 }}>{formatDisplayDate(bill.finalPaymentDueDate)}</div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, textAlign: 'center', fontSize: 13, color: '#5a5f70' }}>
              Client Signature
            </div>
            <div style={{ borderTop: '1px solid #b7bac4', paddingTop: 10, textAlign: 'center', fontSize: 13, color: '#5a5f70' }}>
              Authorized Signatory (Nova Nest)
            </div>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#9ba0ac' }}>
            This is a system-generated receipt. Please retain a copy for your records.
          </div>
        </div>
      </div>
    </div>
  );
});

BillLetterhead.displayName = 'BillLetterhead';
