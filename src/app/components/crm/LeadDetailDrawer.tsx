import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Phone, Mail, ExternalLink, Share2 } from 'lucide-react';
import { addLeadActivity, getLeadDetail, getLeadInterests, listAgents, updateLead } from '../../../services/crmApi';
import { CrmAgent, LeadActivity, LeadDetail, LeadInterest } from '../../../types/crm';
import { SOURCE_LABELS } from './crmVisuals';
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

const STATUS_OPTIONS = [
  'new', 'contacted', 'follow_up', 'site_visit_scheduled', 'site_visit_done',
  'negotiation', 'converted', 'closed_lost', 'junk',
];

const LOST_REASONS = ['Budget mismatch', 'Location mismatch', 'Bought elsewhere', 'Not responding', 'Postponed', 'Broker/spam', 'Other'];

const KNOWN_FIELDS = new Set(['__unparsed', 'notes']);

function whatsappUrl(phone: string): string {
  return `https://wa.me/91${phone}`;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ leadId, onClose, onChanged, onShareProperties }) => {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [interests, setInterests] = useState<LeadInterest[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteFollowUp, setNoteFollowUp] = useState<string | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [promptNextFollowUp, setPromptNextFollowUp] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  const load = () => {
    if (!leadId) return;
    setLoading(true);
    getLeadDetail(leadId)
      .then((d) => {
        setLead(d.lead);
        setActivities(d.activities);
      })
      .catch(() => toast.error('Could not load lead details.'))
      .finally(() => setLoading(false));
    getLeadInterests(leadId)
      .then((r) => setInterests(r.interests))
      .catch(() => setInterests([]));
  };

  useEffect(() => {
    load();
    if (leadId) listAgents().then(setAgents).catch(() => setAgents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    if (status === 'closed_lost' && !lead.lost_reason && !lostReason) {
      toast.error('Pick a lost reason first.');
      return;
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
        lostReason: status === 'closed_lost' ? lostReason || undefined : undefined,
        dealValue,
      });
      toast.success('Status updated.');
      load();
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not update status.');
    }
  };

  const handleReassign = async (agentId: string) => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { agentId: agentId === '__unassigned__' ? null : agentId });
      toast.success('Agent reassigned.');
      load();
      onChanged();
    } catch {
      toast.error('Could not reassign agent.');
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return;
    try {
      await addLeadActivity(lead.id, 'note', noteText.trim(), noteFollowUp ?? undefined);
      setNoteText('');
      setNoteFollowUp(null);
      load();
      onChanged();
    } catch {
      toast.error('Could not add note.');
    }
  };

  const handleSetFollowUp = async (iso: string) => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { nextFollowUpAt: iso });
      toast.success('Follow-up updated.');
      setEditingFollowUp(false);
      setPromptNextFollowUp(false);
      load();
      onChanged();
    } catch {
      toast.error('Could not update follow-up.');
    }
  };

  const handleMarkFollowUpDone = async () => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { nextFollowUpAt: null });
      load();
      onChanged();
      setPromptNextFollowUp(true);
    } catch {
      toast.error('Could not clear follow-up.');
    }
  };

  const extraFields = lead ? Object.entries(lead.raw_data ?? {}).filter(([k, v]) => !KNOWN_FIELDS.has(k) && v !== null && v !== '') : [];

  return (
    <Sheet open={!!leadId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {loading || !lead ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6 p-4">
            <SheetHeader className="p-0">
              <SheetTitle>{lead.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline">{lead.source}</Badge>
                <Badge>{lead.status.replace(/_/g, ' ')}</Badge>
                {lead.is_duplicate && <Badge variant="destructive">Flagged duplicate</Badge>}
              </div>
            </SheetHeader>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Next follow-up</p>
                  {lead.next_follow_up_at ? (
                    <p className={`text-sm font-medium ${new Date(lead.next_follow_up_at) < new Date() ? 'text-red-600' : ''}`}>
                      {formatFollowUp(lead.next_follow_up_at)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not set</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
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
              {(editingFollowUp || promptNextFollowUp) && (
                <div className="mt-2 border-t pt-2">
                  {promptNextFollowUp && <p className="mb-1.5 text-xs text-muted-foreground">Set the next follow-up date:</p>}
                  <FollowUpQuickPicker
                    onPick={handleSetFollowUp}
                    onCancel={() => {
                      setEditingFollowUp(false);
                      setPromptNextFollowUp(false);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {lead.phone && (
                <>
                  <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    <Phone size={14} /> {lead.phone}
                  </a>
                  <a href={whatsappUrl(lead.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-emerald-700 hover:bg-accent">
                    WhatsApp
                  </a>
                </>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                  <Mail size={14} /> {lead.email}
                </a>
              )}
              {onShareProperties && (
                <button
                  type="button"
                  onClick={() => onShareProperties(lead.name, lead.phone, lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <Share2 size={14} /> Share Properties
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailField label="Project" value={lead.project_name} />
              <DetailField label="Locality" value={lead.locality} />
              <DetailField label="Configuration" value={lead.configuration} />
              <DetailField label="Price" value={lead.price_value ? `₹${Number(lead.price_value).toLocaleString('en-IN')}` : lead.price_raw} />
              <DetailField label="Listing type" value={lead.listing_type} />
              <DetailField label="Property type" value={lead.property_type} />
              <DetailField label="Lead date" value={lead.lead_date ? new Date(lead.lead_date).toLocaleDateString() : null} />
              <DetailField label="Enquiries" value={String(lead.enquiry_count)} />
              {lead.deal_value && <DetailField label="Deal value" value={`₹${Number(lead.deal_value).toLocaleString('en-IN')}`} />}
              {lead.lost_reason && <DetailField label="Lost reason" value={lead.lost_reason} />}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <Select value={lead.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lead.status !== 'closed_lost' && (
                  <Select value={lostReason} onValueChange={setLostReason}>
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="Lost reason (if closing)" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOST_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Agent</label>
                <Select
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
                    <SelectItem value={ADD_NEW_AGENT} className="text-primary">+ Add new agent</SelectItem>
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

            <div>
              <p className="mb-1.5 text-sm font-semibold">Add note</p>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Call notes, next steps..." />
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Next follow-up (optional)</p>
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
              <Button size="sm" className="mt-2" onClick={handleAddNote} disabled={!noteText.trim()}>
                Add note
              </Button>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold">Activity timeline</p>
              <div className="space-y-2">
                {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity yet.</p>}
                {activities.map((a) => (
                  <div key={a.id} className="rounded-lg border p-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium capitalize">{a.type.replace(/_/g, ' ')}</span>
                      <span>{new Date(a.occurred_at).toLocaleString()}</span>
                    </div>
                    {a.type === 'status_change' && (
                      <p>
                        {a.from_status ?? '—'} → {a.to_status}
                      </p>
                    )}
                    {a.content && <p className="mt-0.5">{a.content}</p>}
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
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium">{value || '—'}</div>
  </div>
);
