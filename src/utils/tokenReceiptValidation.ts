import { TokenReceiptDraft } from './tokenReceiptTypes';

export interface FieldIssue {
  field: string;
  message: string;
}

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

function isValidIndianMobile(raw: string): boolean {
  return INDIAN_MOBILE_RE.test(raw.replace(/\D/g, ''));
}

/** Blocking errors — Download/Print/Share are disabled while any exist. */
export function validateTokenReceipt(draft: TokenReceiptDraft): FieldIssue[] {
  const errors: FieldIssue[] = [];
  const isSale = draft.type === 'sale';

  const requireText = (value: string, field: string, label: string) => {
    if (!value.trim()) errors.push({ field, message: `${label} is required.` });
  };

  requireText(draft.receiptCode, 'receiptCode', 'Receipt code');
  requireText(draft.clientName, 'clientName', isSale ? "Buyer's name" : "Tenant's name");
  requireText(draft.contactNumber, 'contactNumber', 'Contact number');
  requireText(draft.propertyName, 'propertyName', 'Property name');
  requireText(draft.ownerName, 'ownerName', isSale ? "Seller's name" : "Owner's name");
  requireText(draft.executiveName, 'executiveName', 'Executive name');

  if (draft.contactNumber.trim() && !isValidIndianMobile(draft.contactNumber)) {
    errors.push({ field: 'contactNumber', message: 'Enter a valid 10-digit Indian mobile number.' });
  }

  if (!draft.bookingAmount || draft.bookingAmount <= 0) {
    errors.push({ field: 'bookingAmount', message: 'Booking amount must be greater than zero.' });
  }

  if (isSale) {
    if (draft.saleConsideration > 0 && draft.bookingAmount > draft.saleConsideration) {
      errors.push({ field: 'bookingAmount', message: 'Booking amount cannot exceed the sale consideration.' });
    }
  } else if (draft.deposit > 0 && draft.bookingAmount > draft.deposit) {
    errors.push({ field: 'bookingAmount', message: 'Booking amount cannot exceed the deposit.' });
  }

  if (draft.brokerageAmount > 0 && draft.brokerageReceived > draft.brokerageAmount) {
    errors.push({ field: 'brokerageReceived', message: 'Brokerage received cannot exceed the total brokerage amount.' });
  }

  if (draft.paymentMode !== 'cash' && !draft.referenceNo.trim()) {
    errors.push({ field: 'referenceNo', message: 'Reference number is required for non-cash payment modes.' });
  }

  return errors;
}

/** Non-blocking warnings — shown, but never prevent Download/Print/Share. */
export function warnTokenReceipt(draft: TokenReceiptDraft): FieldIssue[] {
  const warnings: FieldIssue[] = [];
  if (draft.type === 'rent' && draft.possessionDate && draft.date && draft.possessionDate < draft.date) {
    warnings.push({ field: 'possessionDate', message: 'Possession date is earlier than the receipt date.' });
  }
  return warnings;
}
