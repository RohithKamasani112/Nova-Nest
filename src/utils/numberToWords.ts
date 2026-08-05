// Indian-numbering-system (Thousand / Lakh / Crore) number-to-words
// converter, used by the Token Receipt's "Amount in Words" field. Pure
// functions only — no formatting/currency concerns baked in beyond what's
// explicitly part of the API, so they stay trivially testable.
//
// ₹1,35,000 -> numberToWordsIndian(135000) -> "One Lakh Thirty Five Thousand"
// (never "One Hundred Thirty Five Thousand" — that's the Western grouping).

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ');
}

/**
 * Converts a non-negative integer to words using the Indian numbering
 * system (Crore = 1,00,00,000 / Lakh = 1,00,000 / Thousand = 1,000).
 * Returns "Zero" for 0. No currency wrapping — see `amountInWords` for that.
 */
export function numberToWordsIndian(value: number): string {
  const n = Math.floor(Math.abs(value || 0));
  if (n === 0) return 'Zero';

  let remaining = n;
  const crore = Math.floor(remaining / 1_00_00_000);
  remaining %= 1_00_00_000;
  const lakh = Math.floor(remaining / 1_00_000);
  remaining %= 1_00_000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundredsPart = remaining;

  const segments: string[] = [];
  if (crore) segments.push(`${threeDigits(crore)} Crore`);
  if (lakh) segments.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) segments.push(`${threeDigits(thousand)} Thousand`);
  if (hundredsPart) segments.push(threeDigits(hundredsPart));

  return segments.join(' ');
}

/**
 * Full receipt-ready amount-in-words: "Rupees <words> [and <paise> Paise]
 * Only". Rounds to the nearest paisa first (via integer cents) so floating
 * point never produces something like "...and 49.999999 Paise".
 */
export function amountInWords(amount: number): string {
  const totalPaise = Math.round((amount || 0) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';
  if (rupees === 0) return `Rupees ${numberToWordsIndian(paise)} Paise Only`;
  if (paise === 0) return `Rupees ${numberToWordsIndian(rupees)} Only`;
  return `Rupees ${numberToWordsIndian(rupees)} and ${numberToWordsIndian(paise)} Paise Only`;
}
