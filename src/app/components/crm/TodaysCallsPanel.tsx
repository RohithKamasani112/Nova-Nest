import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Phone, MessageCircle, StickyNote, CalendarClock, Check, PhoneCall } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { FollowUpQuickPicker } from './FollowUpQuickPicker';
import { addLeadActivity, getTodaysCalls, listAgents, updateLead } from '../../../services/crmApi';
import { CrmAgent, LeadListItem } from '../../../types/crm';

function whatsappUrl(phone: string): string {
  return `https://wa.me/91${phone}`;
}

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
}

const CallRow: React.FC<RowProps> = ({ lead, onChanged }) => {
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

  return (
    <div className="flex flex-wrap items-center gap-2 border-b py-2 text-sm last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lead.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.phone ?? '—'} · {lead.project_name ?? '—'} · {lead.agent_name ?? 'Unassigned'}
        </p>
      </div>
      {lead.next_follow_up_at && (
        <span className="shrink-0 text-xs text-muted-foreground">{daysLate(lead.next_follow_up_at)}</span>
      )}
      <div className="flex shrink-0 items-center gap-1">
        {lead.phone && (
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <a href={`tel:${lead.phone}`} title="Call"><Phone size={13} /></a>
          </Button>
        )}
        {lead.phone && (
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <a href={whatsappUrl(lead.phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp"><MessageCircle size={13} /></a>
          </Button>
        )}
        <Popover open={noteOpen} onOpenChange={setNoteOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-7 w-7" title="Add note"><StickyNote size={13} /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-2" align="end">
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Call notes..." />
            <Button size="sm" className="w-full" onClick={handleAddNote} disabled={!noteText.trim()}>Save note</Button>
          </PopoverContent>
        </Popover>
        <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-7 w-7" title="Reschedule"><CalendarClock size={13} /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <FollowUpQuickPicker onPick={handleReschedule} onCancel={() => setRescheduleOpen(false)} />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-7 w-7" title="Mark done" onClick={handleMarkDone}>
          <Check size={13} />
        </Button>
      </div>
    </div>
  );
};

interface TodaysCallsPanelProps {
  onViewAll: () => void;
}

export const TodaysCallsPanel: React.FC<TodaysCallsPanelProps> = ({ onViewAll }) => {
  const [overdue, setOverdue] = useState<LeadListItem[]>([]);
  const [dueToday, setDueToday] = useState<LeadListItem[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [agentId, setAgentId] = useState<string>('__all__');
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    listAgents().then(setAgents).catch(() => setAgents([]));
  }, []);

  const load = () => {
    setLoading(true);
    getTodaysCalls(agentId === '__all__' ? undefined : agentId)
      .then((r) => {
        setOverdue(r.overdue);
        setDueToday(r.dueToday);
      })
      .catch(() => toast.error('Could not load today’s calls.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const total = overdue.length + dueToday.length;

  if (loading) {
    return <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">Loading today's calls...</div>;
  }

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-white p-4 text-sm text-muted-foreground">
        <PhoneCall size={16} /> No calls due — you're all caught up.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className="flex items-center gap-2 text-left" onClick={() => setCollapsed((v) => !v)}>
          <PhoneCall size={16} />
          <span className="font-semibold text-gray-900">Calls Today — {total} lead{total === 1 ? '' : 's'}</span>
        </button>
        <div className="flex items-center gap-2">
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All agents</SelectItem>
              {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onViewAll}>View all</Button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-4">
          {overdue.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">Overdue ({overdue.length})</p>
              <div>{overdue.map((lead) => <CallRow key={lead.id} lead={lead} onChanged={load} />)}</div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Today ({dueToday.length})</p>
              <div>{dueToday.map((lead) => <CallRow key={lead.id} lead={lead} onChanged={load} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
