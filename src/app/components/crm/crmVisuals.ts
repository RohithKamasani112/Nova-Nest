// Shared color/label lookups for the CRM leads screen. Colors reference the
// CSS variables in src/styles/crmTheme.css — no hardcoded hex here or in
// any component that imports these.

export const SOURCE_STRIPE_VAR: Record<string, string> = {
  magicbricks: 'var(--crm-source-magicbricks)',
  housing: 'var(--crm-source-housing)',
  '99acres': 'var(--crm-source-99acres)',
  personal: 'var(--crm-source-personal)',
  website: 'var(--crm-source-website)',
};

export const SOURCE_LABELS: Record<string, string> = {
  magicbricks: 'MagicBricks',
  housing: 'Housing',
  '99acres': '99acres',
  personal: 'Personal',
  website: 'Website',
};

export const STATUS_DOT_VAR: Record<string, string> = {
  new: 'var(--crm-status-new)',
  contacted: 'var(--crm-status-contacted)',
  follow_up: 'var(--crm-status-follow_up)',
  site_visit_scheduled: 'var(--crm-status-site_visit_scheduled)',
  site_visit_done: 'var(--crm-status-site_visit_done)',
  negotiation: 'var(--crm-status-negotiation)',
  converted: 'var(--crm-status-converted)',
  closed_lost: 'var(--crm-status-closed_lost)',
  junk: 'var(--crm-status-junk)',
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  site_visit_scheduled: 'Site visit scheduled',
  site_visit_done: 'Site visit done',
  negotiation: 'Negotiation',
  converted: 'Converted',
  closed_lost: 'Closed / lost',
  junk: 'Junk',
};

export const TERMINAL_STATUSES = new Set(['converted', 'closed_lost', 'junk']);

// Order shown in every status dropdown across the CRM (drawer, inline table
// editor, bulk-action bar) — funnel order, terminal states last.
export const STATUS_OPTIONS = [
  'new', 'contacted', 'follow_up', 'site_visit_scheduled', 'site_visit_done',
  'negotiation', 'converted', 'closed_lost', 'junk',
];

// Canned call-outcome quick-picks for the row-level "log a call" popover —
// one click both logs a note and (for the non-terminal outcomes) schedules
// a next-day follow-up, so a missed call surfaces again in Overdue/Today's
// Calls without the agent having to set a reminder by hand.
export const CALL_OUTCOMES: { label: string; scheduleFollowUp: boolean }[] = [
  { label: "Didn't pick up", scheduleFollowUp: true },
  { label: 'Switched off', scheduleFollowUp: true },
  { label: 'Number busy', scheduleFollowUp: true },
  { label: 'Asked to call back later', scheduleFollowUp: true },
  { label: 'Wrong number', scheduleFollowUp: false },
  { label: 'Not interested', scheduleFollowUp: false },
];

// Tomorrow 10am — matches FollowUpQuickPicker's own "Tomorrow" default, so a
// quick-logged outcome and a manually-picked follow-up date read the same.
export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

// Verb shown in the merged Follow-up/Activity column when there's no
// upcoming follow-up but there is a most-recent activity to fall back to —
// e.g. "Noted 2 days ago". Only the activity types the app actually logs
// (lead_activities.type) are listed; anything else falls back to "Active".
export const ACTIVITY_VERB: Record<string, string> = {
  note: 'Noted',
  status_change: 'Updated',
  re_enquiry: 'Re-enquired',
};

// Display-only — never mutates or re-sends the underlying stored name.
// "deeksha shankar" -> "Deeksha Shankar".
export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// Phone numbers in this CRM are raw scraped/entered strings — spaces,
// dashes, a leading 0, or an already-present 91 country code all show up in
// the wild. Every tel:/wa.me link across the admin panel should go through
// this instead of guessing at the format per call site (several did,
// inconsistently — see the mobile audit's Phase 5a).
export function normalizedPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits; // already has a country code, or an unusual length — leave it alone
}

export function telHref(raw: string): string {
  return `tel:+${normalizedPhoneDigits(raw)}`;
}

// The stored `phone` column is null whenever a number fails server-side
// normalization (normalizePhone in valueNormalize.ts — 10 digits starting
// 6-9). Website submissions only check digit count client-side, so a real
// number a visitor typed can still land here with `phone` null — falling
// back to `phone_raw` (the original, unvalidated digits) means the CRM can
// still call/WhatsApp it instead of showing nothing at all.
export function leadPhone(lead: { phone: string | null; phone_raw?: string | null }): string | null {
  return lead.phone ?? lead.phone_raw ?? null;
}

export function whatsappUrl(raw: string): string {
  return `https://wa.me/${normalizedPhoneDigits(raw)}`;
}
