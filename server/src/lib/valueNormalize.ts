import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CrmSource } from '../types/crm';
import { cleanCell, collapseWhitespace, isNullLike } from './textUtils';

dayjs.extend(customParseFormat);

// India has a fixed UTC+5:30 offset year-round (no DST), so converting a
// parsed wall-clock date to a UTC instant is just a constant subtraction —
// far more reliable than dayjs's tz()+customParseFormat interaction, which
// throws on inputs it can't reconcile between the two plugins.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ---------------------------------------------------------------- phone ---

export interface PhoneResult {
  phone: string | null;
  phoneRaw: string | null;
  warning?: 'INVALID_PHONE';
}

export function normalizePhone(raw: unknown): PhoneResult {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return { phone: null, phoneRaw: null };

  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(-10);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { phone: digits, phoneRaw: trimmed };
  }
  return { phone: null, phoneRaw: trimmed, warning: 'INVALID_PHONE' };
}

// ---------------------------------------------------------------- email ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailResult {
  email: string | null;
  warning?: 'INVALID_EMAIL';
  invalidRaw?: string;
}

export function normalizeEmail(raw: unknown): EmailResult {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return { email: null };
  const lower = trimmed.toLowerCase();
  if (EMAIL_RE.test(lower)) return { email: lower };
  return { email: null, warning: 'INVALID_EMAIL', invalidRaw: trimmed };
}

// ----------------------------------------------------------------- date ---

const DATE_FORMATS_BY_SOURCE: Record<Exclude<CrmSource, 'personal'>, string[]> = {
  housing: ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY', 'DD-MM-YYYY'],
  magicbricks: ['MMM D, YYYY h:mm:ss A', 'MMM D, YYYY', 'DD/MM/YYYY'],
  '99acres': ['MM/DD/YYYY HH:mm', 'MM/DD/YYYY'],
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}/;

function excelSerialToDate(serial: number): Date {
  // Excel's epoch is 1899-12-30; 25569 is the day-count offset to 1970-01-01.
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export interface DateResult {
  leadDate: Date | null;
  raw: string | null;
  warning?: 'UNPARSED_DATE';
}

export function normalizeDate(raw: unknown, source: Exclude<CrmSource, 'personal'>): DateResult {
  if (typeof raw === 'number') {
    return { leadDate: excelSerialToDate(raw), raw: String(raw) };
  }

  const trimmed = cleanCell(raw);
  if (trimmed === null) return { leadDate: null, raw: null };

  for (const fmt of DATE_FORMATS_BY_SOURCE[source]) {
    const parsed = dayjs(trimmed, fmt, true); // strict parse, naive wall-clock
    if (parsed.isValid()) {
      const utcMs =
        Date.UTC(parsed.year(), parsed.month(), parsed.date(), parsed.hour(), parsed.minute(), parsed.second()) -
        IST_OFFSET_MS;
      return { leadDate: new Date(utcMs), raw: trimmed };
    }
  }

  if (ISO_RE.test(trimmed)) {
    const parsed = dayjs(trimmed);
    if (parsed.isValid()) return { leadDate: parsed.toDate(), raw: trimmed };
  }

  return { leadDate: null, raw: trimmed, warning: 'UNPARSED_DATE' };
}

// ---------------------------------------------------------------- price ---

export interface PriceResult {
  priceValue: number | null;
  priceRaw: string | null;
  warning?: 'UNPARSED_PRICE';
}

export function normalizePrice(raw: unknown): PriceResult {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return { priceValue: null, priceRaw: null };

  // Range "50k-60k" -> take the lower bound, keep the full raw string.
  const rangeMatch = trimmed.match(/^([^\-–]+)[\-–]/);
  const target = (rangeMatch ? rangeMatch[1] : trimmed).trim();
  const cleaned = target.replace(/rs\.?|inr|₹|,/gi, '').trim();

  const m = cleaned.match(/^([\d.]+)\s*([a-z]+)?/i);
  if (!m) return { priceValue: null, priceRaw: trimmed, warning: 'UNPARSED_PRICE' };

  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return { priceValue: null, priceRaw: trimmed, warning: 'UNPARSED_PRICE' };

  const unit = (m[2] || '').toLowerCase();
  let multiplier: number | null;
  if (unit === '') multiplier = 1;
  else if (unit === 'k') multiplier = 1_000;
  else if (unit.startsWith('l')) multiplier = 100_000;
  else if (unit.startsWith('cr')) multiplier = 10_000_000;
  else multiplier = null;

  if (multiplier === null) return { priceValue: null, priceRaw: trimmed, warning: 'UNPARSED_PRICE' };

  return { priceValue: Math.round(num * multiplier * 100) / 100, priceRaw: trimmed };
}

// --------------------------------------------------------- configuration ---

export interface ConfigurationResult {
  configuration: string | null;
  bedrooms: number | null;
}

export function normalizeConfiguration(raw: unknown): ConfigurationResult {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return { configuration: null, bedrooms: null };
  const configuration = collapseWhitespace(trimmed).toUpperCase();
  const m = configuration.match(/^(\d+)/);
  return { configuration, bedrooms: m ? parseInt(m[1], 10) : null };
}

// --------------------------------------------------------- listing type ---

const LISTING_TYPE_MAP: Record<string, string> = {
  rent: 'rent',
  'res rent': 'rent',
  sale: 'sale',
  buy: 'sale',
  resale: 'resale',
  'res resale': 'resale',
};

export interface ListingTypeResult {
  listingType: string | null;
  rawUnmapped?: string;
}

export function normalizeListingType(raw: unknown): ListingTypeResult {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return { listingType: null };
  const key = trimmed.toLowerCase();
  const mapped = LISTING_TYPE_MAP[key];
  if (mapped) return { listingType: mapped };
  return { listingType: 'other', rawUnmapped: trimmed };
}

// --------------------------------------------------------------- names ---

export function normalizeName(raw: unknown): string | null {
  const trimmed = cleanCell(raw);
  if (trimmed === null) return null;
  return collapseWhitespace(trimmed);
}

export function normalizeNameKey(name: string): string {
  return collapseWhitespace(name).toLowerCase();
}

export { isNullLike };
