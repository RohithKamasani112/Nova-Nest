// "Which lead was I just calling?" — a sales rep taps Call/WhatsApp, the
// phone app takes over, and when they switch back to the browser they need
// to find that same lead again without re-searching. Tracks only the single
// most-recent one (tapping a different lead's Call/WhatsApp replaces it),
// and expires after a few hours so a highlight from yesterday's calls
// doesn't linger and read as "still needs attention."
const LEAD_ID_KEY = 'crm_last_contacted_lead_id';
const AT_KEY = 'crm_last_contacted_at';
const STALE_MS = 4 * 60 * 60 * 1000;

export function markLastContacted(leadId: string): void {
  try {
    localStorage.setItem(LEAD_ID_KEY, leadId);
    localStorage.setItem(AT_KEY, String(Date.now()));
  } catch {
    // Private browsing / storage disabled — the highlight just won't
    // persist across a reload, nothing else depends on this succeeding.
  }
}

export function getLastContactedLeadId(): string | null {
  try {
    const id = localStorage.getItem(LEAD_ID_KEY);
    const at = Number(localStorage.getItem(AT_KEY) ?? '0');
    if (!id || !at || Date.now() - at > STALE_MS) return null;
    return id;
  } catch {
    return null;
  }
}

// Called once a rep actually updates the lead they came back for — the
// highlight has done its job, clear it so it doesn't point at a stale lead
// the next time they tap Call on someone else.
export function clearLastContacted(leadId: string): void {
  try {
    if (localStorage.getItem(LEAD_ID_KEY) === leadId) {
      localStorage.removeItem(LEAD_ID_KEY);
      localStorage.removeItem(AT_KEY);
    }
  } catch {
    // no-op
  }
}
