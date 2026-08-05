// Default values pre-filled into the billing forms — every one of these is a
// starting point the preparer can type over per deal (see the editable-field
// table in the billing generator spec). Never treated as a locked constant.

import { BUSINESS_STATE_CODE, BUSINESS_STATE_NAME } from './siteSettings';

// Document title per type, per GST mode — a real lookup, not string surgery
// on a "Tax Invoice" title. Sale Booking's title doesn't change with GST
// mode: it's a booking confirmation either way, never itself a tax invoice
// (the only GST-bearing line on it is the commission charge).
export const DOC_TITLES = {
  sale_booking: { withGst: 'BOOKING CONFIRMATION', withoutGst: 'BOOKING CONFIRMATION' },
  commission_sale: { withGst: 'TAX INVOICE – COMMISSION', withoutGst: 'INVOICE – COMMISSION' },
  commission_rental: { withGst: 'TAX INVOICE – RENTAL BROKERAGE', withoutGst: 'INVOICE – RENTAL BROKERAGE' },
  service: { withGst: 'TAX INVOICE', withoutGst: 'SERVICE INVOICE' },
} as const;

// SAC (Services Accounting Code) starting points per document type — every
// one editable per document, never a locked value. Real estate brokerage
// commonly files under 997221; general repair/maintenance services under
// 998719. The preparer should confirm/override per engagement.
export const SAC_CODE_DEFAULTS = {
  sale_booking: '997221',
  commission: '997221',
  service: '998719',
};

// Default GST/Rule 46 fields shared by every billing form's initial draft.
// Assumes an intra-state supply (recipient in the same state as the
// business) since that's the common case — editable per document, and the
// actual CGST+SGST vs. IGST split is derived from placeOfSupplyCode vs. the
// supplier's own state at render/calculation time, not from this default.
export const gstFieldDefaults = (sacCode: string, gstApplicable = true) => ({
  gstApplicable,
  sacCode,
  placeOfSupplyState: BUSINESS_STATE_NAME,
  placeOfSupplyCode: BUSINESS_STATE_CODE,
  reverseCharge: false,
  recipientGstin: '',
  recipientStateName: BUSINESS_STATE_NAME,
  recipientStateCode: BUSINESS_STATE_CODE,
});

export const DEFAULT_SALE_BOOKING_TERMS: string[] = [
  'The token advance amount confirms the provisional booking of the above property in favour of the Purchaser.',
  'The Purchaser shall execute the Sale Agreement within the mutually agreed timeline and pay the amount stated above at that stage.',
  'The remaining balance shall be cleared as per the above schedule, including loan disbursement (if applicable) and prior to registration.',
  'TDS, stamp duty, registration charges, commission, and all statutory payments shall be borne by the Purchaser unless otherwise agreed.',
  'Delay or default in payment may result in cancellation of booking and forfeiture of token advance, subject to mutual agreement.',
  'This document is provisional and subject to verification of title, approvals, and execution of the final Sale Deed.',
  'Both parties agree to abide by applicable laws governing the transaction.',
];

export const SALE_BOOKING_DEFAULTS = {
  saleAgreementAmountPctOfTotal: 18,
  milestonePct: 20,
  tdsPct: 1,
  commissionPct: 1.5,
  commissionGstPct: 18,
  stampDutyPct: 7.6,
  saleAgreementChargesPct: 0.5,
  additionalFee: 6000,
  registrationChargesPct: 7.1,
  place: 'Bangalore',
};

export const COMMISSION_DEFAULTS = {
  cgstPct: 9,
  sgstPct: 9,
  paymentTerms: '50% payable at the time of Agreement, remaining 50% payable at the time of Registration, as mutually agreed between the parties.',
};

export const SERVICE_DEFAULTS = {
  cgstPct: 9,
  sgstPct: 9,
};
