/**
 * Date-range math for the CRM dashboard/leads pages, computed against
 * India Standard Time (UTC+5:30, no DST) regardless of the viewing
 * browser's own local timezone. Everything here works in epoch
 * milliseconds via Date's UTC getters/setters only — never the local
 * (`getFullYear`/`getDate`/...) getters — so results don't depend on
 * where the admin's machine is set.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

interface IstParts {
  year: number;
  month: number; // 0-based
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
}

function toIstParts(date: Date): IstParts {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    ms: shifted.getUTCMilliseconds(),
  };
}

function fromIstParts(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): Date {
  const asIfUtc = Date.UTC(year, month, day, hour, minute, second, ms);
  return new Date(asIfUtc - IST_OFFSET_MS);
}

export function startOfIstDay(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, p.month, p.day);
}

export function endOfIstDay(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, p.month, p.day, 23, 59, 59, 999);
}

export function addIstDays(date: Date, days: number): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, p.month, p.day + days, p.hour, p.minute, p.second, p.ms);
}

export function startOfIstWeekMonday(date: Date): Date {
  const start = startOfIstDay(date);
  const dayOfWeek = new Date(start.getTime() + IST_OFFSET_MS).getUTCDay(); // 0=Sun..6=Sat, IST wall-clock
  const diff = (dayOfWeek + 6) % 7; // days since Monday
  return addIstDays(start, -diff);
}

export function startOfIstMonth(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, p.month, 1);
}

export function endOfIstMonth(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, p.month + 1, 0, 23, 59, 59, 999);
}

export function startOfIstQuarter(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, Math.floor(p.month / 3) * 3, 1);
}

export function startOfIstYear(date: Date): Date {
  const p = toIstParts(date);
  return fromIstParts(p.year, 0, 1);
}

export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_30_days: 'Last 30 Days',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  custom: 'Custom Range',
};

export interface PeriodRange {
  from: string;
  to: string;
}

/** customFrom/customTo are `yyyy-mm-dd` (IST calendar dates), as produced by a date picker. */
export function computeIstPeriod(preset: PeriodPreset, customFrom?: string, customTo?: string): PeriodRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { from: startOfIstDay(now).toISOString(), to: endOfIstDay(now).toISOString() };
    case 'yesterday': {
      const y = addIstDays(now, -1);
      return { from: startOfIstDay(y).toISOString(), to: endOfIstDay(y).toISOString() };
    }
    case 'this_week':
      return { from: startOfIstWeekMonday(now).toISOString(), to: endOfIstDay(now).toISOString() };
    case 'last_week': {
      const thisWeekStart = startOfIstWeekMonday(now);
      const lastWeekStart = addIstDays(thisWeekStart, -7);
      const lastWeekEnd = addIstDays(thisWeekStart, -1);
      return { from: lastWeekStart.toISOString(), to: endOfIstDay(lastWeekEnd).toISOString() };
    }
    case 'this_month':
      return { from: startOfIstMonth(now).toISOString(), to: endOfIstDay(now).toISOString() };
    case 'last_month': {
      const p = toIstParts(now);
      const lastMonthAnchor = fromIstParts(p.year, p.month - 1, 1);
      return { from: startOfIstMonth(lastMonthAnchor).toISOString(), to: endOfIstMonth(lastMonthAnchor).toISOString() };
    }
    case 'last_30_days': {
      const start = addIstDays(now, -29);
      return { from: startOfIstDay(start).toISOString(), to: endOfIstDay(now).toISOString() };
    }
    case 'this_quarter':
      return { from: startOfIstQuarter(now).toISOString(), to: endOfIstDay(now).toISOString() };
    case 'this_year':
      return { from: startOfIstYear(now).toISOString(), to: endOfIstDay(now).toISOString() };
    case 'custom': {
      if (!customFrom || !customTo) {
        return { from: startOfIstDay(now).toISOString(), to: endOfIstDay(now).toISOString() };
      }
      const [fy, fm, fd] = customFrom.split('-').map(Number);
      const [ty, tm, td] = customTo.split('-').map(Number);
      return {
        from: fromIstParts(fy, fm - 1, fd).toISOString(),
        to: fromIstParts(ty, tm - 1, td, 23, 59, 59, 999).toISOString(),
      };
    }
    default:
      return { from: startOfIstDay(now).toISOString(), to: endOfIstDay(now).toISOString() };
  }
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatIstDateShort(iso: string): string {
  const p = toIstParts(new Date(iso));
  return `${p.day} ${MONTH_ABBR[p.month]} ${p.year}`;
}

/** e.g. "1 – 31 Jul 2026" or "28 Jul – 3 Aug 2026" or "1 Dec 2025 – 5 Jan 2026". */
export function formatIstRange(from: string, to: string): string {
  const f = toIstParts(new Date(from));
  const t = toIstParts(new Date(to));
  if (f.year === t.year && f.month === t.month && f.day === t.day) {
    return `${f.day} ${MONTH_ABBR[f.month]} ${f.year}`;
  }
  if (f.year === t.year && f.month === t.month) {
    return `${f.day} – ${t.day} ${MONTH_ABBR[t.month]} ${t.year}`;
  }
  if (f.year === t.year) {
    return `${f.day} ${MONTH_ABBR[f.month]} – ${t.day} ${MONTH_ABBR[t.month]} ${t.year}`;
  }
  return `${formatIstDateShort(from)} – ${formatIstDateShort(to)}`;
}

/** yyyy-mm-dd, in IST — the shape native/calendar date inputs use. */
export function toIstDateInputValue(iso: string): string {
  const p = toIstParts(new Date(iso));
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
