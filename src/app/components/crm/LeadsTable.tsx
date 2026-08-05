import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, MoreHorizontal, Phone, Star, StickyNote, UploadCloud } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { LeadInterest, LeadListItem } from '../../../types/crm';
import { addLeadActivity, getLeadInterests, updateLead } from '../../../services/crmApi';
import {
  ACTIVITY_VERB,
  CALL_OUTCOMES,
  SOURCE_LABELS,
  SOURCE_STRIPE_VAR,
  STATUS_DOT_VAR,
  STATUS_LABELS,
  STATUS_OPTIONS,
  titleCase,
} from './crmVisuals';
import { formatAbsoluteDateTime, formatRelativeDate } from './relativeDate';
import { ColumnKey, Density, OPTIONAL_COLUMN_LABELS, OPTIONAL_COLUMNS } from './useLeadsTablePrefs';

function whatsappUrl(phone: string): string {
  return `https://wa.me/91${phone}`;
}

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
  if (fu) return { text: `Due ${fu.text}`, overdue: fu.overdue };
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

// Tomorrow 10am — matches FollowUpQuickPicker's own "Tomorrow" default, so a
// quick-logged outcome and a manually-picked follow-up date read the same.
function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

// Inline status dropdown — same guard rules as LeadDetailDrawer's status
// changer (lost reason required for closed_lost, optional deal value prompt
// for converted) so behavior doesn't diverge depending on where you edit
// from. Styled to read as plain text-plus-dot at rest, only revealing
// dropdown chrome on hover/focus.
const InlineStatusSelect: React.FC<{ lead: LeadListItem; onChanged: () => void }> = ({ lead, onChanged }) => {
  const [busy, setBusy] = useState(false);

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
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not update status.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Select value={lead.status} onValueChange={handleChange} disabled={busy}>
        <SelectTrigger
          size="sm"
          className="h-auto w-auto gap-1 border-0 bg-transparent px-0 py-0 text-xs shadow-none hover:bg-[var(--crm-surface-hover)] focus-visible:ring-1 data-[size=sm]:h-auto [&_svg]:opacity-0 hover:[&_svg]:opacity-50"
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
const RowActions: React.FC<{ lead: LeadListItem; onChanged: () => void }> = ({ lead, onChanged }) => {
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

  return (
    <div
      className="row-actions flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      {lead.phone && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone size={14} />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Call</TooltipContent>
        </Tooltip>
      )}
      {lead.phone && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={whatsappUrl(lead.phone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>WhatsApp</TooltipContent>
        </Tooltip>
      )}
      <Popover open={noteOpen} onOpenChange={setNoteOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Log call / add note">
            <StickyNote size={14} />
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

const ACTIONS_COL_WIDTH = 120;

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

  const compact = density === 'compact';
  const rowHeight = compact ? 40 : 52;
  const cellPad = compact ? 'py-1 px-2' : 'py-2 px-2';
  const optionalCols = OPTIONAL_COLUMNS.filter((c) => visibleColumns.has(c));
  const anySelected = selectedIds.size > 0;

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
        className="hidden lg:block"
        style={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 300px)',
          background: 'var(--crm-surface)',
          border: '1px solid var(--crm-border)',
          borderRadius: 8,
        }}
      >
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 14 }}>
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: 70 }} />
            <col style={{ width: '18%' }} />
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
                className={cellPad}
              />
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

                  return (
                    <tr
                      key={lead.id}
                      className="group cursor-pointer"
                      style={{ height: rowHeight, borderBottom: '1px solid var(--crm-border)' }}
                      onClick={() => onRowClick(lead.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(lead.id);
                        }
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--crm-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                          background: 'var(--crm-surface)',
                          boxShadow: `inset 3px 0 0 0 ${stripeColor}${scrolledX ? ', 4px 0 8px -4px rgba(0,0,0,0.15)' : ''}`,
                        }}
                        className={cellPad}
                        title={`Source: ${SOURCE_LABELS[lead.source] ?? lead.source}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={anySelected || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}
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
                                href={lead.phone ? `tel:${lead.phone}` : undefined}
                                onClick={(e) => e.stopPropagation()}
                                className="tabular-nums block truncate"
                                style={{
                                  fontSize: 12,
                                  lineHeight: '15px',
                                  marginTop: 1,
                                  color: lead.phone ? 'var(--crm-text-secondary)' : 'var(--crm-text-muted)',
                                }}
                              >
                                {lead.phone ?? '·'}
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
                            <InlineStatusSelect lead={lead} onChanged={onChanged} />
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
                      <td className={cellPad} style={{ width: ACTIONS_COL_WIDTH }}>
                        <RowActions lead={lead} onChanged={onChanged} />
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Card view — <1024px */}
      <div className="space-y-2 lg:hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)
          : leads.map((lead) => {
              const fu = formatRelativeDate(lead.next_follow_up_at);
              const stripeColor = SOURCE_STRIPE_VAR[lead.source] ?? 'transparent';
              return (
                <div
                  key={lead.id}
                  className="cursor-pointer"
                  style={{
                    background: 'var(--crm-surface)',
                    borderLeft: `4px solid ${stripeColor}`,
                    border: '1px solid var(--crm-border)',
                    borderLeftWidth: 4,
                    borderRadius: 6,
                    padding: 12,
                  }}
                  onClick={() => onRowClick(lead.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <p className="min-w-0 truncate text-sm font-semibold">{titleCase(lead.name)}</p>
                      {lead.other_interest_count > 0 && (
                        <MultiInterestBadge leadId={lead.id} count={lead.other_interest_count} />
                      )}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_DOT_VAR[lead.status] ?? 'var(--crm-status-new)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--crm-text-secondary)' }}>
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                    </span>
                  </div>
                  <p className="tabular-nums mt-0.5 text-sm" style={{ color: 'var(--crm-text-secondary)' }}>
                    {lead.phone ?? '·'}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--crm-text-secondary)' }}>
                    {[lead.locality, lead.configuration].filter(Boolean).join(' · ') || '·'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={lead.agent_name ? 'text-xs' : 'text-xs italic'}
                      style={{ color: lead.agent_name ? 'var(--crm-text-primary)' : 'var(--crm-text-muted)' }}
                    >
                      {lead.agent_name ?? 'Unassigned'}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="tap-target flex items-center justify-center rounded-full text-primary"
                          aria-label="Call"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={whatsappUrl(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tap-target flex items-center justify-center rounded-full text-emerald-600"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </a>
                      )}
                      <button type="button" className="tap-target flex items-center justify-center rounded-full" aria-label="More" onClick={() => onRowClick(lead.id)}>
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                  {fu && (
                    <p className="mt-1 text-xs" style={{ color: fu.overdue ? 'var(--crm-status-overdue)' : 'var(--crm-text-muted)' }}>
                      Follow-up: {fu.text}
                    </p>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};
