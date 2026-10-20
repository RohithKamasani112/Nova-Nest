import { LeadStatusSelect, useLeadStatuses } from './LeadStatusSelect';
import { CallOutcomePicker } from './CallOutcomePicker';
import { useCrmRefresh } from './useCrmRefresh';
import { useAuth } from '../../../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { CalendarDays, Mail, ExternalLink, Share2, MessageSquareText } from 'lucide-react';
import { LeadContactActions } from './LeadContactActions';
import { addLeadActivity, getLeadDetail, getLeadInterests, listAgents, updateLead } from '../../../services/crmApi';
import { CrmAgent, LeadActivity, LeadDetail, LeadInterest } from '../../../types/crm';
import { leadPhone, SOURCE_LABELS, STATUS_LABELS, telHref, tomorrowIso, titleCase } from './crmVisuals';
import { clearLastContacted, markLastContacted } from '../../../utils/lastContacted';
import { FollowUpQuickPicker } from './FollowUpQuickPicker';
import { AgentFormDialog } from './AgentFormDialog';

const ADD_NEW_AGENT = '__add_new__';

function formatFollowUp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

interface LeadDetailDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onShareProperties?: (clientName: string, clientPhone: string | null, leadId: string) => void;
}


const KNOWN_FIELDS = new Set(['__unparsed', 'notes']);

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ leadId, onClose, onChanged, onShareProperties }) => {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [interests, setInterests] = useState<LeadInterest[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canAssign = isAdmin || user?.role === 'telecaller';
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteFollowUp, setNoteFollowUp] = useState<string | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [promptNextFollowUp, setPromptNextFollowUp] = useState(false);
  const [followUpPromptLabel, setFollowUpPromptLabel] = useState('Set the next follow-up date:');
  const [savingNote, setSavingNote] = useState(false);
  const statusOptions = useLeadStatuses();
  const statusLabel = (value: string) => statusOptions.find(option => option.value === value)?.label ?? STATUS_LABELS[value] ?? value;
  const [loading, setLoading] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const load = (background = false) => {
    if (!leadId) return;
    if (!background) setLoading(true);
    getLeadDetail(leadId)
      .then((d) => {
        setLead(d.lead);
        setActivities(d.activities);
      })
      .catch((error) => { if (error?.response?.status === 404) { setLead(null); onClose(); } else if (!background) toast.error('Could not load lead details.'); })
      .finally(() => setLoading(false));
    getLeadInterests(leadId)
      .then((r) => setInterests(r.interests))
      .catch(() => setInterests([]));
  };

  useCrmRefresh(() => load(true), !!leadId);

  useEffect(() => {
    // This drawer is one persistent component instance whose `leadId` prop
    // just changes as different leads are opened — it never unmounts, so
    // none of its useState calls above reset themselves automatically.
    // Without this, closing a lead mid-way through setting a site visit
    // date (no date picked, Cancel not clicked either — just the X button)
    // left promptNextFollowUp/followUpPromptLabel stuck true/"Set the site
    // visit date:", and the very next lead opened — completely unrelated,
    // any status — would show that same prompt as if IT had just been set
    // to Site Visit Scheduled. Real bug report: a lead sitting at "new"
    // showing the site-visit-date prompt with no such status change made.
    setNoteText('');
    setNoteFollowUp(null);
    setEditingFollowUp(false);
    setPromptNextFollowUp(false);
    setFollowUpPromptLabel('Set the next follow-up date:');
    setEditingContact(false);
    setAddAgentOpen(false);
    load();
    if (leadId) listAgents().then(setAgents).catch(() => setAgents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    let reason = lead.lost_reason;
    if (status === 'closed_lost' && !reason) {
      reason = window.prompt('Why was this lead lost?')?.trim() ?? '';
      if (!reason) return;
    }

    let dealValue: number | undefined;
    if (status === 'converted' && !lead.deal_value) {
      const input = window.prompt(`Deal value for ${lead.name} (₹)? Leave blank to skip.`);
      if (input && input.trim()) {
        const parsed = Number(input);
        if (!Number.isNaN(parsed)) dealValue = parsed;
      }
    }

    try {
      await updateLead(lead.id, {
        status,
        lostReason: status === 'closed_lost' ? reason || undefined : undefined,
        dealValue,
      });
      toast.success('Status updated.');
      load(true);
      onChanged();
      // They've come back and acted on this lead — see utils/lastContacted.ts.
      clearLastContacted(lead.id);
      // "Site visit scheduled" without a date is what made the "Scheduled
      // Visits" filter/chip (ContactStatusChips.tsx) and the Today's Calls
      // panel useless for site visits specifically — next_follow_up_at is
      // what drives both, and nothing used to ask for it here. Same picker
      // handleMarkFollowUpDone already uses below, just prompted from a
      // different trigger.
      if (status === 'site_visit_scheduled') {
        setFollowUpPromptLabel('Set the site visit date:');
        setPromptNextFollowUp(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not update status.');
    }
  };

  const handleReassign = async (agentId: string) => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { agentId: agentId === '__unassigned__' ? null : agentId });
      toast.success('Team member reassigned.');
      load(true);
      onChanged();
    } catch {
      toast.error('Could not reassign team member.');
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim() || savingNote) return;
    setSavingNote(true);
    try {
      await addLeadActivity(lead.id, 'note', noteText.trim(), noteFollowUp ?? undefined);
      setNoteText('');
      setNoteFollowUp(null);
      toast.success('Note added.');
      load(true);
      onChanged();
    } catch {
      toast.error('Could not add note.');
    } finally { setSavingNote(false); }
  };

  // Outcome logging — same CALL_OUTCOMES + addLeadActivity pattern
  // as LeadsTable.tsx's row-level popover, surfaced here too since that
  // popover only reveals on hover and never appears on a touch device.
  const logOutcome = async (label: string, scheduleFollowUp: boolean) => {
    if (!lead) return;
    try {
      const setReminder = scheduleFollowUp && lead.status !== 'site_visit_scheduled';
      await addLeadActivity(lead.id, 'note', label, setReminder ? tomorrowIso() : undefined);
      toast.success(setReminder ? 'Logged — follow-up set for tomorrow.' : 'Logged.');
      load(true);
      onChanged();
    } catch {
      throw new Error('Could not log outcome.');
    }
  };

  const handleSetFollowUp = async (iso: string) => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { nextFollowUpAt: iso });
      toast.success('Follow-up updated.');
      setEditingFollowUp(false);
      setPromptNextFollowUp(false);
      load(true);
      onChanged();
    } catch {
      toast.error('Could not update follow-up.');
    }
  };

  const handleMarkFollowUpDone = async () => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { nextFollowUpAt: null });
      load(true);
      onChanged();
      setFollowUpPromptLabel('Set the next follow-up date:');
      setPromptNextFollowUp(true);
    } catch {
      toast.error('Could not clear follow-up.');
    }
  };

  const extraFields = lead ? Object.entries(lead.raw_data ?? {}).filter(([k, v]) => !KNOWN_FIELDS.has(k) && v !== null && v !== '') : [];
  const phone = lead ? leadPhone(lead) : null;

  return (
    <Sheet open={!!leadId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="crm-lead-drawer flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetDescription className="sr-only">Lead information, enquiry, follow-up and activity history.</SheetDescription>
        {loading || !lead ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
          <SheetHeader className="crm-record-header">
            <div className="crm-eyebrow">LEAD RECORD</div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="crm-avatar" aria-hidden="true">{lead.name.trim().slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <SheetTitle className="break-words text-xl font-semibold tracking-tight">{titleCase(lead.name)}</SheetTitle>
                {phone ? <a href={telHref(phone)} onClick={() => markLastContacted(lead.id)} className="mt-1 inline-block break-all text-sm font-medium underline underline-offset-2" aria-label={`Call ${lead.name} directly`}>{phone}</a> : <p className="mt-1 break-all text-sm text-muted-foreground">{lead.email ?? 'No contact information'}</p>}
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline">{SOURCE_LABELS[lead.source] ?? lead.source}</Badge>
                <Badge variant="secondary">{statusLabel(lead.status)}</Badge>
                {lead.is_duplicate && <Badge variant="destructive">Flagged duplicate</Badge>}
              </div>
            </SheetHeader>
          <div className="crm-record-body min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            {lead.message && (
              <section className="crm-enquiry" aria-label="Original enquiry">
                <p className="crm-section-label"><MessageSquareText size={15} aria-hidden="true" /> Original enquiry</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{lead.message}</p>
              </section>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="Project" value={lead.project_name} />
              <DetailField label="Lead date" value={lead.lead_date ? new Date(lead.lead_date).toLocaleDateString() : null} />
            </div>
            <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4" aria-label="Add a note">
              <label htmlFor="lead-note" className="mb-1.5 block text-sm font-semibold">Add note</label>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} id="lead-note" rows={3} disabled={savingNote} placeholder="Call notes, next steps..." />
              <div className="mt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Next follow-up (optional)</p>
                <FollowUpQuickPicker onPick={setNoteFollowUp} />
                {noteFollowUp && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Will set follow-up to {formatFollowUp(noteFollowUp)}{' '}
                    <button type="button" className="underline" onClick={() => setNoteFollowUp(null)}>
                      clear
                    </button>
                  </p>
                )}
              </div>
              <Button size="sm" className="mt-2" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                {savingNote ? 'Saving...' : 'Save note'}
              </Button>
            </section>

            <section className="space-y-2" aria-label="Lead status">
              <p className="text-sm font-semibold">Status</p>
              <LeadStatusSelect value={lead.status} onValueChange={handleStatusChange} />
              {promptNextFollowUp && followUpPromptLabel === 'Set the site visit date:' && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-sm font-medium">Select site visit date & time</p>
                  <FollowUpQuickPicker onPick={handleSetFollowUp} onCancel={() => setPromptNextFollowUp(false)} />
                </div>
              )}
            </section>


            <section className="crm-follow-up-card">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className="crm-section-label"><CalendarDays size={15} aria-hidden="true" /> {lead.status === 'site_visit_scheduled' ? 'Site visit' : 'Next follow-up'}</p>
                  {lead.next_follow_up_at ? (
                    <p className={`text-sm font-medium ${new Date(lead.next_follow_up_at) < new Date() ? 'text-red-600' : ''}`}>
                      {formatFollowUp(lead.next_follow_up_at)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not set</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* The only other way to get here is the Status dropdown
                      further down — "Site visit scheduled" is one option
                      among nine, easy to miss, especially on the sales
                      login where a rep's whole job is scheduling visits.
                      This does the exact same thing handleStatusChange
                      does for that option (set status, then the same date
                      prompt below), just as one obvious top-of-lead
                      button instead of a buried dropdown choice. */}
                  {lead.status !== 'site_visit_scheduled' && (
                    <Button className="crm-schedule-visit" size="sm" onClick={() => handleStatusChange('site_visit_scheduled')}>
                      <CalendarDays size={17} aria-hidden="true" /> Schedule visit
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEditingFollowUp((v) => !v)}>
                    {lead.next_follow_up_at ? 'Change' : 'Set'}
                  </Button>
                  {lead.next_follow_up_at && (
                    <Button variant="outline" size="sm" onClick={handleMarkFollowUpDone}>
                      Mark as done
                    </Button>
                  )}
                </div>
              </div>
              {(editingFollowUp || (promptNextFollowUp && followUpPromptLabel !== 'Set the site visit date:')) && (
                <div className="mt-2 border-t pt-2">
                  {promptNextFollowUp && <p className="mb-1.5 text-xs text-muted-foreground">{followUpPromptLabel}</p>}
                  <FollowUpQuickPicker
                    onPick={handleSetFollowUp}
                    onCancel={() => {
                      setEditingFollowUp(false);
                      setPromptNextFollowUp(false);
                    }}
                  />
                </div>
              )}
            </section>

            {/* Call/WhatsApp live in the sticky footer below (always in the
                thumb zone) — this row is for the less-frequent actions. */}
            <div className="flex flex-wrap gap-2">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                  <Mail size={16} className="shrink-0" /> <span className="truncate">{lead.email}</span>
                </a>
              )}
              {onShareProperties && (
                <button
                  type="button"
                  onClick={() => onShareProperties(lead.name, phone, lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <Share2 size={14} /> Share Properties
                </button>
              )}
            </div>

            <CallOutcomePicker key={`call-outcome-${lead.id}`} onLog={logOutcome} />

            <details key={`lead-details-${lead.id}`} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Show more lead details</summary>
              <div className="mt-4 space-y-4">
                <section className="rounded-lg border p-3" aria-label="Edit contact details">
                  {!editingContact ? (
                    <Button variant="outline" size="sm" onClick={() => { setContactName(lead.name ?? ''); setContactPhone(lead.phone ?? ''); setEditingContact(true); }}>Edit name / mobile</Button>
                  ) : (
                    <form className="space-y-3" onSubmit={async (event) => {
                      event.preventDefault();
                      if (savingContact) return;
                      setSavingContact(true);
                      try {
                        await updateLead(lead.id, { name: contactName.trim(), ...(contactPhone.trim() ? { phone: contactPhone.trim() } : {}) });
                        setEditingContact(false);
                        toast.success('Contact details updated.');
                        load(true);
                        onChanged();
                      } catch (error: any) {
                        toast.error(error?.response?.data?.error ?? 'Could not update contact details.');
                      } finally { setSavingContact(false); }
                    }}>
                      <label className="block text-sm">Name<Input required maxLength={200} value={contactName} onChange={event => setContactName(event.target.value)} disabled={savingContact} /></label>
                      <label className="block text-sm">Mobile number<Input type="tel" inputMode="tel" maxLength={30} placeholder="e.g. +91 98765 43210" value={contactPhone} onChange={event => setContactPhone(event.target.value)} disabled={savingContact} /></label>
                      <p className="text-xs text-muted-foreground">Leave mobile blank to keep the existing number.</p>
                      <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={savingContact}>{savingContact ? 'Saving...' : 'Save changes'}</Button><Button type="button" variant="outline" size="sm" disabled={savingContact} onClick={() => setEditingContact(false)}>Cancel</Button></div>
                    </form>
                  )}
                </section>


                <div className="crm-details-grid grid grid-cols-2 gap-4 text-sm">
                  <DetailField label="Locality" value={lead.locality} />
                  <DetailField label="Configuration" value={lead.configuration} />
                  <DetailField label="Price" value={lead.price_value ? `₹${Number(lead.price_value).toLocaleString('en-IN')}` : lead.price_raw} />
                  <DetailField label="Listing type" value={lead.listing_type} />
                  <DetailField label="Property type" value={lead.property_type} />
                  <DetailField label="Enquiries" value={String(lead.enquiry_count)} />
                  {lead.deal_value && <DetailField label="Deal value" value={`₹${Number(lead.deal_value).toLocaleString('en-IN')}`} />}
                  {lead.lost_reason && <DetailField label="Lost reason" value={lead.lost_reason} />}
                </div>

                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Team</label>
                    <Select
                      disabled={!canAssign}
                      value={lead.agent_id ?? '__unassigned__'}
                      onValueChange={(v) => (v === ADD_NEW_AGENT ? setAddAgentOpen(true) : handleReassign(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">Unassigned</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                        {isAdmin && <SelectItem value={ADD_NEW_AGENT} className="text-primary">+ Add new team member</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {interests.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">
                      Also enquired about {interests.length} other propert{interests.length === 1 ? 'y' : 'ies'}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {interests.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                          <span className="font-medium">{i.projectName ?? 'Unknown property'}</span>
                          <Badge variant="outline" className="shrink-0">
                            {SOURCE_LABELS[i.source] ?? i.source} · {new Date(i.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extraFields.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">Additional fields from source</p>
                    <div className="max-h-40 overflow-y-auto rounded-lg border p-2 text-xs">
                      {extraFields.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 py-0.5">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="text-right">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </details>

            <div>
              <p className="mb-1.5 text-sm font-semibold">Activity timeline</p>
              <div className="space-y-2">
                {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity yet.</p>}
                {activities.map((a) => (
                  <div key={a.id} className="crm-activity-item text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground">
                      <span className="font-medium capitalize">{a.type.replace(/_/g, ' ')}</span>
                      <span>{new Date(a.occurred_at).toLocaleString()}</span>
                    </div>
                    {a.type === 'status_change' && (
                      <p>
                        {a.from_status ? statusLabel(a.from_status) : '?'} {'?'} {a.to_status ? statusLabel(a.to_status) : ''}
                      </p>
                    )}
                    {a.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{a.content}</p>}
                  </div>
                ))}
              </div>
            </div>

            {lead.external_property_id && (
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground"
              >
                <ExternalLink size={12} /> Listing ID: {lead.external_property_id}
              </a>
            )}
          </div>

          {/* Sticky bottom action bar — Call/WhatsApp/Status always in the
              thumb zone regardless of scroll position, clearing the iOS
              home indicator via the safe-area inset. */}
          <div
            className="crm-record-footer shrink-0 border-t bg-background p-4"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <LeadContactActions phone={phone} name={lead.name} onContact={() => markLastContacted(lead.id)} />
            <div className="my-3 flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Lead stage</span>
            <LeadStatusSelect value={lead.status} onValueChange={handleStatusChange} label="Lead stage" className="min-w-0 w-full max-w-64 text-sm" />
            </div>
            <Button type="button" variant="outline" className="mb-2 w-full" onClick={() => document.getElementById('lead-note')?.focus()}><MessageSquareText size={16} /> Add note</Button>
          </div>
          </>
        )}
      </SheetContent>
      <AgentFormDialog
        open={addAgentOpen}
        onClose={() => setAddAgentOpen(false)}
        onSaved={(newAgent) => {
          setAgents((prev) => [...prev, newAgent]);
          handleReassign(newAgent.id);
        }}
      />
    </Sheet>
  );
};

const DetailField: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div className="min-w-0">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 break-words font-medium">{value || '—'}</div>
  </div>
);
