// Token Receipt is deliberately not part of the BillingDoc union in
// src/types/index.ts — nothing here is ever saved (no database, no API),
// so it doesn't need docType/docNumber/pdfUrl/createdAt or a Computed
// snapshot shape. It's pure client-side form state.

export type TokenReceiptKind = 'rent' | 'sale';
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';
export type MaintenanceTerm = 'excluding' | 'including' | 'extra';

export interface TokenReceiptDraft {
  type: TokenReceiptKind;

  // Header
  serialNo: string;
  receiptCode: string;
  date: string; // yyyy-mm-dd

  // Client / property (fields for both)
  clientName: string;
  contactNumber: string;
  email: string;
  propertyName: string;
  unitNo: string;
  bookingAmount: number;
  ownerName: string;
  ownerContact: string;
  brokerageAmount: number;
  brokerageReceived: number;
  brokerageBalanceOverride: number | null;
  executiveName: string;
  executiveContact: string;
  paymentMode: PaymentMode;
  referenceNo: string;

  // Rent-only
  monthlyRent: number;
  maintenanceTerm: MaintenanceTerm;
  deposit: number;
  depositDueOverride: number | null;
  possessionDate: string;

  // Sale-only
  saleConsideration: number;
  balanceDueOverride: number | null;
  agreementDate: string;
  registrationDate: string;
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};

export const MAINTENANCE_TERM_LABELS: Record<MaintenanceTerm, string> = {
  excluding: 'Excluding Maintenance',
  including: 'Including Maintenance',
  extra: 'Maintenance Extra',
};
