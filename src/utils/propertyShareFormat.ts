import { formatINR } from './billingCalculations';

export const MISSING = '—';

// The property form's currency inputs are plain `type="number"` fields, so
// stored values are always real numbers today — but the internal
// spreadsheet this feature replaces does use shorthand ("30K", "1.5L"), and
// import/migration paths could realistically hand this function a string.
// Defensive, not decorative: expand shorthand rather than assume it can't
// happen.
export function parseIndianShorthand(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const trimmed = value.trim();
  const match = /^([\d,.]+)\s*([kKlLcC]?)$/.exec(trimmed);
  if (!match) {
    const plain = Number(trimmed.replace(/,/g, ''));
    return Number.isFinite(plain) ? plain : 0;
  }
  const num = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(num)) return 0;
  switch (match[2].toLowerCase()) {
    case 'k':
      return num * 1_000;
    case 'l':
      return num * 100_000;
    case 'c':
      return num * 10_000_000;
    default:
      return num;
  }
}

// ₹1,35,000 — never ₹135,000. formatINR already groups via en-IN locale.
export function formatCurrencyOrDash(value: number | string | null | undefined): string {
  const num = parseIndianShorthand(value);
  if (!num) return MISSING;
  return formatINR(num);
}

export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function formatBhkLabel(bedrooms: number): string {
  return bedrooms === 0 ? 'Studio' : `${bedrooms} BHK`;
}

export function formatOrdinal(n: number): string {
  if (n === 0) return 'Ground';
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function formatFloorLabel(floorNumber: number | null): string {
  return floorNumber === null || floorNumber === undefined ? MISSING : formatOrdinal(floorNumber);
}

export function formatFurnishing(status: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | null): string {
  return status ?? MISSING;
}

export function formatTenantPreference(pref: 'family' | 'bachelors' | 'family_bachelors' | 'any' | null): string {
  switch (pref) {
    case 'family':
      return 'Family';
    case 'bachelors':
      return 'Bachelors';
    case 'family_bachelors':
      return 'Family/Bachelors';
    case 'any':
      return 'Any';
    default:
      return MISSING;
  }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "Available 1st August 2026" — otherwise "Ready to Move".
export function formatAvailability(availableFrom: string | null, possessionStatus: string | null): string {
  if (!availableFrom) {
    return possessionStatus === 'Under Construction' ? 'Under Construction' : 'Ready to Move';
  }
  const date = new Date(availableFrom);
  if (Number.isNaN(date.getTime())) return 'Ready to Move';
  return `Available ${formatOrdinal(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatGated(gated: boolean): string {
  return gated ? 'Gated' : 'Standalone';
}
