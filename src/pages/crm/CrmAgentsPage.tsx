import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, UserX, UserCheck, Phone, ChevronDown } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../app/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../app/components/ui/dialog';
import { AgentFormDialog } from '../../app/components/crm/AgentFormDialog';
import { telHref } from '../../app/components/crm/crmVisuals';
import { deactivateAgent, listAgentsWithStats, updateAgent } from '../../services/crmApi';
import { AgentStats } from '../../types/crm';

interface ReassignPromptState {
  agent: AgentStats;
  openLeadsCount: number;
}

export const CrmAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentStats | null>(null);
  const [reassignPrompt, setReassignPrompt] = useState<ReassignPromptState | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('__unassigned__');

  const load = () => {
    setLoading(true);
    listAgentsWithStats(showInactive)
      .then(setAgents)
      .catch(() => toast.error('Could not load agents.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const openCreate = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  const openEdit = (agent: AgentStats) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  const handleReactivate = async (agent: AgentStats) => {
    try {
      await updateAgent(agent.id, { isActive: true });
      toast.success(`${agent.name} reactivated.`);
      load();
    } catch {
      toast.error('Could not reactivate agent.');
    }
  };

  const attemptDeactivate = async (agent: AgentStats, opts: { reassignToAgentId?: string | null; leaveUnassigned?: boolean } = {}) => {
    try {
      await deactivateAgent(agent.id, opts);
      toast.success(`${agent.name} deactivated.`);
      setReassignPrompt(null);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.error === 'NEEDS_REASSIGNMENT') {
        setReassignPrompt({ agent, openLeadsCount: data.openLeadsCount });
        setReassignTarget('__unassigned__');
        return;
      }
      toast.error(data?.error ?? 'Could not deactivate agent.');
    }
  };

  const confirmReassignAndDeactivate = () => {
    if (!reassignPrompt) return;
    const opts =
      reassignTarget === '__unassigned__'
        ? { leaveUnassigned: true }
        : { reassignToAgentId: reassignTarget };
    attemptDeactivate(reassignPrompt.agent, opts);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Agents</h2>
          <p className="text-sm text-muted-foreground">Manage who leads get assigned to.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Checkbox checked={showInactive} onCheckedChange={(v) => setShowInactive(!!v)} />
            Show inactive
          </label>
          <Button onClick={openCreate}>
            <UserPlus size={16} /> Add Agent
          </Button>
        </div>
      </div>

      {/* Mobile card list — below lg. Agents have phone numbers an admin
          might actually call, so this follows the same lg:hidden / tel:-link
          pattern as LeadsTable.tsx rather than a plain vertical table. */}
      <div className="space-y-2 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)
        ) : agents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-muted-foreground">No agents yet.</p>
        ) : (
          agents.map((a) => (
            <AgentCard
              key={a.id}
              agent={a}
              onEdit={() => openEdit(a)}
              onDeactivate={() => attemptDeactivate(a)}
              onReactivate={() => handleReactivate(a)}
            />
          ))
        )}
      </div>

      {/* Desktop table — lg and up, unchanged. */}
      <div className="hidden overflow-x-auto rounded-xl border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Total Leads</TableHead>
              <TableHead>Converted</TableHead>
              <TableHead>Conv. %</TableHead>
              <TableHead>Overdue Follow-ups</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : agents.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No agents yet.</TableCell></TableRow>
            ) : (
              agents.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email ?? '—'}</TableCell>
                  <TableCell>{a.phone ?? '—'}</TableCell>
                  <TableCell>
                    {a.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell>{a.total_leads}</TableCell>
                  <TableCell>{a.converted}</TableCell>
                  <TableCell>{a.conversion_rate}%</TableCell>
                  <TableCell>
                    {a.overdue_follow_ups > 0 ? <span className="font-medium text-red-600">{a.overdue_follow_ups}</span> : '0'}
                  </TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(a)}>
                        <Pencil size={13} />
                      </Button>
                      {a.is_active ? (
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Deactivate" onClick={() => attemptDeactivate(a)}>
                          <UserX size={13} />
                        </Button>
                      ) : (
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Reactivate" onClick={() => handleReactivate(a)}>
                          <UserCheck size={13} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AgentFormDialog open={formOpen} onClose={() => setFormOpen(false)} agent={editingAgent} onSaved={load} />

      <Dialog open={!!reassignPrompt} onOpenChange={(v) => !v && setReassignPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign open leads</DialogTitle>
          </DialogHeader>
          {reassignPrompt && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {reassignPrompt.agent.name} has {reassignPrompt.openLeadsCount} open lead
                {reassignPrompt.openLeadsCount === 1 ? '' : 's'}. Reassign them to…
              </p>
              <Select value={reassignTarget} onValueChange={setReassignTarget}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Leave unassigned</SelectItem>
                  {agents.filter((a) => a.is_active && a.id !== reassignPrompt.agent.id).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignPrompt(null)}>Cancel</Button>
            <Button onClick={confirmReassignAndDeactivate}>Reassign & deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Mobile agent card — tap to expand the fields that don't fit the collapsed
// row (email, created date, edit/deactivate actions). Overdue follow-ups is
// the one number that actually needs action, so it's the only stat shown at
// a glance; total/converted/conv.% is one compact line underneath.
const AgentCard: React.FC<{
  agent: AgentStats;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}> = ({ agent, onEdit, onDeactivate, onReactivate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
              aria-hidden="true"
            />
            <span className="truncate font-semibold text-gray-900">{agent.name}</span>
          </div>
          {agent.phone && (
            <a
              href={telHref(agent.phone)}
              onClick={(e) => e.stopPropagation()}
              className="tap-target -ml-1 mt-0.5 inline-flex items-center gap-1 pl-1 text-sm text-primary"
            >
              <Phone size={13} /> {agent.phone}
            </a>
          )}
          <p className="mt-1 text-xs text-gray-600">
            {agent.total_leads} leads · {agent.converted} converted · {agent.conversion_rate}% conv.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {agent.overdue_follow_ups > 0 ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {agent.overdue_follow_ups} overdue
            </span>
          ) : (
            <span className="text-xs text-gray-400">0 overdue</span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Email</span>
            <span className="text-gray-900">{agent.email ?? '—'}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Created</span>
            <span className="text-gray-900">{new Date(agent.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700"
            >
              <Pencil size={14} /> Edit
            </button>
            {agent.is_active ? (
              <button
                type="button"
                onClick={onDeactivate}
                className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600"
              >
                <UserX size={14} /> Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={onReactivate}
                className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-200 text-sm font-medium text-green-700"
              >
                <UserCheck size={14} /> Reactivate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
