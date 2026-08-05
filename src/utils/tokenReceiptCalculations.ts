import { TokenReceiptDraft } from './tokenReceiptTypes';

// ------------------------------------------------------------ money fmt ---

const inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** "45,000/-" — lakh grouping via Intl.NumberFormat('en-IN'), never 45000. */
export function formatINRSlash(amount: number): string {
  return `${inrFormatter.format(Math.round(amount || 0))}/-`;
}

export function computeBrokerageBalance(brokerageAmount: number, brokerageReceived: number): number {
  return (brokerageAmount || 0) - (brokerageReceived || 0);
}

/** Resolves the brokerage-balance row value, honouring a manual override. */
export function resolveBrokerageBalance(draft: TokenReceiptDraft): number {
  return draft.brokerageBalanceOverride ?? computeBrokerageBalance(draft.brokerageAmount, draft.brokerageReceived);
}

/** "45,000/- (20,000 Paid)" */
export function formatBrokerageBalance(draft: TokenReceiptDraft): string {
  const balance = resolveBrokerageBalance(draft);
  return `${formatINRSlash(balance)} (${inrFormatter.format(Math.round(draft.brokerageReceived || 0))} Paid)`;
}

// ------------------------------------------------------- auto-calc rows ---

export function computeDepositDue(deposit: number, bookingAmount: number): number {
  return (deposit || 0) - (bookingAmount || 0);
}

export function computeBalanceDue(saleConsideration: number, bookingAmount: number): number {
  return (saleConsideration || 0) - (bookingAmount || 0);
}

/** Resolves the deposit-due row value, honouring a manual override. */
export function resolveDepositDue(draft: TokenReceiptDraft): number {
  return draft.depositDueOverride ?? computeDepositDue(draft.deposit, draft.bookingAmount);
}

/** Resolves the balance-due row value, honouring a manual override. */
export function resolveBalanceDue(draft: TokenReceiptDraft): number {
  return draft.balanceDueOverride ?? computeBalanceDue(draft.saleConsideration, draft.bookingAmount);
}

// ------------------------------------------------------------- dates ------

/** DD-MM-YYYY, for the header Serial No / Date row. */
export function formatDateDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** "13th of July 2026" — used for possession/agreement/registration dates. */
export function formatDateLongOrdinal(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return `${ordinal(d.getDate())} of ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
