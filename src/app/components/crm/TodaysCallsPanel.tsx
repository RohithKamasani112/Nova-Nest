import React, { useEffect, useState } from 'react';
import { useCrmRefresh } from './useCrmRefresh';
import toast from 'react-hot-toast';
import { StickyNote, CalendarClock, Check, PhoneCall, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { FollowUpQuickPicker } from './FollowUpQuickPicker';
import { addLeadActivity, getTodaysCalls, listAgents, updateLead } from '../../../services/crmApi';
import { CrmAgent, LeadListItem, LeadFiltersState, CrmSource } from '../../../types/crm';
import { leadPhone, titleCase } from './crmVisuals';
import { LeadContactActions } from './LeadContactActions';
import { markLastContacted } from '../../../utils/lastContacted';

function daysLate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day late';
  return `${days} days late`;
}

interface RowProps {
  lead: LeadListItem;
  onChanged: () => void;
  /** Suppressed inside the "Site Visits Today" group — the section header
   * already says so, repeating it on every row is just noise there. */
  showSiteVisitTag?: boolean;
}

const CallRow: React.FC<RowProps> = ({ lead, onChanged, showSiteVisitTag = true }) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const handleAddNote = async () => {
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

  const handleReschedule = async (iso: string) => {
    try {
      await updateLead(lead.id, { nextFollowUpAt: iso });
      toast.success('Follow-up rescheduled.');
      setRescheduleOpen(false);
      onChanged();
    } catch {
      toast.error('Could not reschedule.');
    }
  };

  const handleMarkDone = async () => {
    try {
      await updateLead(lead.id, { nextFollowUpAt: null });
      toast.success('Marked done.');
      onChanged();
    } catch {
      toast.error('Could not update.');
    }
  };

  const phone = leadPhone(lead);

  return (
    <div className="crm-reminder-row">
      <div className="crm-reminder-summary">
        <p className="crm-reminder-name" title={lead.name}>{titleCase(lead.name)}</p>
        <p className="crm-reminder-meta" title={[phone, lead.project_name, lead.agent_name].filter(Boolean).join(' · ')}>{phone ?? 'No phone'} · {lead.project_name ?? lead.agent_name ?? 'Unassigned'}</p>
        {lead.next_follow_up_at && <p className="crm-reminder-time">{showSiteVisitTag && lead.status === 'site_visit_scheduled' ? 'Site visit · ' : ''}{daysLate(lead.next_follow_up_at)} · {new Date(lead.next_follow_up_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</p>}
      </div>
      <div className="crm-reminder-actions">
        <LeadContactActions phone={phone} name={lead.name} compact onContact={() => markLastContacted(lead.id)} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="crm-reminder-more" aria-label={'More reminder actions for ' + lead.name}><MoreHorizontal size={18} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="crm-workspace">
            <DropdownMenuItem onSelect={() => setNoteOpen(true)}><StickyNote size={16} /> Add call note</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRescheduleOpen(true)}><CalendarClock size={16} /> Reschedule</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleMarkDone}><Check size={16} /> Mark done</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="crm-workspace crm-reminder-dialog">
          <DialogHeader><DialogTitle>Add call note</DialogTitle><DialogDescription>{lead.name}</DialogDescription></DialogHeader>
          <Textarea aria-label="Call note" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="What did you discuss?" />
          <Button onClick={handleAddNote} disabled={!noteText.trim()}>Save note</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="crm-workspace crm-reminder-dialog">
          <DialogHeader><DialogTitle>Reschedule reminder</DialogTitle><DialogDescription>Choose the next follow-up for {lead.name}.</DialogDescription></DialogHeader>
          <FollowUpQuickPicker onPick={handleReschedule} onCancel={() => setRescheduleOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TodaysCallsPanelProps {
  onViewAll: (filters: LeadFiltersState) => void;
  /**
   * Sales-login scoping (see SalesLeadsPage.tsx) — when set, this panel is
   * fixed to that agent's calls (or 'all' for no filter, same meaning as
   * picking "All leads" at sales-home) and hides the agent picker entirely,
   * so a sales person locked to their own leads can't browse someone else's
   * calls through this panel's own dropdown. Omitted (default), this
   * behaves exactly as before — full admin view, picker visible, defaults
   * to all agents.
   */
  agentScope?: string;
  sourceScope?: CrmSource | CrmSource[];
}

export const TodaysCallsPanel: React.FC<TodaysCallsPanelProps> = ({ onViewAll, agentScope, sourceScope }) => {
  const [overdue, setOverdue] = useState<LeadListItem[]>([]);
  const [dueToday, setDueToday] = useState<LeadListItem[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [agentId, setAgentId] = useState<string>(() => (agentScope === undefined || agentScope === 'all' ? '__all__' : agentScope));
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (agentScope !== undefined) return; // fixed scope — no picker, nothing to populate it with
    listAgents().then(setAgents).catch(() => setAgents([]));
  }, [agentScope]);

  const load = (background = false) => {
    if (!background) setLoading(true);
    setLoadError(false);
    getTodaysCalls(agentId === '__all__' ? undefined : agentId)
      .then((r) => {
        setOverdue(r.overdue.filter(lead => !sourceScope || (Array.isArray(sourceScope) ? sourceScope.includes(lead.source as CrmSource) : lead.source === sourceScope)));
        setDueToday(r.dueToday.filter(lead => !sourceScope || (Array.isArray(sourceScope) ? sourceScope.includes(lead.source as CrmSource) : lead.source === sourceScope)));
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useCrmRefresh(() => load(true));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, sourceScope]);

  const total = overdue.length + dueToday.length;
  // Site visits scheduled for today get their own call-to-action group
  // instead of blending into the generic "Due Today" list — a scheduled
  // visit reads as "call to confirm they're still coming", not just
  // another routine follow-up call.
  const siteVisitsToday = dueToday.filter((l) => l.status === 'site_visit_scheduled');
  const otherDueToday = dueToday.filter((l) => l.status !== 'site_visit_scheduled');
  const viewReminders = (followUp: 'overdue' | 'due_today', visitsOnly = false) => onViewAll({
    followUp,
    ...(agentId !== '__all__' ? { agentId: [agentId] } : {}),
    ...(visitsOnly ? { status: ['site_visit_scheduled'] } : {}),
  });

  if (loading) {
    return <div className="crm-calls-panel rounded-xl border bg-white p-4 text-sm text-muted-foreground">Loading today's calls...</div>;
  }

  if (loadError) return <div className="crm-calls-panel crm-reminder-error" role="alert"><span>Could not load daily reminders.</span><Button variant="outline" onClick={() => load()}>Retry</Button></div>;


  return (
    <div className="crm-calls-panel rounded-xl border bg-white p-4">
      <div className="crm-reminders-header">
        <button type="button" className="crm-reminders-toggle" aria-expanded={!collapsed} aria-label="Toggle daily reminders" onClick={() => setCollapsed((v) => !v)}>
          <PhoneCall size={16} />
          <span className="font-semibold text-gray-900">Daily reminders <span className="crm-reminders-count">{total}</span></span><ChevronDown size={16} className={collapsed ? '-rotate-90' : ''} />
        </button>
        <div className="crm-reminders-controls">
          {agentScope === undefined && (
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger aria-label="Reminder agent" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All team members</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="tap-target" onClick={() => viewReminders(overdue.length ? 'overdue' : 'due_today')}>{overdue.length ? 'View overdue' : 'View today'}</Button>
        </div>
      </div>

      {!collapsed && (
        <div className="crm-reminders-groups">
          {total === 0 && <p className="text-sm text-muted-foreground">No calls due for the selected team. You can switch team members above.</p>}
          {overdue.length > 0 && (
            <div>
              <p className="crm-reminders-group-label crm-reminders-group-label--overdue">Overdue ({overdue.length})</p>
              <div>{overdue.map((lead) => <CallRow key={lead.id} lead={lead} onChanged={load} />)}</div>
            </div>
          )}
          {siteVisitsToday.length > 0 && (
            <div>
              <p className="crm-reminders-group-label">
                Site visits today ({siteVisitsToday.length})
                <button type="button" className="crm-reminders-group-link" onClick={() => viewReminders('due_today', true)}>View visits</button>
              </p>
              <div>
                {siteVisitsToday.map((lead) => (
                  <CallRow key={lead.id} lead={lead} onChanged={load} showSiteVisitTag={false} />
                ))}
              </div>
            </div>
          )}
          {otherDueToday.length > 0 && (
            <div>
              <p className="crm-reminders-group-label">Due Today ({otherDueToday.length})<button type="button" className="crm-reminders-group-link" onClick={() => viewReminders('due_today')}>View today</button></p>
              <div>{otherDueToday.map((lead) => <CallRow key={lead.id} lead={lead} onChanged={load} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
