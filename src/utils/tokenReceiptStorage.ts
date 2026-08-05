import { TokenReceiptDraft } from './tokenReceiptTypes';

const DRAFT_KEY = 'token_receipt_draft_v1';
const NEXT_CODE_KEY = 'token_receipt_next_code_v1';
const LAST_RECEIPT_KEY = 'token_receipt_last_v1';

// Continues from the last hand-written receipt.
const SEED_RECEIPT_CODE = 'NONN0604';

export function loadDraft(): Partial<TokenReceiptDraft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: TokenReceiptDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private browsing / quota-exceeded — losing draft persistence silently
    // isn't worth surfacing as an error in a form that still works otherwise.
  }
}

export function clearDraftStorage(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
}

export function getNextReceiptCode(): string {
  return localStorage.getItem(NEXT_CODE_KEY) || SEED_RECEIPT_CODE;
}

/** "NONN0604" -> "NONN0605". Falls back to returning the code unchanged if it doesn't end in digits. */
export function incrementReceiptCode(code: string): string {
  const match = code.match(/^(.*?)(\d+)$/);
  if (!match) return code;
  const [, prefix, digits] = match;
  const next = String(Number(digits) + 1).padStart(digits.length, '0');
  return `${prefix}${next}`;
}

/** Call once a receipt has actually been downloaded — advances the next-number counter. */
export function commitReceiptCode(usedCode: string): void {
  try {
    localStorage.setItem(NEXT_CODE_KEY, incrementReceiptCode(usedCode));
  } catch {
    // no-op
  }
}

export function saveLastReceipt(draft: TokenReceiptDraft): void {
  try {
    localStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(draft));
  } catch {
    // no-op
  }
}

export function loadLastReceipt(): TokenReceiptDraft | null {
  try {
    const raw = localStorage.getItem(LAST_RECEIPT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
