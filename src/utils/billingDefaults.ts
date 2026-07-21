// Default values pre-filled into the billing forms — every one of these is a
// starting point the preparer can type over per deal (see the editable-field
// table in the billing generator spec). Never treated as a locked constant.

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
