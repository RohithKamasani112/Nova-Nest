// Shared color/label lookups for the CRM leads screen. Colors reference the
// CSS variables in src/styles/crmTheme.css — no hardcoded hex here or in
// any component that imports these.

export const SOURCE_STRIPE_VAR: Record<string, string> = {
  magicbricks: 'var(--crm-source-magicbricks)',
  housing: 'var(--crm-source-housing)',
  '99acres': 'var(--crm-source-99acres)',
  personal: 'var(--crm-source-personal)',
};

export const SOURCE_LABELS: Record<string, string> = {
  magicbricks: 'MagicBricks',
  housing: 'Housing',
  '99acres': '99acres',
  personal: 'Personal',
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
