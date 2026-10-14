import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpRight, Star, StickyNote, UploadCloud } from 'lucide-react';
import { LeadContactActions } from './LeadContactActions';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { FollowUpQuickPicker } from './FollowUpQuickPicker';
import { LeadInterest, LeadListItem } from '../../../types/crm';
import { addLeadActivity, getLeadInterests, updateLead } from '../../../services/crmApi';
import { clearLastContacted, getLastContactedLeadId, markLastContacted } from '../../../utils/lastContacted';
import {
  ACTIVITY_VERB,
  CALL_OUTCOMES,
  leadPhone,
  SOURCE_LABELS,
  SOURCE_STRIPE_VAR,
  STATUS_DOT_VAR,
  STATUS_LABELS,
  STATUS_OPTIONS,
  telHref,
  titleCase,
  tomorrowIso,
} from './crmVisuals';
import { formatAbsoluteDateTime, formatRelativeDate, formatShortDate } from './relativeDate';
import { ColumnKey, Density, OPTIONAL_COLUMN_LABELS, OPTIONAL_COLUMNS } from './useLeadsTablePrefs';

// Single ` · ` at 40% opacity for an empty value — not an em dash, which
// reads as loudly as real data at 50 rows.
const Empty: React.FC = () => <span style={{ color: 'var(--crm-text-muted)' }}>·</span>;

function Truncated({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const text = typeof children === 'string' ? children : null;
  if (!text) return <span className={className} style={style}>{children}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`block truncate ${className}`} style={style}>{text}</span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

// Follow-up takes priority ("Due <date>"); when there's none, falls back to
// the last activity ("Noted <date>"). Two mostly-empty columns become one
// that almost always has something useful in it. Only the follow-up branch
// can be "overdue" (danger-colored) — a stale activity isn't itself a
// problem the way a missed follow-up is.
function followUpOrActivity(lead: LeadListItem): { text: string; overdue: boolean } | null {
  const fu = formatRelativeDate(lead.next_follow_up_at);
  if (fu) {
    // A scheduled visit is a calendar appointment, not a countdown — show
    // the actual date ("Visit 20 Sep") instead of "Due in 3 days".
    if (lead.status === 'site_visit_scheduled' && lead.next_follow_up_at) {
      return { text: `Visit ${formatShortDate(lead.next_follow_up_at)}`, overdue: fu.overdue };
    }
    return { text: `Due ${fu.text}`, overdue: fu.overdue };
  }
  const act = formatRelativeDate(lead.last_activity_at);
  if (act) {
    const verb = ACTIVITY_VERB[lead.last_activity_type ?? ''] ?? 'Active';
    return { text: `${verb} ${act.text}`, overdue: false };
  }
  return null;
}

const RelativeCell: React.FC<{ value: { text: string; overdue: boolean } | null; tooltip: string | null }> = ({ value, tooltip }) => {
  if (!value) return <Empty />;
  const content = (
    <span
      className="tabular-nums text-sm"
      style={{ color: value.overdue ? 'var(--crm-status-overdue)' : 'var(--crm-text-primary)', fontWeight: value.overdue ? 600 : 400 }}
    >
      {value.text}
    </span>
  );
  if (!tooltip) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

// Inline status dropdown — same guard rules as LeadDetailDrawer's status
// changer (lost reason required for closed_lost, optional deal value prompt
// for converted) so behavior doesn't diverge depending on where you edit
// from. Styled to read as plain text-plus-dot at rest, only revealing
// dropdown chrome on hover/focus.
const InlineStatusSelect: React.FC<{ lead: LeadListItem; onChanged: () => void; onStatusUpdated: (id: string) => void }> = ({
  lead,
  onChanged,
  onStatusUpdated,
}) => {
  const [busy, setBusy] = useState(false);
  // Site-visit date now uses the same FollowUpQuickPicker every other date
  // entry point uses (LeadDetailDrawer, Today's Calls) instead of a raw
  // window.prompt() text box — that prompt was the roughest interaction in
  // the app: no calendar, easy to mistype, and looks broken on a phone.
  // Status is saved immediately either way; the picker only supplies the
  // follow-up date afterward, same two-step flow LeadDetailDrawer uses.
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = async (status: string) => {
    if (status === lead.status) return;
    let lostReason: string | undefined;
    if (status === 'closed_lost') {
      const input = window.prompt('Lost reason (e.g. Budget mismatch, Not responding)?');
      if (!input || !input.trim()) return;
      lostReason = input.trim();
    }
    let dealValue: number | undefined;
    if (status === 'converted') {
      const input = window.prompt(`Deal value for ${titleCase(lead.name)} (₹)? Leave blank to skip.`);
      if (input && input.trim()) {
        const parsed = Number(input);
        if (!Number.isNaN(parsed)) dealValue = parsed;
      }
    }
    setBusy(true);
    try {
      await updateLead(lead.id, { status, lostReason, dealValue });
      toast.success('Status updated.');
      onChanged();
      onStatusUpdated(lead.id);
      // Without a date here, this lead won't show up in the "Site visit
      // scheduled" filter chip's near-term view or Today's Calls, since
      // both key off next_follow_up_at.
      if (status === 'site_visit_scheduled') setShowDatePicker(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not update status.');
    } finally {
      setBusy(false);
    }
  };

  const handlePickDate = async (iso: string) => {
    try {
      await updateLead(lead.id, { nextFollowUpAt: iso });
      toast.success('Site visit date set.');
      onChanged();
    } catch {
      toast.error('Could not set the site visit date.');
    } finally {
      setShowDatePicker(false);
    }
  };

  return (
    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
      <PopoverAnchor asChild>
        <span onClick={(e) => e.stopPropagation()}>
          <Select value={lead.status} onValueChange={handleChange} disabled={busy}>
            <SelectTrigger
              size="sm"
              aria-label={`Change status for ${lead.name}`}
              className="min-h-7 w-auto max-w-full gap-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-xs shadow-none hover:bg-[var(--crm-surface-hover)] focus-visible:ring-1 data-[size=sm]:h-auto"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: STATUS_DOT_VAR[lead.status] ?? 'var(--crm-status-new)' }}
                />
                <span className="truncate" style={{ color: 'var(--crm-text-secondary)' }}>
                  <SelectValue>{STATUS_LABELS[lead.status] ?? lead.status}</SelectValue>
                </span>
              </span>
            </SelectTrigger>
            <SelectContent onClick={(e) => e.stopPropagation()}>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </PopoverAnchor>
      <PopoverContent className="w-72" align="start" onClick={(e) => e.stopPropagation()}>
        <p className="mb-1.5 text-xs text-muted-foreground">Site visit date for {titleCase(lead.name)}:</p>
        <FollowUpQuickPicker onPick={handlePickDate} onCancel={() => setShowDatePicker(false)} />
      </PopoverContent>
    </Popover>
  );
};

// Badge shown when the same phone number has enquired more than once
// (possibly about different properties) — surfaced from the same
// lead_duplicates rows the import pipeline already writes on every phone
// match, no separate merge/data change. The count is cheap and comes with
// the row; the actual property list is fetched lazily on click so the list
// query itself stays fast.
const MultiInterestBadge: React.FC<{ leadId: string; count: number }> = ({ leadId, count }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState<LeadInterest[] | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && interests === null) {
      setLoading(true);
      getLeadInterests(leadId)
        .then((r) => setInterests(r.interests))
        .catch(() => setInterests([]))
        .finally(() => setLoading(false));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
          style={{ background: 'var(--crm-multi-interest-bg)', color: 'var(--crm-multi-interest)' }}
          title={`Also enquired ${count} more time${count === 1 ? '' : 's'} from this number`}
        >
          <Star size={10} fill="currentColor" strokeWidth={0} />
          {count + 1}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-1.5" align="start" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium" style={{ color: 'var(--crm-text-secondary)' }}>
          Same number, {count + 1} enquiries
        </p>
        {loading && <p className="text-xs" style={{ color: 'var(--crm-text-muted)' }}>Loading...</p>}
        {!loading && interests && interests.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--crm-text-muted)' }}>No other enquiries found.</p>
        )}
        {!loading &&
          interests?.map((i, idx) => (
            <div key={idx} className="text-xs">
              <span className="font-medium">{i.projectName ?? 'Unknown property'}</span>
              <span style={{ color: 'var(--crm-text-muted)' }}>
                {' '}
                · {SOURCE_LABELS[i.source] ?? i.source} · {new Date(i.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
      </PopoverContent>
    </Popover>
  );
};

// Inline quick-note / call-outcome popover for the row hover actions — same
// pattern as the dashboard's Today's Calls panel, so logging a call without
// opening the full drawer behaves identically everywhere it appears. The
// canned outcome buttons both log a note and (for non-terminal outcomes)
// schedule a next-day follow-up, so "didn't pick up" surfaces again in
// Overdue/Today's Calls on its own instead of relying on someone to remember.
const RowActions: React.FC<{ lead: LeadListItem; onChanged: () => void; onContact: (id: string) => void }> = ({
  lead,
  onChanged,
  onContact,
}) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const logOutcome = async (label: string, scheduleFollowUp: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addLeadActivity(lead.id, 'note', label, scheduleFollowUp ? tomorrowIso() : undefined);
      toast.success(scheduleFollowUp ? 'Logged — follow-up set for tomorrow.' : 'Logged.');
      setNoteOpen(false);
      onChanged();
    } catch {
      toast.error('Could not log outcome.');
    }
  };

  const handleAddNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noteText.trim()) return;
    try {
      await addLeadActivity(lead.id, 'note', noteText.trim());
      toast.success('Note added.');
      setNoteText('');
      setNoteOpen(false);
      onChanged();
    } catch {
      toast.error('Could not add note.');
    }
  };

  const phone = leadPhone(lead);

  return (
    <div
      className="row-actions flex shrink-0 items-center justify-end gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <LeadContactActions phone={phone} name={lead.name} compact onContact={() => onContact(lead.id)} />
      <Popover open={noteOpen} onOpenChange={setNoteOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="crm-note-button" title="Log call / add note" aria-label={`Add note for ${lead.name}`}>
            <StickyNote size={17} strokeWidth={1.8} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2" align="end" onClick={(e) => e.stopPropagation()}>
          <div>
            <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--crm-text-secondary)' }}>
              Call outcome
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CALL_OUTCOMES.map((o) => (
                <Button
                  key={o.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => logOutcome(o.label, o.scheduleFollowUp, e)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Or write a custom note..." />
          <Button size="sm" className="w-full" onClick={handleAddNote} disabled={!noteText.trim()}>
            Save note
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const SkeletonRow: React.FC<{ rowHeight: number; colCount: number }> = ({ rowHeight, colCount }) => (
  <tr style={{ height: rowHeight }}>
    <td colSpan={colCount} className="px-2">
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
    </td>
  </tr>
);

interface LeadsTableProps {
  leads: LeadListItem[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  onRowClick: (id: string) => void;
  onChanged: () => void;
  density: Density;
  visibleColumns: Set<ColumnKey>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onUploadClick?: () => void;
}

const ACTIONS_COL_WIDTH = 152;

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  selectedIds,
  onToggleOne,
  onToggleAll,
  allSelected,
  onRowClick,
  onChanged,
  density,
  visibleColumns,
  hasActiveFilters,
  onClearFilters,
  onUploadClick,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scrolledX, setScrolledX] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => setScrolledX(el.scrollLeft > 4);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // "Which lead was I just calling?" — see utils/lastContacted.ts. Marked
  // the instant Call/WhatsApp is tapped (so the highlight shows up right
  // away, no need to actually leave and come back), re-synced from
  // localStorage whenever the list refreshes (so a status update made from
  // LeadDetailDrawer, a separate component, still clears it here).
  const [highlightId, setHighlightId] = useState<string | null>(() => getLastContactedLeadId());
  useEffect(() => {
    setHighlightId(getLastContactedLeadId());
  }, [leads]);
  const handleContact = (id: string) => {
    markLastContacted(id);
    setHighlightId(id);
  };
  const handleStatusUpdated = (id: string) => {
    clearLastContacted(id);
    setHighlightId((cur) => (cur === id ? null : cur));
  };

  const compact = density === 'compact';
  const rowHeight = compact ? 52 : 68;
  const cellPad = compact ? 'py-2 px-3' : 'py-3 px-3';
  const optionalCols = OPTIONAL_COLUMNS.filter((c) => visibleColumns.has(c));

  // Scroll-only right-edge shadow on the sticky Lead column — no permanent
  // border at rest, so there's nothing to read as a stray divider.
  const nameShadow = scrolledX ? { boxShadow: '4px 0 8px -4px rgba(0,0,0,0.15)' } : {};

  const renderOptionalCell = (lead: LeadListItem, col: ColumnKey) => {
    switch (col) {
      case 'budget':
        return lead.price_value ? (
          <span className="tabular-nums">₹{Number(lead.price_value).toLocaleString('en-IN')}</span>
        ) : (
          <Empty />
        );
      case 'city':
        return lead.city ? <Truncated>{lead.city}</Truncated> : <Empty />;
      case 'email':
        return lead.email ? <Truncated>{lead.email}</Truncated> : <Empty />;
      case 'propertyType':
        return lead.property_type ? <Truncated>{lead.property_type}</Truncated> : <Empty />;
      case 'listingType':
        return lead.listing_type ? <span className="capitalize">{lead.listing_type}</span> : <Empty />;
      case 'leadDate':
        return lead.lead_date ? (
          <span className="tabular-nums">{new Date(lead.lead_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        ) : (
          <Empty />
        );
      default:
        return null;
    }
  };

  const colCount = 5 + optionalCols.length + 1;

  if (!loading && leads.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-20 text-center"
        style={{ background: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8 }}
      >
        {hasActiveFilters ? (
          <>
            <p style={{ color: 'var(--crm-text-secondary)' }}>No leads match these filters.</p>
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--crm-text-secondary)' }}>
              No leads yet. Upload a file from MagicBricks, Housing, or 99acres to get started.
            </p>
            {onUploadClick && (
              <Button size="sm" onClick={onUploadClick}>
                <UploadCloud size={14} /> Upload new data
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Table view — >=1024px. One table, one scroll container: rows can
          never desync because there's nothing else scrolling independently. */}
      <div
        ref={wrapRef}
        className="crm-table-scroll hidden lg:block"
        style={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 300px)',
          background: 'var(--crm-surface)',
          border: '1px solid var(--crm-border)',
          borderRadius: 16,
        }}
      >
        <table className="crm-lead-table" style={{ width: '100%', minWidth: 1050 + optionalCols.length * 130, tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 14 }}>
          <colgroup>
            <col style={{ width: 240 }} />
            <col style={{ width: 260 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 130 }} />
            {optionalCols.map((c) => (
              <col key={c} style={{ width: 130 }} />
            ))}
            <col style={{ width: ACTIONS_COL_WIDTH }} />
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  background: 'var(--crm-surface)',
                  borderBottom: '1px solid var(--crm-border-strong)',
                  textAlign: 'left',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--crm-text-secondary)',
                  fontWeight: 500,
                  ...nameShadow,
                }}
                className={cellPad}
              >
                <div className="flex items-center gap-2">
                  <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Select all leads" />
                  Lead
                </div>
              </th>
              {['Property', 'BHK', 'Agent / Status', 'Follow-up'].map((label, i) => (
                <th
                  key={label}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    background: 'var(--crm-surface)',
                    borderBottom: '1px solid var(--crm-border-strong)',
                    textAlign: i === 1 ? 'right' : 'left',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--crm-text-secondary)',
                    fontWeight: 500,
                  }}
                  className={cellPad}
                >
                  {label}
                </th>
              ))}
              {optionalCols.map((c) => (
                <th
                  key={c}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    background: 'var(--crm-surface)',
                    borderBottom: '1px solid var(--crm-border-strong)',
                    textAlign: 'left',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--crm-text-secondary)',
                    fontWeight: 500,
                  }}
                  className={cellPad}
                >
                  {OPTIONAL_COLUMN_LABELS[c]}
                </th>
              ))}
              <th
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  background: 'var(--crm-surface)',
                  borderBottom: '1px solid var(--crm-border-strong)',
                }}
                className={`${cellPad} crm-table-actions`}
              >Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} rowHeight={rowHeight} colCount={colCount} />)
              : leads.map((lead) => {
                  const stripeColor = SOURCE_STRIPE_VAR[lead.source] ?? 'transparent';
                  const isSelected = selectedIds.has(lead.id);
                  const followUp = followUpOrActivity(lead);
                  const followUpTooltip = lead.next_follow_up_at
                    ? formatAbsoluteDateTime(lead.next_follow_up_at)
                    : lead.last_activity_at
                      ? formatAbsoluteDateTime(lead.last_activity_at)
                      : null;

                  const isHighlighted = lead.id === highlightId;
                  const phone = leadPhone(lead);
                  return (
                    <tr
                      key={lead.id}
                      className={`group cursor-pointer ${isSelected ? 'crm-row-selected' : ''}`}
                      style={{
                        height: rowHeight,
                        borderBottom: '1px solid var(--crm-border)',
                        background: isHighlighted ? 'var(--crm-last-contacted-bg)' : undefined,
                      }}
                      title={isHighlighted ? 'You were just contacting this lead' : undefined}
                      onClick={() => onRowClick(lead.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onRowClick(lead.id);
                        }
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--crm-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isHighlighted ? 'var(--crm-last-contacted-bg)' : 'transparent')}
                    >
                      {/* Lead: stripe is a per-row inset shadow at the table's true left
                          edge (not a border, so border-collapse can never merge it into
                          one continuous line across rows) + checkbox (hover/selection
                          only — no separate reserved checkbox column) + name/phone. */}
                      <td
                        style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          background: isHighlighted ? 'var(--crm-last-contacted-bg)' : 'var(--crm-surface)',
                          boxShadow: `inset 3px 0 0 0 ${isHighlighted ? 'var(--crm-last-contacted-border)' : stripeColor}${scrolledX ? ', 4px 0 8px -4px rgba(0,0,0,0.15)' : ''}`,
                        }}
                        className={cellPad}
                        title={isHighlighted ? 'You were just contacting this lead' : `Source: ${SOURCE_LABELS[lead.source] ?? lead.source}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => onToggleOne(lead.id)} aria-label={`Select ${lead.name}`} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                style={{ fontSize: 14, fontWeight: 500, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                className="min-w-0 flex-1"
                              >
                                {titleCase(lead.name)}
                              </span>
                              {lead.other_interest_count > 0 && (
                                <MultiInterestBadge leadId={lead.id} count={lead.other_interest_count} />
                              )}
                            </div>
                            {!compact && (
                              <a
                                href={phone ? telHref(phone) : undefined}
                                onClick={(e) => e.stopPropagation()}
                                className="tabular-nums block truncate"
                                style={{
                                  fontSize: 12,
                                  lineHeight: '15px',
                                  marginTop: 1,
                                  color: phone ? 'var(--crm-text-secondary)' : 'var(--crm-text-muted)',
                                }}
                              >
                                {phone ?? '·'}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className={cellPad}>
                        <div className="min-w-0">
                          {lead.project_name ? (
                            <div style={{ fontSize: 14, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lead.project_name}
                            </div>
                          ) : (
                            <Empty />
                          )}
                          {!compact && lead.locality && (
                            <div
                              style={{
                                fontSize: 12,
                                lineHeight: '15px',
                                marginTop: 1,
                                color: 'var(--crm-text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {lead.locality}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className={cellPad} style={{ textAlign: 'right' }}>
                        {lead.configuration ? <span className="tabular-nums text-sm">{lead.configuration}</span> : <Empty />}
                      </td>

                      <td className={cellPad}>
                        <div className="min-w-0">
                          {lead.agent_name ? (
                            <Truncated className="text-sm">{lead.agent_name}</Truncated>
                          ) : (
                            <span className="text-sm italic" style={{ color: 'var(--crm-text-muted)' }}>
                              Unassigned
                            </span>
                          )}
                          <div className="mt-0.5">
                            <InlineStatusSelect lead={lead} onChanged={onChanged} onStatusUpdated={handleStatusUpdated} />
                          </div>
                        </div>
                      </td>

                      <td className={cellPad}>
                        <RelativeCell value={followUp} tooltip={followUpTooltip} />
                      </td>

                      {optionalCols.map((c) => (
                        <td key={c} className={cellPad}>
                          {renderOptionalCell(lead, c)}
                        </td>
                      ))}

                      {/* Actions: its own reserved column, always this width — the
                          icons fade in on hover but never spill into Follow-up. */}
                      <td className={`${cellPad} crm-table-actions`} style={{ width: ACTIONS_COL_WIDTH }}>
                        <RowActions lead={lead} onChanged={onChanged} onContact={handleContact} />
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Compact list below desktop: details open on tap; contact controls have reserved space. */}
      <div className="crm-mobile-leads lg:hidden" aria-label="Lead list">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="crm-mobile-lead-skeleton animate-pulse" />)
          : leads.map((lead) => {
              const phone = leadPhone(lead);
              const isHighlighted = lead.id === highlightId;
              const followUp = followUpOrActivity(lead);
              const stage = STATUS_LABELS[lead.status] ?? lead.status;
              const compactStage = lead.status === 'site_visit_scheduled' ? 'Visit set' : lead.status === 'site_visit_done' ? 'Visit done' : stage;
              return (
                <div
                  key={lead.id}
                  className={'crm-mobile-lead ' + (isHighlighted ? 'crm-mobile-lead--contacted' : '')}
                  style={{ '--lead-source-color': SOURCE_STRIPE_VAR[lead.source] ?? 'transparent' } as React.CSSProperties}
                >
                  <button type="button" className="crm-mobile-summary" onClick={() => onRowClick(lead.id)} aria-label={'Open ' + lead.name + ', ' + stage}>
                    <span className="crm-mobile-name">
                      <span className="crm-mobile-name-text">{titleCase(lead.name)}</span>
                      {lead.other_interest_count > 0 && <span className="crm-mobile-interest-count" title="Total enquiries">{lead.other_interest_count + 1}</span>}
                    </span>
                    <span className="crm-mobile-meta">
                      {phone && <span className="crm-mobile-phone">{phone}</span>}
                      <span className="crm-mobile-stage" title={stage}>
                        <span className="crm-mobile-status-dot" style={{ background: STATUS_DOT_VAR[lead.status] ?? 'var(--crm-status-new)' }} />
                        <span>{compactStage}</span>
                      </span>
                    </span>
                  </button>
                  <button type="button" className="crm-mobile-context" onClick={() => onRowClick(lead.id)} aria-label={'View property and follow-up for ' + lead.name}>
                    <span title={lead.project_name ?? lead.locality ?? ''}>{lead.project_name ?? lead.locality ?? 'No property set'}</span>
                    <span style={{ color: followUp?.overdue ? 'var(--crm-status-overdue)' : undefined }}>{followUp?.text ?? lead.agent_name ?? 'Unassigned'}</span>
                  </button>
                  <div className="crm-mobile-actions">
                    {phone ? <LeadContactActions phone={phone} name={lead.name} compact onContact={() => handleContact(lead.id)} /> : (
                      <button type="button" className="crm-mobile-open" onClick={() => onRowClick(lead.id)} aria-label={'View ' + lead.name}><ArrowUpRight size={18} /></button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
