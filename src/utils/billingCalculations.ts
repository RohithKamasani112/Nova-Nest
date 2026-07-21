import {
  CommissionComputed,
  SaleBookingComputed,
  ServiceComputed,
  ServiceLineItem,
} from '../types';

// All billing math lives here as plain, deterministic functions — no AI call
// ever touches a total, a GST split, or a TDS figure. Percent inputs are
// fractions of 100 (e.g. 18 means 18%), matching how they're entered in the
// form fields.

// Rounded to the nearest rupee immediately (not just at display time). These
// documents never show paise, so every line item a total is built from must
// already be a whole rupee — otherwise a total computed from unrounded
// fractions can differ by a rupee from the sum of its own displayed rows
// (e.g. ₹3,703.5 + ₹3,703.5 independently rounds to ₹3,704 + ₹3,704 = ₹7,408,
// while the unrounded total rounds to ₹7,407). Rounding here first keeps
// every printed figure internally consistent.
const pct = (amount: number, percent: number): number => Math.round((amount * percent) / 100);

export const INDIA_TDS_THRESHOLD = 5_000_000; // Rs. 50,00,000

export interface SaleBookingInput {
  totalSalePrice: number;
  tokenAmount: number;
  saleAgreementAmount: number;
  milestonePct: number;
  tdsEnabled: boolean;
  tdsPct: number;
  commissionPct: number;
  commissionGstPct: number;
  stampDutyPct: number;
  saleAgreementChargesPct: number;
  additionalFee: number;
  registrationChargesPct: number;
  registrationIncidentCharges: number;
}

export const calculateSaleBooking = (input: SaleBookingInput): SaleBookingComputed => {
  const {
    totalSalePrice,
    tokenAmount,
    saleAgreementAmount,
    milestonePct,
    tdsEnabled,
    tdsPct,
    commissionPct,
    commissionGstPct,
    stampDutyPct,
    saleAgreementChargesPct,
    additionalFee,
    registrationChargesPct,
    registrationIncidentCharges,
  } = input;

  const balanceAfterToken = totalSalePrice - tokenAmount;
  const milestoneAmount = pct(totalSalePrice, milestonePct);
  const balanceAfterMilestone = totalSalePrice - tokenAmount - saleAgreementAmount - milestoneAmount;
  const tdsAmount = tdsEnabled ? pct(totalSalePrice, tdsPct) : 0;

  const commissionAmount = pct(totalSalePrice, commissionPct);
  const commissionGstAmount = pct(commissionAmount, commissionGstPct);
  const totalCommissionPayable = commissionAmount + commissionGstAmount;

  const stampDutyAmount = pct(totalSalePrice, stampDutyPct);
  const saleAgreementChargesAmount = pct(totalSalePrice, saleAgreementChargesPct) + additionalFee;
  const registrationChargesAmount = pct(totalSalePrice, registrationChargesPct);
  const totalGovtCharges =
    stampDutyAmount + saleAgreementChargesAmount + registrationChargesAmount + registrationIncidentCharges;

  return {
    balanceAfterToken,
    milestoneAmount,
    balanceAfterMilestone,
    tdsAmount,
    commissionAmount,
    commissionGstAmount,
    totalCommissionPayable,
    stampDutyAmount,
    saleAgreementChargesAmount,
    registrationChargesAmount,
    totalGovtCharges,
  };
};

export interface CommissionInput {
  taxableAmount: number;
  cgstPct: number;
  sgstPct: number;
}

export const calculateCommission = (input: CommissionInput): CommissionComputed => {
  const { taxableAmount, cgstPct, sgstPct } = input;
  const cgstAmount = pct(taxableAmount, cgstPct);
  const sgstAmount = pct(taxableAmount, sgstPct);
  const totalPayable = taxableAmount + cgstAmount + sgstAmount;

  return {
    cgstAmount,
    sgstAmount,
    totalPayable,
    amountInWords: numberToIndianWords(totalPayable),
  };
};

export interface ServiceInput {
  lineItems: ServiceLineItem[];
  gstEnabled: boolean;
  cgstPct: number;
  sgstPct: number;
}

export const calculateService = (input: ServiceInput): ServiceComputed => {
  const { lineItems, gstEnabled, cgstPct, sgstPct } = input;
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const cgstAmount = gstEnabled ? pct(subtotal, cgstPct) : 0;
  const sgstAmount = gstEnabled ? pct(subtotal, sgstPct) : 0;
  const total = subtotal + cgstAmount + sgstAmount;

  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    total,
    amountInWords: numberToIndianWords(total),
  };
};

// Indian digit-grouping currency formatter — "₹1,68,00,000", never
// "₹16,800,000". Rounds to the nearest rupee; these documents don't deal in
// fractional paise anywhere in the reference PDFs.
export const formatINR = (value: number): string =>
  `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

const twoDigitsToWords = (n: number): string => {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
};

const threeDigitsToWords = (n: number): string => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigitsToWords(rest));
  return parts.join(' ');
};

// Converts a rupee amount to words using the Indian numbering system
// (Lakh/Crore, not Million/Billion), e.g. 3,71,700 -> "Three Lakhs Seventy
// One Thousand Seven Hundred". Whole rupees only — matches the reference
// PDFs, which never spell out paise.
export const numberToIndianWords = (amount: number): string => {
  let n = Math.round(Math.abs(amount || 0));
  if (n === 0) return 'Zero Rupees Only';

  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredsPart = n;

  const segments: string[] = [];
  if (crore) segments.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) segments.push(`${threeDigitsToWords(lakh)} Lakhs`);
  if (thousand) segments.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundredsPart) segments.push(threeDigitsToWords(hundredsPart));

  return `Rupees ${segments.join(' ')} Only`;
};
