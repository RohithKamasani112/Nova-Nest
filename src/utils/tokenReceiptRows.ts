import { amountInWords } from './numberToWords';
import {
  formatBrokerageBalance,
  formatDateLongOrdinal,
  formatINRSlash,
  resolveBalanceDue,
  resolveDepositDue,
} from './tokenReceiptCalculations';
import { MAINTENANCE_TERM_LABELS, PAYMENT_MODE_LABELS, TokenReceiptDraft } from './tokenReceiptTypes';

export interface ReceiptRow {
  label: string;
  value: string;
  /** Prints as a blank row even when value is empty — currently only Mail Id. */
  alwaysShow?: boolean;
}

/**
 * Builds the receipt table's rows in print order, already filtered down to
 * what actually prints. Row numbers are assigned by the caller as the 1-based
 * index into this returned (already-filtered) array — so a hidden empty
 * field never leaves a gap, and everything below it renumbers automatically.
 */
export function buildReceiptRows(draft: TokenReceiptDraft): ReceiptRow[] {
  const isSale = draft.type === 'sale';
  const rows: ReceiptRow[] = [];

  rows.push({ label: isSale ? "Buyer's Name" : 'Tenant Name', value: draft.clientName });
  rows.push({ label: 'Contact Number', value: draft.contactNumber });
  rows.push({ label: 'Mail Id', value: draft.email, alwaysShow: true });
  rows.push({ label: 'Property Name & Unit', value: [draft.propertyName, draft.unitNo].filter(Boolean).join(', ') });
  rows.push({ label: 'Booking Amount', value: draft.bookingAmount ? formatINRSlash(draft.bookingAmount) : '' });
  rows.push({ label: 'Amount in Words', value: draft.bookingAmount ? amountInWords(draft.bookingAmount) : '' });
  rows.push({ label: isSale ? "Seller's Name" : "Owner's Name", value: draft.ownerName });
  rows.push({ label: isSale ? "Seller's Contact" : "Owner's Contact", value: draft.ownerContact });

  if (isSale) {
    rows.push({ label: 'Total Sale Consideration', value: draft.saleConsideration ? formatINRSlash(draft.saleConsideration) : '' });
    rows.push({
      label: 'Balance Due',
      value: draft.saleConsideration || draft.balanceDueOverride !== null ? formatINRSlash(resolveBalanceDue(draft)) : '',
    });
    rows.push({ label: 'Agreement Date', value: formatDateLongOrdinal(draft.agreementDate) });
    rows.push({ label: 'Registration Date', value: formatDateLongOrdinal(draft.registrationDate) });
  } else {
    rows.push({ label: 'Monthly Rent', value: draft.monthlyRent ? formatINRSlash(draft.monthlyRent) : '' });
    rows.push({ label: 'Maintenance Terms', value: MAINTENANCE_TERM_LABELS[draft.maintenanceTerm] });
    rows.push({ label: 'Deposit', value: draft.deposit ? formatINRSlash(draft.deposit) : '' });
    rows.push({
      label: 'Deposit Due',
      value: draft.deposit || draft.depositDueOverride !== null ? formatINRSlash(resolveDepositDue(draft)) : '',
    });
    rows.push({ label: 'Possession Date', value: formatDateLongOrdinal(draft.possessionDate) });
  }

  rows.push({ label: 'Brokerage Amount', value: draft.brokerageAmount ? formatINRSlash(draft.brokerageAmount) : '' });
  rows.push({ label: 'Brokerage Received', value: draft.brokerageReceived ? formatINRSlash(draft.brokerageReceived) : '' });
  rows.push({
    label: 'Brokerage Balance',
    value: draft.brokerageAmount ? formatBrokerageBalance(draft) : '',
  });
  rows.push({ label: 'Executive Name & Contact', value: [draft.executiveName, draft.executiveContact].filter(Boolean).join(', ') });
  rows.push({ label: 'Payment Mode', value: PAYMENT_MODE_LABELS[draft.paymentMode] });
  if (draft.paymentMode !== 'cash') {
    rows.push({ label: 'Reference No.', value: draft.referenceNo });
  }

  return rows.filter((r) => r.alwaysShow || r.value.trim() !== '');
}
